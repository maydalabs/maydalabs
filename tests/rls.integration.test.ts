/*
 * RLS and grants integration tests against the LOCAL Supabase stack.
 *
 * Skipped automatically unless the local stack env vars are present
 * (`npx supabase start`, keys in .env.local / the environment). Positive
 * and negative cases are exercised through the real Data API with real
 * user sessions; operator membership is provisioned by SQL through the
 * local database container, exactly as it would be managed in operation.
 */

import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { runDueWorkflows } from "@/lib/osWorker";
import { buildCompanyContext, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { runCofounderTurn } from "@/lib/osCofounderRun";

/* A model that says exactly what a test needs it to say, one scripted round
 * at a time. The loop above it — tool calls, capping, accounting — is the
 * part worth testing, and none of it should cost anything to test. */
function fakeTurn(rounds: ModelEvent[][]): ModelTurn {
  let round = 0;
  return async function* () {
    const script = rounds[Math.min(round, rounds.length - 1)];
    round += 1;
    for (const event of script) yield event;
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const isLocalStack = Boolean(
  url?.includes("127.0.0.1") && publishableKey && secretKey,
);

const DB_CONTAINER = "supabase_db_maydalabs";

function runSql(sql: string) {
  execFileSync("docker", [
    "exec",
    DB_CONTAINER,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    sql,
  ]);
}

type Db = SupabaseClient<Database>;

function anonClient(): Db {
  return createClient<Database>(url!, publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!isLocalStack)("row-level security", () => {
  const suffix = Date.now().toString(36);
  const emailA = `rls-user-a-${suffix}@example.com`;
  const emailB = `rls-user-b-${suffix}@example.com`;
  const password = "rls-test-password-1";

  let admin: Db;
  let userA: Db;
  let userB: Db;
  let idA: string;
  let idB: string;
  let mapAId: string;
  let intakeId: string;

  beforeAll(async () => {
    admin = createClient<Database>(url!, secretKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const createdA = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
    const createdB = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });
    if (!createdA.data.user || !createdB.data.user) {
      throw new Error("test users could not be created");
    }
    idA = createdA.data.user.id;
    idB = createdB.data.user.id;

    userA = anonClient();
    userB = anonClient();
    const signInA = await userA.auth.signInWithPassword({ email: emailA, password });
    const signInB = await userB.auth.signInWithPassword({ email: emailB, password });
    if (signInA.error || signInB.error) throw new Error("test sign-in failed");
  });

  afterAll(async () => {
    if (idA) await admin.auth.admin.deleteUser(idA);
    if (idB) await admin.auth.admin.deleteUser(idB);
  });

  describe("anon role", () => {
    it("cannot read any protected table", async () => {
      const anon = anonClient();
      for (const table of ["multiplier_maps", "lead_intakes", "subscriptions", "profiles"] as const) {
        const { data, error } = await anon.from(table).select("*");
        expect(error ?? data, `anon select on ${table}`).toSatisfy(
          (value: unknown) => value !== null && (!Array.isArray(value) || value.length === 0),
        );
        // Either an explicit permission error or an empty result is
        // acceptable; rows must never come back.
        if (Array.isArray(data)) expect(data).toHaveLength(0);
      }
    });

    it("cannot insert a lead intake directly", async () => {
      const anon = anonClient();
      const { error } = await anon.from("lead_intakes").insert({
        name: "Anon Bot",
        email: "bot@example.com",
      });
      expect(error).not.toBeNull();
    });
  });

  describe("multiplier_maps", () => {
    it("lets a user insert and read their own map", async () => {
      const { data, error } = await userA
        .from("multiplier_maps")
        .insert({
          user_id: idA,
          answers: { stage: "idea" },
          result: { path: "launch" },
          rubric_version: "test",
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      mapAId = data!.id;

      const { data: rows } = await userA.from("multiplier_maps").select("id");
      expect(rows?.map((row) => row.id)).toContain(mapAId);
    });

    it("blocks inserting a map that belongs to someone else", async () => {
      const { error } = await userA.from("multiplier_maps").insert({
        user_id: idB,
        answers: {},
        result: {},
        rubric_version: "test",
      });
      expect(error).not.toBeNull();
    });

    it("hides other users' maps and blocks cross-user update/delete", async () => {
      const { data: rows } = await userB.from("multiplier_maps").select("id");
      expect(rows ?? []).toHaveLength(0);

      const { data: updated } = await userB
        .from("multiplier_maps")
        .update({ status: "archived" })
        .eq("id", mapAId)
        .select("id");
      expect(updated ?? []).toHaveLength(0);

      const { data: deleted } = await userB
        .from("multiplier_maps")
        .delete()
        .eq("id", mapAId)
        .select("id");
      expect(deleted ?? []).toHaveLength(0);
    });
  });

  describe("profiles", () => {
    it("allows own-profile upsert and blocks impersonation", async () => {
      const { error } = await userA.from("profiles").upsert({ id: idA, display_name: "A" });
      expect(error).toBeNull();

      const { error: impersonation } = await userA
        .from("profiles")
        .insert({ id: idB, display_name: "not yours" });
      expect(impersonation).not.toBeNull();
    });
  });

  describe("lead_intakes and operators", () => {
    it("service credential inserts an intake; the owner can read it, others cannot", async () => {
      const { data, error } = await admin
        .from("lead_intakes")
        .insert({ user_id: idA, name: "Ada", email: emailA, consent_contact: true })
        .select("id")
        .single();
      expect(error).toBeNull();
      intakeId = data!.id;

      const { data: own } = await userA.from("lead_intakes").select("id");
      expect(own?.map((row) => row.id)).toContain(intakeId);

      const { data: foreign } = await userB.from("lead_intakes").select("id");
      expect(foreign ?? []).toHaveLength(0);
    });

    it("blocks review updates from non-operators", async () => {
      const { data } = await userB
        .from("lead_intakes")
        .update({ review_status: "reviewing" })
        .eq("id", intakeId)
        .select("id");
      expect(data ?? []).toHaveLength(0);
    });

    it("operator_status shows membership only to the operator themselves", async () => {
      runSql(`insert into internal.operators (user_id, label) values ('${idB}', 'test-operator');`);

      const { data: operatorSelf } = await userB.from("operator_status").select("user_id");
      expect(operatorSelf).toEqual([{ user_id: idB }]);

      const { data: nonOperator } = await userA.from("operator_status").select("user_id");
      expect(nonOperator ?? []).toHaveLength(0);
    });

    it("lets an operator read the queue and update review fields", async () => {
      const { data: queue } = await userB.from("lead_intakes").select("id");
      expect(queue?.map((row) => row.id)).toContain(intakeId);

      const { data: updated, error } = await userB
        .from("lead_intakes")
        .update({ review_status: "reviewing", internal_tags: ["test"] })
        .eq("id", intakeId)
        .select("id, review_status");
      expect(error).toBeNull();
      expect(updated).toEqual([{ id: intakeId, review_status: "reviewing" }]);
    });

    it("keeps operators away from non-review columns via column grants", async () => {
      const { error } = await userB
        .from("lead_intakes")
        .update({ email: "hijacked@example.com" })
        .eq("id", intakeId);
      expect(error).not.toBeNull();
    });
  });

  describe("subscriptions", () => {
    it("service inserts, owner reads and updates, others see nothing", async () => {
      const { error } = await admin.from("subscriptions").insert({
        user_id: idA,
        email: emailA,
        status: "pending",
      });
      expect(error).toBeNull();

      const { data: own } = await userA.from("subscriptions").select("email, status");
      expect(own).toEqual([{ email: emailA, status: "pending" }]);

      const { error: updateError } = await userA
        .from("subscriptions")
        .update({ status: "unsubscribed" })
        .eq("user_id", idA);
      expect(updateError).toBeNull();

      const { data: foreign } = await userB.from("subscriptions").select("id");
      expect(foreign ?? []).toHaveLength(0);
    });
  });
  describe("pilots (client vs operator)", () => {
    let pilotId: string;
    let publishedUpdateId: string;

    it("blocks non-operators from creating a pilot", async () => {
      const { error } = await userA.from("pilots").insert({
        client_email: emailA,
        company: "Client Co",
        workflow: "Weekly note",
      });
      expect(error).not.toBeNull();
    });

    it("lets an operator create a pilot attached to the client", async () => {
      const { data, error } = await userB
        .from("pilots")
        .insert({
          client_user_id: idA,
          client_email: emailA,
          company: "Client Co",
          workflow: "Weekly note",
          status: "operating",
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      pilotId = data!.id;
    });

    it("shows the client their own pilot but blocks status changes", async () => {
      const { data: own } = await userA.from("pilots").select("id, status");
      expect(own).toEqual([{ id: pilotId, status: "operating" }]);

      const { data: changed } = await userA
        .from("pilots")
        .update({ status: "completed" })
        .eq("id", pilotId)
        .select("id");
      expect(changed ?? []).toHaveLength(0);
    });

    it("shows the client only published updates; operators see drafts too", async () => {
      const { data: published, error: publishError } = await userB
        .from("pilot_updates")
        .insert({ pilot_id: pilotId, title: "Week 1", published: true, output_count: 12 })
        .select("id")
        .single();
      expect(publishError).toBeNull();
      publishedUpdateId = published!.id;

      const { error: draftError } = await userB
        .from("pilot_updates")
        .insert({ pilot_id: pilotId, title: "Draft", published: false });
      expect(draftError).toBeNull();

      const { data: clientView } = await userA
        .from("pilot_updates")
        .select("id, title")
        .eq("pilot_id", pilotId);
      expect(clientView).toEqual([{ id: publishedUpdateId, title: "Week 1" }]);

      const { data: operatorView } = await userB
        .from("pilot_updates")
        .select("id")
        .eq("pilot_id", pilotId);
      expect(operatorView).toHaveLength(2);
    });

    it("keeps a draft proposal invisible to the client and shows it once published", async () => {
      const { error: clientWrite } = await userA
        .from("pilot_proposals")
        .insert({ pilot_id: pilotId, headline: "Not mine to write", angle: "x" });
      expect(clientWrite).not.toBeNull();

      const { data: created, error } = await userB
        .from("pilot_proposals")
        .upsert(
          {
            pilot_id: pilotId,
            headline: "Prepared for Client Co",
            angle: "Because your weekly note stopped in August.",
            observations: [{ text: "Newsletter paused", source_url: "https://example.com/archive", source_label: "Archive" }],
            scope: [{ label: "Week 1", title: "Scope", detail: null }],
            published: false,
          },
          { onConflict: "pilot_id" },
        )
        .select("id, published")
        .single();
      expect(error).toBeNull();
      expect(created?.published).toBe(false);

      const { data: hidden } = await userA.from("pilot_proposals").select("id").eq("pilot_id", pilotId);
      expect(hidden ?? []).toHaveLength(0);

      const { error: publishError } = await userB
        .from("pilot_proposals")
        .update({ published: true })
        .eq("id", created!.id);
      expect(publishError).toBeNull();

      const { data: visible } = await userA
        .from("pilot_proposals")
        .select("id, headline")
        .eq("pilot_id", pilotId);
      expect(visible).toEqual([{ id: created!.id, headline: "Prepared for Client Co" }]);

      const { data: tampered } = await userA
        .from("pilot_proposals")
        .update({ headline: "hijacked" })
        .eq("id", created!.id)
        .select("id");
      expect(tampered ?? []).toHaveLength(0);
    });

    it("blocks clients from writing or deleting updates", async () => {
      const { error } = await userA
        .from("pilot_updates")
        .insert({ pilot_id: pilotId, title: "Not mine to write" });
      expect(error).not.toBeNull();

      const { data: deleted } = await userA
        .from("pilot_updates")
        .delete()
        .eq("id", publishedUpdateId)
        .select("id");
      expect(deleted ?? []).toHaveLength(0);
    });
  });

  describe("pilot_invoices (payment state is never client-writable)", () => {
    // One open invoice per address is enforced by a unique index, so the
    // fixture needs an address of its own on every run.
    const address = `bc1q${suffix}`.padEnd(42, "q");
    const emailC = `rls-user-c-${suffix}@example.com`;
    let userC: Db;
    let pilotId: string;
    let invoiceId: string;

    beforeAll(async () => {
      const createdC = await admin.auth.admin.createUser({
        email: emailC,
        password,
        email_confirm: true,
      });
      userC = createClient<Database>(url!, publishableKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await userC.auth.signInWithPassword({ email: emailC, password });
      expect(createdC.error).toBeNull();

      const { data: pilot } = await admin
        .from("pilots")
        .insert({
          client_user_id: idA,
          client_email: emailA,
          company: "Invoice Co",
          workflow: "Weekly note",
        })
        .select("id")
        .single();
      pilotId = pilot!.id;

      const { data: invoice } = await admin
        .from("pilot_invoices")
        .insert({
          pilot_id: pilotId,
          label: "Pilot fee",
          amount_usd: 2500,
          amount_sats: 2_500_000,
          rate_usd: 100_000,
          address,
          expires_at: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .select("id")
        .single();
      invoiceId = invoice!.id;
    });

    it("shows the client the invoice on their own pilot", async () => {
      const { data } = await userA.from("pilot_invoices").select("id, amount_sats").eq("id", invoiceId);
      expect(data).toEqual([{ id: invoiceId, amount_sats: 2_500_000 }]);
    });

    it("hides it from an unrelated signed-in user", async () => {
      const { data } = await userC.from("pilot_invoices").select("id");
      expect(data ?? []).toHaveLength(0);
    });

    it("blocks the client from marking their own invoice paid", async () => {
      const { data: tampered } = await userA
        .from("pilot_invoices")
        .update({ status: "paid", observed_sats: 2_500_000 })
        .eq("id", invoiceId)
        .select("id");
      expect(tampered ?? []).toHaveLength(0);

      const { data: after } = await admin.from("pilot_invoices").select("status").eq("id", invoiceId).single();
      expect(after!.status).toBe("open");
    });

    it("blocks the client from inventing an invoice, and from deleting one", async () => {
      const { error } = await userA.from("pilot_invoices").insert({
        pilot_id: pilotId,
        label: "Free money",
        amount_usd: 1,
        amount_sats: 1,
        rate_usd: 100_000,
        address,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      });
      expect(error).not.toBeNull();

      const { data: deleted } = await userA.from("pilot_invoices").delete().eq("id", invoiceId).select("id");
      expect(deleted ?? []).toHaveLength(0);
    });

    it("allows only one invoice awaiting payment per address", async () => {
      const { error } = await admin.from("pilot_invoices").insert({
        pilot_id: pilotId,
        label: "Second open invoice, same address",
        amount_usd: 10,
        amount_sats: 10_000,
        rate_usd: 100_000,
        address,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      });
      // A reused deposit address must never carry two invoices at once: one
      // arriving payment would otherwise settle both.
      expect(error).not.toBeNull();
    });

    it("lets an operator read every invoice and record what the chain showed", async () => {
      const { data: seen } = await userB.from("pilot_invoices").select("id").eq("id", invoiceId);
      expect(seen).toHaveLength(1);

      const { data: updated } = await userB
        .from("pilot_invoices")
        .update({ observed_sats: 1_000 })
        .eq("id", invoiceId)
        .select("observed_sats");
      expect(updated).toEqual([{ observed_sats: 1_000 }]);
    });
  });

  describe("MaydaOS beta (credits and runs are not self-serve)", () => {
    const emailOutsider = `rls-user-os-${suffix}@example.com`;
    let outsider: Db;
    let outsiderId: string;
    let runId: string;

    beforeAll(async () => {
      const created = await admin.auth.admin.createUser({ email: emailOutsider, password, email_confirm: true });
      outsiderId = created.data.user!.id;
      runSql(`insert into internal.os_beta_members (user_id) values ('${idA}');`);
      outsider = createClient<Database>(url!, publishableKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await outsider.auth.signInWithPassword({ email: emailOutsider, password });

      await admin.from("os_credits").upsert({ user_id: idA, granted: 10, used: 3 });
      const { data: run } = await admin
        .from("os_runs")
        .insert({
          user_id: idA,
          topic: "A topic",
          shape: "note",
          sources: [{ url: "https://example.com/a", title: "A", chars: 400 }],
          draft: "The original draft.",
          claims: [{ text: "A claim.", source_url: "https://example.com/a" }],
          input_tokens: 6000,
          output_tokens: 1000,
          cost_usd: 0.055,
        })
        .select("id")
        .single();
      runId = run!.id;
    });

    afterAll(async () => {
      if (outsiderId) await admin.auth.admin.deleteUser(outsiderId);
      await admin.from("os_workflows").delete().eq("key", `operator_made_${suffix}`);
    });

    it("shows live membership only to members and operators", async () => {
      expect((await userA.from("os_beta_status").select("*")).data).toEqual([{ user_id: idA }]);
      expect((await userB.from("os_beta_status").select("*")).data).toEqual([{ user_id: idB }]);
      expect((await outsider.from("os_beta_status").select("*")).data).toEqual([]);
      const anon = anonClient();
      expect((await anon.from("os_beta_status").select("*")).error).not.toBeNull();
    });

    it("denies a nonmember even their own historical beta data", async () => {
      await admin.from("os_credits").insert({ user_id: outsiderId });
      const { data: historical } = await admin.from("os_runs").insert({ user_id: outsiderId, topic: "Historical" }).select("id").single();
      for (const table of ["os_credits", "os_runs", "os_workflows"] as const) {
        const result = await outsider.from(table).select("*");
        expect(result.error).toBeNull();
        expect(result.data).toEqual([]);
      }
      const result = await outsider.from("os_runs").update({ decision: "approved" }).eq("id", historical!.id).select("id");
      expect(result.data).toEqual([]);
      expect((await admin.from("os_runs").select("decision").eq("id", historical!.id).single()).data?.decision).toBe("pending");
    });

    it("does not let account metadata or a writable view grant membership", async () => {
      await outsider.auth.updateUser({ data: { os_beta: true, role: "operator" } });
      expect((await outsider.from("os_beta_status").select("*")).data).toEqual([]);
      // The generated type correctly forbids writes to the UNION view; probe
      // a malicious direct API caller past that compile-time boundary too.
      // @ts-expect-error deliberately attempt a prohibited write
      expect((await outsider.from("os_beta_status").insert({ user_id: outsiderId })).error).not.toBeNull();
    });

    it("revokes access immediately without replacing the signed-in session", async () => {
      runSql(`delete from internal.os_beta_members where user_id = '${idA}';`);
      try {
        expect((await userA.from("os_beta_status").select("*")).data).toEqual([]);
        expect((await userA.from("os_runs").select("*")).data).toEqual([]);
        expect((await userA.from("os_credits").select("*")).data).toEqual([]);
        expect((await userA.from("os_workflows").select("*")).data).toEqual([]);
        const result = await userA.from("os_runs").update({ decision: "rejected" }).eq("id", runId).select("id");
        expect(result.data).toEqual([]);
      } finally {
        runSql(`insert into internal.os_beta_members (user_id) values ('${idA}');`);
      }
    });

    it("shows a person their own balance and hides everyone else's", async () => {
      const { data: own } = await userA.from("os_credits").select("granted, used");
      expect(own).toEqual([{ granted: 10, used: 3 }]);

      const { data: foreign } = await userB.from("os_credits").select("user_id").eq("user_id", idA);
      // userB is an operator in this suite, so they legitimately see it; a
      // plain signed-in stranger is covered by the run test below.
      expect(foreign).toHaveLength(1);
    });

    it("blocks a person from granting themselves credits", async () => {
      const { data: tampered } = await userA
        .from("os_credits")
        .update({ granted: 1000, used: 0 })
        .eq("user_id", idA)
        .select("granted");
      expect(tampered ?? []).toHaveLength(0);

      const { data: after } = await admin.from("os_credits").select("granted, used").eq("user_id", idA).single();
      expect(after).toEqual({ granted: 10, used: 3 });
    });

    it("lets a person record their own decision", async () => {
      const { data: decided } = await userA
        .from("os_runs")
        .update({ decision: "approved", decision_note: "Good enough." })
        .eq("id", runId)
        .select("decision");
      expect(decided).toEqual([{ decision: "approved" }]);
    });

    it("blocks a person from rewriting the draft or the cost of their own run", async () => {
      // Row-level security cannot restrict columns; the column grant does.
      const { error: draftError } = await userA
        .from("os_runs")
        .update({ draft: "Something I wrote myself." })
        .eq("id", runId);
      expect(draftError).not.toBeNull();

      const { error: costError } = await userA.from("os_runs").update({ cost_usd: 0 }).eq("id", runId);
      expect(costError).not.toBeNull();

      const { data: after } = await admin.from("os_runs").select("draft, cost_usd").eq("id", runId).single();
      expect(after!.draft).toBe("The original draft.");
      expect(Number(after!.cost_usd)).toBeCloseTo(0.055, 6);
    });

    it("lets a person record where their approved work landed, and only that", async () => {
      await admin.from("os_runs").update({ decision: "approved" }).eq("id", runId);

      const { data: recorded } = await userA
        .from("os_runs")
        .update({ published_url: "https://example.com/post", published_at: new Date().toISOString() })
        .eq("id", runId)
        .select("published_url");
      expect(recorded).toEqual([{ published_url: "https://example.com/post" }]);

      // The database refuses anything that is not a public https link, so a
      // recorded outcome always points somewhere a reader can check.
      const { error } = await admin
        .from("os_runs")
        .update({ published_url: "javascript:alert(1)" })
        .eq("id", runId);
      expect(error).not.toBeNull();
    });

    it("shows templates only to beta members and an installed workflow only to its owner", async () => {
      const { data: installed } = await admin
        .from("os_workflows")
        .insert({
          key: `client_only_${suffix}`,
          owner_user_id: idA,
          name: "Client only",
          purpose: "Installed for one client.",
          brief: "a note",
        })
        .select("id")
        .single();

      const { data: mine } = await userA.from("os_workflows").select("key");
      const keys = (mine ?? []).map((row) => row.key);
      expect(keys).toContain("short_note"); // a template
      expect(keys).toContain(`client_only_${suffix}`);

      const { data: theirs } = await outsider.from("os_workflows").select("key");
      const outsiderKeys = (theirs ?? []).map((row) => row.key);
      expect(outsiderKeys).toEqual([]);
      expect(outsiderKeys).not.toContain(`client_only_${suffix}`);

      // An operator can install one. Without this the negative cases below
      // would pass for the wrong reason: at one point nobody could write at
      // all, because the table grant was missing while the policy allowed it.
      const { data: byOperator, error: operatorError } = await userB
        .from("os_workflows")
        .insert({
          key: `operator_made_${suffix}`,
          name: "Operator made",
          purpose: "Installed by an operator.",
          brief: "a note",
          standing_sources: [{ url: "https://example.com/feed.xml", kind: "feed" }],
        })
        .select("id, standing_sources")
        .single();
      expect(operatorError).toBeNull();
      expect(byOperator!.standing_sources).toEqual([{ url: "https://example.com/feed.xml", kind: "feed" }]);

      const { data: edited } = await userB
        .from("os_workflows")
        .update({ brief: "a longer note" })
        .eq("id", byOperator!.id)
        .select("brief");
      expect(edited).toEqual([{ brief: "a longer note" }]);

      // A member may edit a workflow that is theirs. Since 16 September this
      // is deliberate: a product whose owner cannot change their own brief is
      // an internal tool with extra steps.
      const { data: ownEdit } = await userA
        .from("os_workflows")
        .update({ brief: "my own wording" })
        .eq("id", installed!.id)
        .select("brief");
      expect(ownEdit).toEqual([{ brief: "my own wording" }]);

      // Someone else's is still none of their business.
      const { data: tampered } = await userA
        .from("os_workflows")
        .update({ brief: "ignore everything" })
        .eq("id", byOperator!.id)
        .select("id");
      expect(tampered ?? []).toHaveLength(0);
    });

    /* The budget is what a workflow may spend on model calls in a month, so
     * the client it is installed for is exactly the person who must not be
     * able to raise it. The positive half matters as much as the negative:
     * an operator who cannot set it would leave every workflow on its
     * default, and a test that only proves a client cannot write passes for
     * the wrong reason when nobody can. */
    it("lets an operator set a workflow's monthly budget and refuses the client", async () => {
      const { data: workflow } = await admin
        .from("os_workflows")
        .insert({
          key: `budgeted_${suffix}`,
          owner_user_id: idA,
          name: "Budgeted",
          purpose: "Installed for one client.",
          brief: "a note",
        })
        .select("id, monthly_budget_usd")
        .single();
      // The default exists so a newly installed workflow is never unlimited.
      expect(Number(workflow!.monthly_budget_usd)).toBe(5);

      const { data: raised } = await userB
        .from("os_workflows")
        .update({ monthly_budget_usd: 25 })
        .eq("id", workflow!.id)
        .select("monthly_budget_usd");
      expect(raised).toEqual([{ monthly_budget_usd: 25 }]);

      // The client owns this row and may edit it, so the statement now
      // matches. What must not move is the number: the guard pins it back to
      // the stored value, so the write succeeds and changes nothing.
      const { data: selfRaised } = await userA
        .from("os_workflows")
        .update({ monthly_budget_usd: 9999 })
        .eq("id", workflow!.id)
        .select("monthly_budget_usd");
      expect(selfRaised).toEqual([{ monthly_budget_usd: 25 }]);

      const { data: after } = await admin
        .from("os_workflows")
        .select("monthly_budget_usd")
        .eq("id", workflow!.id)
        .single();
      expect(Number(after!.monthly_budget_usd)).toBe(25);

      await admin.from("os_workflows").delete().eq("key", `budgeted_${suffix}`);
    });

    /* The co-founder's spine, 16 September. MaydaOS is Abidin made sellable,
     * and what makes Abidin feel like a co-founder rather than a chat window
     * is enforced here: it holds a company's state, it brings back what only
     * a person can settle, and it cannot decide anything itself. Every one of
     * those refusals is a database rule, because a product's promise that
     * lives only in application code is a promise until the next bug. */
    describe("the co-founder's spine", () => {
      let companyId: string;
      let itemId: string;

      beforeAll(async () => {
        const { data: company } = await admin
          .from("os_companies")
          .insert({ name: `Spine Co ${suffix}`, what_we_do: "We test things." })
          .select("id")
          .single();
        companyId = company!.id;
        await admin.from("os_company_members").insert({ company_id: companyId, user_id: idA, role: "owner" });

        const { data: item } = await admin
          .from("os_work_items")
          .insert({
            company_id: companyId,
            lane: "content",
            kind: "post",
            title: "A post that needs a decision",
            required_action: "publish",
          })
          .select("id")
          .single();
        itemId = item!.id;
      });

      afterAll(async () => {
        if (companyId) await admin.from("os_companies").delete().eq("id", companyId);
      });

      it("shows a company's work to its members and to nobody else", async () => {
        const { data: mine } = await userA.from("os_work_items").select("id").eq("company_id", companyId);
        expect((mine ?? []).map((row) => row.id)).toContain(itemId);

        const { data: theirs } = await outsider.from("os_work_items").select("id").eq("company_id", companyId);
        expect(theirs ?? []).toHaveLength(0);

        const { error } = await outsider
          .from("os_work_items")
          .insert({ company_id: companyId, lane: "content", kind: "post", title: "Not yours" });
        expect(error).not.toBeNull();
      });

      /* The gate only ever watched UPDATE, so an item could be *born*
       * already approved and skip every check on the way in. Anything that
       * later trusts `approved` to mean "a person signed off" — the worker
       * that acts outward, above all — would have acted on a forgery. */
      it("refuses an item that is born already approved", async () => {
        const { error } = await userA.from("os_work_items").insert({
          company_id: companyId,
          lane: "content",
          kind: "post",
          title: "Born approved",
          status: "approved",
          required_action: "publish",
        });
        expect(error).not.toBeNull();
        expect(error!.message).toContain('needs an approved "publish"');
      });

      it("lets an item be born in a state a person still has to settle", async () => {
        const { data, error } = await userA
          .from("os_work_items")
          .insert({
            company_id: companyId,
            lane: "content",
            kind: "post",
            title: "Born in review",
            status: "review",
            required_action: "publish",
          })
          .select("id")
          .single();
        expect(error).toBeNull();
        expect(data?.id).toBeTruthy();
        if (data?.id) await admin.from("os_work_items").delete().eq("id", data.id);
      });

      it("refuses a move the machine does not allow", async () => {
        // pending cannot jump straight to approved, skipping every gate.
        const { error } = await userA.from("os_work_items").update({ status: "approved" }).eq("id", itemId);
        expect(error).not.toBeNull();
        expect(error!.message).toContain("cannot move from pending to approved");
      });

      /* The rule the whole product rests on: the system may prepare anything
       * and may decide nothing. */
      it("will not approve an item whose action nobody approved", async () => {
        await userA.from("os_work_items").update({ status: "drafted" }).eq("id", itemId);
        await userA.from("os_work_items").update({ status: "review" }).eq("id", itemId);

        const { error } = await userA.from("os_work_items").update({ status: "approved" }).eq("id", itemId);
        expect(error).not.toBeNull();
        expect(error!.message).toContain('needs an approved "publish"');
      });

      it("is not unlocked by an approval for a different action", async () => {
        await userA.from("os_approvals").insert({
          item_id: itemId,
          action: "email",
          approved_by: idA,
          approved_at: new Date().toISOString(),
        });

        const { error } = await userA.from("os_work_items").update({ status: "approved" }).eq("id", itemId);
        expect(error).not.toBeNull();
      });

      it("lets the item through once a person approves that exact action", async () => {
        await userA.from("os_approvals").insert({
          item_id: itemId,
          action: "publish",
          approved_by: idA,
          approved_at: new Date().toISOString(),
        });

        const { data, error } = await userA
          .from("os_work_items")
          .update({ status: "approved" })
          .eq("id", itemId)
          .select("status");
        expect(error).toBeNull();
        expect(data).toEqual([{ status: "approved" }]);
      });

      it("refuses an unsigned approval, and will not let a signed one be rewritten", async () => {
        // Half a record is the one that gets believed later.
        const { error: halfSigned } = await userA
          .from("os_approvals")
          .insert({ item_id: itemId, action: "half", approved_by: idA });
        expect(halfSigned).not.toBeNull();

        const { data: signed } = await admin
          .from("os_approvals")
          .select("id")
          .eq("item_id", itemId)
          .eq("action", "publish")
          .single();
        const { error: rewritten } = await userA
          .from("os_approvals")
          .update({ action: "something_else" })
          .eq("id", signed!.id);
        expect(rewritten).not.toBeNull();
      });

      it("keeps the record append-only", async () => {
        const { data: event } = await admin
          .from("os_work_item_events")
          .insert({ item_id: itemId, event: "prepared", detail: { by: "the system" } })
          .select("id")
          .single();

        const { error: edited } = await admin
          .from("os_work_item_events")
          .update({ event: "never happened" })
          .eq("id", event!.id);
        expect(edited).not.toBeNull();

        const { error: erased } = await admin.from("os_work_item_events").delete().eq("id", event!.id);
        expect(erased).not.toBeNull();
      });

      it("brings back only what a person can settle, and says why", async () => {
        const { data } = await userA.from("os_needs_you").select("id, route, status").eq("company_id", companyId);
        const routes = (data ?? []).map((row) => row.route);
        // The item is approved with an action outstanding: it is waiting to be
        // finished, not to be decided.
        expect(routes).toContain("finish");
        // Nothing the system can still move on its own appears here.
        for (const row of data ?? []) {
          expect(["review", "approved", "blocked"]).toContain(row.status);
        }

        const { data: hidden } = await outsider.from("os_needs_you").select("id").eq("company_id", companyId);
        expect(hidden ?? []).toHaveLength(0);
      });

      it("treats finished work as finished", async () => {
        await userA.from("os_work_items").update({ status: "completed" }).eq("id", itemId);
        const { error } = await userA.from("os_work_items").update({ status: "review" }).eq("id", itemId);
        expect(error).not.toBeNull();
        expect(error!.message).toContain("cannot move from completed");
      });
    });

    /* Property three, 16 September: it works while you are gone. The part
     * worth testing here is not that a draft appears — that costs a model
     * call — but that the schedule cannot misbehave: a workflow must not be
     * handed out twice, a manual one must never be picked up at all, and the
     * record of what ran must not be writable by the people it describes. */
    describe("working while you are gone", () => {
      let companyId: string;
      let workflowId: string;

      beforeAll(async () => {
        const { data: company } = await admin
          .from("os_companies")
          .insert({ name: `Worker Co ${suffix}` })
          .select("id")
          .single();
        companyId = company!.id;
        await admin.from("os_company_members").insert({ company_id: companyId, user_id: idA, role: "owner" });

        const { data: workflow } = await admin
          .from("os_workflows")
          .insert({
            key: `worker_${suffix}`,
            name: "Weekly market note",
            purpose: "Watch the feeds",
            brief: "a short note",
            shape: "note",
            company_id: companyId,
            cadence: "daily",
            required_action: "publish",
            standing_sources: [{ url: "https://example.com/feed", kind: "feed" }],
          })
          .select("id")
          .single();
        workflowId = workflow!.id;
      });

      afterAll(async () => {
        if (workflowId) await admin.from("os_workflows").delete().eq("id", workflowId);
        if (companyId) await admin.from("os_companies").delete().eq("id", companyId);
      });

      /* A cadence with no first due time is a workflow that never runs, which
       * is the failure that looks exactly like success until someone checks. */
      it("gives a scheduled workflow a time it is actually due", async () => {
        const { data } = await admin
          .from("os_workflows")
          .select("next_run_at, cadence")
          .eq("id", workflowId)
          .single();
        expect(data!.cadence).toBe("daily");
        expect(data!.next_run_at).not.toBeNull();
        /* Near now, not before now: this clock is the database's and the
         * comparison would be against the test machine's, which drift apart
         * by milliseconds. Whether it is genuinely due is settled by the
         * claim below, which asks the database rather than guessing. */
        expect(Math.abs(new Date(data!.next_run_at!).getTime() - Date.now())).toBeLessThan(60_000);
      });

      /* Two ticks overlapping must not draft the same thing twice. The claim
       * moves next_run_at forward in the same statement that hands the
       * workflow out, so the second caller finds nothing due. */
      it("hands a due workflow to one caller only", async () => {
        const first = await admin.rpc("os_claim_due_workflows", { p_limit: 5 });
        expect(first.error).toBeNull();
        expect((first.data ?? []).map((row) => row.id)).toContain(workflowId);

        const second = await admin.rpc("os_claim_due_workflows", { p_limit: 5 });
        expect(second.error).toBeNull();
        expect((second.data ?? []).map((row) => row.id)).not.toContain(workflowId);

        // And it was rescheduled rather than dropped.
        const { data } = await admin.from("os_workflows").select("next_run_at").eq("id", workflowId).single();
        expect(new Date(data!.next_run_at!).getTime()).toBeGreaterThan(Date.now());
      });

      it("never picks up a workflow nobody put on a schedule", async () => {
        const { data: manual } = await admin
          .from("os_workflows")
          .insert({
            key: `manual_${suffix}`,
            name: "Only when asked",
            purpose: "p",
            brief: "b",
            shape: "note",
            company_id: companyId,
            cadence: "manual",
          })
          .select("id, next_run_at")
          .single();
        expect(manual!.next_run_at).toBeNull();

        const { data: claimed } = await admin.rpc("os_claim_due_workflows", { p_limit: 20 });
        expect((claimed ?? []).map((row) => row.id)).not.toContain(manual!.id);
        await admin.from("os_workflows").delete().eq("id", manual!.id);
      });

      /* The whole property, end to end, with the model and the network stood
       * in for: a schedule comes due, something is prepared, and it arrives
       * in a person's queue carrying the decision it needs. The two stubs
       * replace the only parts that cost money and reach the internet —
       * everything asserted below is the real database doing the real work. */
      it("prepares work and files it where a person will see it", async () => {
        await admin.from("os_workflows").update({ next_run_at: new Date().toISOString() }).eq("id", workflowId);

        const report = await runDueWorkflows(admin, 5, {
          gather: async () => ({
            sources: [
              { url: "https://example.com/a", title: "A", text: "Freight rates rose 4% in August.", chars: 31 },
            ],
            failures: [],
          }),
          draft: {
            messages: {
              parse: async () => ({
                parsed_output: {
                  draft: "Freight rates rose 4% in August.",
                  claims: [{ text: "Freight rates rose 4% in August.", source_url: "https://example.com/a" }],
                },
                stop_reason: "end_turn",
                usage: { input_tokens: 100, output_tokens: 50 },
              }),
            },
          },
        });

        const mine = report.outcomes.find((o) => o.workflow === "Weekly market note");
        expect(mine?.result).toBe("drafted");
        const itemId = mine && "itemId" in mine ? mine.itemId : null;
        expect(itemId).toBeTruthy();

        // It arrived in the founder's queue, waiting on them.
        const { data: queued } = await userA
          .from("os_needs_you")
          .select("id, route, status, required_action")
          .eq("id", itemId!)
          .single();
        expect(queued!.status).toBe("review");
        expect(queued!.route).toBe("decide");
        expect(queued!.required_action).toBe("publish");

        // The run points at what it produced, and claims nobody as its author.
        const { data: run } = await admin
          .from("os_runs")
          .select("item_id, user_id, status, cost_usd")
          .eq("item_id", itemId!)
          .single();
        expect(run!.user_id).toBeNull();
        expect(run!.status).toBe("drafted");
        expect(Number(run!.cost_usd)).toBeGreaterThan(0);

        // The history says a machine did it.
        const { data: events } = await admin
          .from("os_work_item_events")
          .select("event, actor, detail")
          .eq("item_id", itemId!);
        const prepared = (events ?? []).find((e) => e.event === "prepared");
        expect(prepared).toBeTruthy();
        expect(prepared!.actor).toBeNull();

        /* And the thing that makes it a co-founder rather than an autopilot:
         * what it prepared still cannot go anywhere without a person. */
        const { error: selfApproved } = await admin
          .from("os_work_items")
          .update({ status: "approved" })
          .eq("id", itemId!);
        expect(selfApproved).not.toBeNull();
        expect(selfApproved!.message).toContain('needs an approved "publish"');
      });

      /* The companion to the refusal above. Trusted server code must be able
       * to move work through the states it is allowed to move it through —
       * otherwise "the gate refused it" and "the server cannot write at all"
       * look identical from outside, and they did for a while. */
      it("lets the server move work the way the machine allows", async () => {
        const { data: item } = await admin
          .from("os_work_items")
          .insert({
            company_id: companyId,
            lane: "content",
            kind: "note",
            title: "A thing the server is finishing",
            status: "review",
            required_action: "publish",
          })
          .select("id")
          .single();

        // Back to drafted is legal, and the server may do it.
        const { error: sentBack } = await admin
          .from("os_work_items")
          .update({ status: "drafted" })
          .eq("id", item!.id);
        expect(sentBack).toBeNull();

        // Drafted to approved is not, and the message is the machine's.
        const { error: jumped } = await admin
          .from("os_work_items")
          .update({ status: "approved" })
          .eq("id", item!.id);
        expect(jumped).not.toBeNull();
        expect(jumped!.message).toContain("cannot move from drafted to approved");

        await admin.from("os_work_items").delete().eq("id", item!.id);
      });

      /* Scheduling from the product rather than from psql. Filing into a
       * company is what makes the worker pick a workflow up at all, so the
       * question of whose queue it lands in is the one that matters. */
      it("lets a member schedule into their own company, and nobody else's", async () => {
        const { data: mine, error: ok } = await userA
          .from("os_workflows")
          .insert({
            key: `selfserve_${suffix}`,
            name: "Mine",
            purpose: "p",
            brief: "b",
            shape: "note",
            company_id: companyId,
            cadence: "weekly",
            required_action: "publish",
          })
          .select("id, company_id, cadence, next_run_at, owner_user_id")
          .single();
        expect(ok).toBeNull();
        expect(mine!.company_id).toBe(companyId);
        expect(mine!.cadence).toBe("weekly");
        // Scheduled means due, not merely labelled.
        expect(mine!.next_run_at).not.toBeNull();
        // And it is theirs, whatever the form claimed.
        expect(mine!.owner_user_id).toBe(idA);

        const { error: refused } = await outsider.from("os_workflows").insert({
          key: `stolen_${suffix}`,
          name: "Aimed at someone else",
          purpose: "p",
          brief: "b",
          shape: "note",
          company_id: companyId,
          cadence: "daily",
        });
        expect(refused).not.toBeNull();

        await admin.from("os_workflows").delete().eq("id", mine!.id);
      });

      /* The process surface. A co-founder who cannot see what the other one
       * scheduled is not a co-founder; anyone else seeing it is a leak. */
      it("shows a company its own activity and nobody else's", async () => {
        const { data: seen } = await userA.from("os_activity").select("id, name, cadence").eq("id", workflowId);
        expect((seen ?? []).map((row) => row.id)).toContain(workflowId);

        const { data: hidden } = await outsider.from("os_activity").select("id").eq("id", workflowId);
        expect(hidden ?? []).toHaveLength(0);
      });

      /* The gate that actually decides.
       *
       * os_workflows_private_beta is RESTRICTIVE, so it applies on top of
       * every permissive policy. Every other test in this block runs as
       * userA, who is on the beta allowlist — so they would all pass whether
       * or not company membership grants anything, which is precisely how
       * this shipped broken: the page opened and the save was refused by the
       * database with a generic message. This user is on no allowlist and
       * has nothing but a company. */
      it("lets someone whose only entitlement is a company set work up", async () => {
        const email = `founder-only-${suffix}@example.com`;
        const created = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        const founderId = created.data.user!.id;
        await admin.from("os_company_members").insert({
          company_id: companyId,
          user_id: founderId,
          role: "member",
        });

        const founder = anonClient();
        const signedIn = await founder.auth.signInWithPassword({ email, password });
        expect(signedIn.error).toBeNull();

        // Not on the allowlist, and the view agrees.
        expect((await founder.from("os_beta_status").select("*")).data).toEqual([]);

        const { data: made, error } = await founder
          .from("os_workflows")
          .insert({
            key: `company_only_${suffix}`,
            name: "Set up by a founder",
            purpose: "p",
            brief: "b",
            shape: "note",
            company_id: companyId,
            cadence: "daily",
          })
          .select("id, cadence, next_run_at")
          .single();
        expect(error).toBeNull();
        expect(made!.cadence).toBe("daily");
        expect(made!.next_run_at).not.toBeNull();

        await admin.from("os_workflows").delete().eq("id", made!.id);
        await admin.auth.admin.deleteUser(founderId);
      });

      it("lets nobody but the server claim work", async () => {
        const { error } = await userA.rpc("os_claim_due_workflows", { p_limit: 1 });
        expect(error).not.toBeNull();
      });

      /* A member may see what ran on their behalf. Nobody may write one:
       * a record its subject can shape is not a record. */
      it("shows a company its runs, and lets no browser write one", async () => {
        const { data: run } = await admin
          .from("os_runs")
          .insert({
            user_id: null,
            company_id: companyId,
            workflow_id: workflowId,
            shape: "note",
            topic: "Weekly market note",
            status: "drafted",
          })
          .select("id")
          .single();

        const { data: mine } = await userA.from("os_runs").select("id").eq("company_id", companyId);
        expect((mine ?? []).map((row) => row.id)).toContain(run!.id);

        const { data: theirs } = await outsider.from("os_runs").select("id").eq("company_id", companyId);
        expect(theirs ?? []).toHaveLength(0);

        const { error: written } = await userA.from("os_runs").insert({
          user_id: null,
          company_id: companyId,
          workflow_id: workflowId,
          shape: "note",
          topic: "I did this myself",
          status: "drafted",
        });
        expect(written).not.toBeNull();
      });
    });

    /* The co-founder you can talk to, 16 September.
     *
     * The conversation is the first part of MaydaOS that can decide to do
     * something on its own initiative, so what is tested here is not that it
     * talks — the model is stubbed — but that the one thing it can do cannot
     * become the thing it must not do. */
    describe("the co-founder conversation", () => {
      let companyId: string;

      beforeAll(async () => {
        const { data: company } = await admin
          .from("os_companies")
          .insert({ name: `Chat Co ${suffix}`, what_we_do: "We move freight out of Izmir." })
          .select("id")
          .single();
        companyId = company!.id;
        await admin.from("os_company_members").insert({ company_id: companyId, user_id: idA, role: "owner" });
      });

      afterAll(async () => {
        if (companyId) await admin.from("os_companies").delete().eq("id", companyId);
      });

      it("knows the company from what is actually stored", async () => {
        const { data: item } = await admin
          .from("os_work_items")
          .insert({
            company_id: companyId,
            lane: "sales",
            kind: "reply",
            title: "Reply to the Bornova enquiry",
            status: "review",
            required_action: "send",
          })
          .select("id")
          .single();

        const context = await buildCompanyContext(admin, companyId);
        expect(context).toContain("We move freight out of Izmir.");
        expect(context).toContain("Reply to the Bornova enquiry");
        expect(context).toContain("waiting-on: send");

        await admin.from("os_work_items").delete().eq("id", item!.id);
      });

      /* It may prepare anything and decide nothing. This is the same promise
       * the worker keeps, tested again here because this is the component
       * that chooses for itself what to do. */
      it("files work a person still has to settle, and cannot settle it", async () => {
        const events: string[] = [];
        for await (const event of runCofounderTurn({
          supabase: admin,
          companyId,
          system: "stub",
          history: [{ role: "person", body: "draft the Bornova reply" }],
          turn: fakeTurn([
            [
              { type: "text", text: "Drafting it now." },
              {
                type: "tool",
                id: "t1",
                name: "file_work",
                input: {
                  title: "Reply to Bornova",
                  lane: "sales",
                  kind: "reply",
                  notes: "Thanks for the enquiry.",
                  needs_approval_for: "send",
                },
              },
              { type: "done", stopReason: "tool_use", inputTokens: 900, outputTokens: 40 },
            ],
            [
              { type: "text", text: " Filed for you." },
              { type: "done", stopReason: "end_turn", inputTokens: 200, outputTokens: 10 },
            ],
          ]),
        })) {
          events.push(event.type);
          if (event.type === "done") {
            expect(event.text).toBe("Drafting it now. Filed for you.");
            expect(event.costUsd).toBeGreaterThan(0);
          }
        }
        expect(events).toContain("filed");

        const { data: filed } = await admin
          .from("os_work_items")
          .select("id, status, required_action, metadata")
          .eq("company_id", companyId)
          .eq("title", "Reply to Bornova")
          .single();

        expect(filed!.status).toBe("review");
        expect(filed!.required_action).toBe("send");
        expect((filed!.metadata as { by?: string }).by).toBe("cofounder");

        // And the thing the whole product rests on.
        const { error } = await admin
          .from("os_work_items")
          .update({ status: "approved" })
          .eq("id", filed!.id);
        expect(error).not.toBeNull();
        expect(error!.message).toContain('needs an approved "send"');

        await admin.from("os_work_items").delete().eq("id", filed!.id);
      });

      it("files a draft when nothing leaves the building", async () => {
        for await (const _ of runCofounderTurn({
          supabase: admin,
          companyId,
          system: "stub",
          history: [{ role: "person", body: "note the pricing idea" }],
          turn: fakeTurn([
            [
              { type: "tool", id: "t1", name: "file_work", input: { title: "Pricing idea", lane: "ops", kind: "note" } },
              { type: "done", stopReason: "tool_use", inputTokens: 10, outputTokens: 5 },
            ],
            [{ type: "done", stopReason: "end_turn", inputTokens: 5, outputTokens: 5 }],
          ]),
        })) void _;

        const { data } = await admin
          .from("os_work_items")
          .select("status, required_action")
          .eq("company_id", companyId)
          .eq("title", "Pricing idea")
          .single();
        expect(data!.status).toBe("drafted");
        expect(data!.required_action).toBeNull();
      });

      it("survives a tool it was never given", async () => {
        const seen: string[] = [];
        for await (const event of runCofounderTurn({
          supabase: admin,
          companyId,
          system: "stub",
          history: [{ role: "person", body: "send it" }],
          turn: fakeTurn([
            [
              { type: "tool", id: "t1", name: "publish_it", input: {} },
              { type: "done", stopReason: "tool_use", inputTokens: 10, outputTokens: 5 },
            ],
            [
              { type: "text", text: "I cannot do that." },
              { type: "done", stopReason: "end_turn", inputTokens: 5, outputTokens: 5 },
            ],
          ]),
        })) {
          seen.push(event.type);
        }
        expect(seen).toContain("refused");
        expect(seen).toContain("done");
      });

      /* A loop that can call a tool can call it forever, and forever is
       * measured in dollars. */
      it("stops calling tools rather than looping", async () => {
        let rounds = 0;
        const endless: ModelTurn = async function* () {
          rounds += 1;
          yield { type: "tool", id: `t${rounds}`, name: "file_work", input: { title: `Loop ${rounds}`, lane: "ops", kind: "note" } };
          yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
        };

        for await (const _ of runCofounderTurn({
          supabase: admin,
          companyId,
          system: "stub",
          history: [{ role: "person", body: "go" }],
          turn: endless,
        })) void _;

        // Exactly the cap, not merely under it: "at most three" is also true
        // of a loop that never ran, which would make this pass while proving
        // nothing.
        expect(rounds).toBe(3);
        await admin.from("os_work_items").delete().eq("company_id", companyId).like("title", "Loop %");
      });

      /* What "trained" means here: it accumulates. The test that matters is
       * not that a row was written but that the thing it learned comes back
       * in what it knows next time — otherwise memory is a table nobody
       * reads. */
      it("learns something and still knows it next time", async () => {
        const before = await buildCompanyContext(admin, companyId);
        expect(before).toContain("nothing yet");

        for await (const _ of runCofounderTurn({
          supabase: admin,
          companyId,
          system: "stub",
          history: [{ role: "person", body: "we never quote below 40 euros a pallet" }],
          turn: fakeTurn([
            [
              {
                type: "tool",
                id: "m1",
                name: "remember",
                input: { fact: "They never quote below 40 euros a pallet.", kind: "constraint" },
              },
              { type: "done", stopReason: "tool_use", inputTokens: 10, outputTokens: 5 },
            ],
            [
              { type: "text", text: "Noted." },
              { type: "done", stopReason: "end_turn", inputTokens: 5, outputTokens: 5 },
            ],
          ]),
        })) void _;

        const after = await buildCompanyContext(admin, companyId);
        expect(after).toContain("[constraint] They never quote below 40 euros a pallet.");
      });

      it("marks what a person told it apart from what it worked out", async () => {
        const { error } = await userA.from("os_company_memory").insert({
          company_id: companyId,
          fact: "Hamburg is our best lane.",
          kind: "fact",
          // Both of these are lies the form could tell, and the trigger
          // overwrites them rather than trusting them.
          source: "cofounder",
          created_by: null,
        });
        expect(error).toBeNull();

        const { data } = await admin
          .from("os_company_memory")
          .select("source, created_by, retired_at")
          .eq("company_id", companyId)
          .eq("fact", "Hamburg is our best lane.")
          .single();
        expect(data!.source).toBe("person");
        expect(data!.created_by).toBe(idA);
        // Nothing is born retired: a retirement is an act with a date and a
        // person attached.
        expect(data!.retired_at).toBeNull();
      });

      /* Being wrong is the hard part. A memory that turned out to be false is
       * itself worth keeping — "it used to think this, and then I said
       * otherwise" is the record, and the record is the product. */
      it("is corrected by retiring, never by rewriting or erasing", async () => {
        const { data: wrong } = await admin
          .from("os_company_memory")
          .insert({ company_id: companyId, fact: "They work weekends.", kind: "preference" })
          .select("id")
          .single();

        const { error: rewritten } = await admin
          .from("os_company_memory")
          .update({ fact: "They do not work weekends." })
          .eq("id", wrong!.id);
        expect(rewritten).not.toBeNull();
        expect(rewritten!.message).toContain("retiring it");

        const { error: erased } = await admin.from("os_company_memory").delete().eq("id", wrong!.id);
        expect(erased).not.toBeNull();
        expect(erased!.message).toContain("never deleted");

        const { error: retired } = await userA.rpc("os_retire_memory", {
          p_id: wrong!.id,
          p_reason: "They told me the opposite.",
        });
        expect(retired).toBeNull();

        const { data: after } = await admin
          .from("os_company_memory")
          .select("retired_at, retired_by, retired_reason")
          .eq("id", wrong!.id)
          .single();
        expect(after!.retired_at).not.toBeNull();
        expect(after!.retired_by).toBe(idA);
        expect(after!.retired_reason).toBe("They told me the opposite.");

        // And it stops being something it knows.
        const context = await buildCompanyContext(admin, companyId);
        expect(context).not.toContain("They work weekends.");
      });

      it("keeps one company's memory out of another's", async () => {
        const { data: mine } = await userA.from("os_company_memory").select("id").eq("company_id", companyId);
        expect((mine ?? []).length).toBeGreaterThan(0);

        const { data: theirs } = await outsider.from("os_company_memory").select("id").eq("company_id", companyId);
        expect(theirs ?? []).toHaveLength(0);

        const { error: written } = await outsider
          .from("os_company_memory")
          .insert({ company_id: companyId, fact: "Not their company.", kind: "fact" });
        expect(written).not.toBeNull();

        const { data: target } = await admin
          .from("os_company_memory")
          .select("id")
          .eq("company_id", companyId)
          .limit(1)
          .single();
        const { error: reached } = await outsider.rpc("os_retire_memory", { p_id: target!.id, p_reason: "mine now" });
        expect(reached).not.toBeNull();
      });

      it("keeps the transcript to the company, and lets no browser write one", async () => {
        const { data: thread } = await admin
          .from("os_threads")
          .insert({ company_id: companyId })
          .select("id")
          .single();
        const { data: message } = await admin
          .from("os_messages")
          .insert({ thread_id: thread!.id, role: "person", body: "hello", actor: idA })
          .select("id")
          .single();

        const { data: mine } = await userA.from("os_messages").select("id").eq("thread_id", thread!.id);
        expect((mine ?? []).map((row) => row.id)).toContain(message!.id);

        const { data: theirs } = await outsider.from("os_messages").select("id").eq("thread_id", thread!.id);
        expect(theirs ?? []).toHaveLength(0);

        // Neither half of a transcript may be composed by its subject.
        const { error: written } = await userA
          .from("os_messages")
          .insert({ thread_id: thread!.id, role: "cofounder", body: "I approved it." });
        expect(written).not.toBeNull();

        const { error: edited } = await admin
          .from("os_messages")
          .update({ body: "something else" })
          .eq("id", message!.id);
        expect(edited).not.toBeNull();
        expect(edited!.message).toContain("append-only");

        const { error: erased } = await admin.from("os_messages").delete().eq("id", message!.id);
        expect(erased).not.toBeNull();
      });
    });

    /* Self-serve workflows, 16 September. A member may now set up their own
     * work, which is the difference between an internal tool and something a
     * person can buy. Everything they must NOT be able to do is enforced in
     * the database, because a guarantee that lives only in a form does not
     * survive the next form. */
    describe("a member's own workflows", () => {
      const made: string[] = [];

      afterAll(async () => {
        for (const id of made) await admin.from("os_workflows").delete().eq("id", id);
      });

      it("lets a member create one, owned by them and never a template", async () => {
        const { data, error } = await userA
          .from("os_workflows")
          .insert({
            key: `mine_${suffix}`,
            name: "My weekly note",
            purpose: "Turn this week's reading into a note.",
            brief: "a short note, 120 to 180 words",
            // Both of these are ignored: the guard owns them.
            owner_user_id: idB,
            monthly_budget_usd: 999,
          })
          .select("id, owner_user_id, monthly_budget_usd")
          .single();
        expect(error).toBeNull();
        made.push(data!.id);
        // Handed to themselves, not to the operator they named.
        expect(data!.owner_user_id).toBe(idA);
        // Pinned to the default, not the number they asked for.
        expect(Number(data!.monthly_budget_usd)).toBe(5);
      });

      it("refuses to let a member mint a template everyone can run", async () => {
        const { data } = await userA
          .from("os_workflows")
          .insert({
            key: `template_attempt_${suffix}`,
            owner_user_id: null,
            name: "Not a template",
            purpose: "Trying to make this public.",
            brief: "a note",
          })
          .select("id, owner_user_id")
          .single();
        if (data) made.push(data.id);
        // It was created, but as theirs. A template still needs an operator.
        expect(data!.owner_user_id).toBe(idA);
      });

      it("pins the budget and the key on a member's own edit", async () => {
        const id = made[0];
        const { data } = await userA
          .from("os_workflows")
          .update({ monthly_budget_usd: 4242, key: `renamed_${suffix}`, name: "Renamed" })
          .eq("id", id)
          .select("name, key, monthly_budget_usd");
        // The parts that are theirs move; the money and the identity do not.
        expect(data![0].name).toBe("Renamed");
        expect(data![0].key).toBe(`mine_${suffix}`);
        expect(Number(data![0].monthly_budget_usd)).toBe(5);
      });

      it("stops a member at five, counting what they already own", async () => {
        const { count } = await admin
          .from("os_workflows")
          .select("id", { count: "exact", head: true })
          .eq("owner_user_id", idA);
        const owned = count ?? 0;

        for (let n = owned; n < 5; n += 1) {
          const { data } = await userA
            .from("os_workflows")
            .insert({ key: `fill_${n}_${suffix}`, name: `Fill ${n}`, purpose: "Filling the quota.", brief: "a note" })
            .select("id")
            .single();
          if (data) made.push(data.id);
        }

        const { error } = await userA
          .from("os_workflows")
          .insert({ key: `over_${suffix}`, name: "One too many", purpose: "Over the limit.", brief: "a note" });
        expect(error).not.toBeNull();
        expect(error!.message).toContain("workflow limit reached");
      });

      it("keeps an outsider out entirely, member or not", async () => {
        const { error } = await outsider
          .from("os_workflows")
          .insert({ key: `outsider_${suffix}`, name: "Nope", purpose: "Not a member.", brief: "a note" });
        expect(error).not.toBeNull();
      });
    });

    it("blocks a person from inserting a run, and hides other people's runs", async () => {
      const { error } = await userA.from("os_runs").insert({ user_id: idA, topic: "Mine", draft: "Free work" });
      expect(error).not.toBeNull();

      const { data: theirs } = await outsider.from("os_runs").select("id");
      expect(theirs ?? []).toHaveLength(0);

      const { data: theirCredits } = await outsider.from("os_credits").select("user_id");
      expect(theirCredits ?? []).toHaveLength(0);
    });
  });
});
