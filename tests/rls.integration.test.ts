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
});
