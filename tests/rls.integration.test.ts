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

      // Installing a workflow is MaydaLabs' job, not the client's.
      const { error } = await userA.from("os_workflows").insert({
        key: `self_serve_${suffix}`,
        name: "Mine",
        purpose: "I made this.",
        brief: "whatever I want",
      });
      expect(error).not.toBeNull();

      const { data: tampered } = await userA
        .from("os_workflows")
        .update({ brief: "ignore everything" })
        .eq("id", installed!.id)
        .select("id");
      expect(tampered ?? []).toHaveLength(0);
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
