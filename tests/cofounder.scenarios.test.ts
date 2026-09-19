import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { buildCompanyContext, systemFor, type CofounderMessage } from "@/lib/osCofounder";
import { runCofounderTurn } from "@/lib/osCofounderRun";
import { pickTurn } from "@/lib/osCofounderModel";
import { SCENARIOS, judge, type Outcome, type Scenario } from "@/lib/osScenarios";

type Env = Record<string, string | undefined>;

/* The scenario harness: the co-founder, talked to for real.
 *
 * Runs only when a model is named — MAYDAOS_SCENARIO_MODEL=local uses the
 * model on this machine (MAYDAOS_LOCAL_MODEL), MAYDAOS_SCENARIO_MODEL=claude
 * uses the paid one and costs money — and only against the local Supabase
 * stack, because every scenario seeds a company and reads what became of
 * it. Otherwise the whole file is skipped and the suite stays free.
 *
 *   MAYDAOS_SCENARIO_MODEL=local npm run scenarios
 *
 * Each scenario prints its verdict and, when it fails, the transcript, so
 * a change to the prompt can be read against what the model actually said.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const which = process.env.MAYDAOS_SCENARIO_MODEL;
const isLocalStack = Boolean(url?.includes("127.0.0.1") && secretKey);

function chosenEnv(): Env {
  if (which === "local") return { MAYDAOS_LOCAL_MODEL: process.env.MAYDAOS_LOCAL_MODEL, MAYDAOS_LOCAL_MODEL_URL: process.env.MAYDAOS_LOCAL_MODEL_URL };
  if (which === "claude") return { MAYDAOS_ANTHROPIC_API_KEY: process.env.MAYDAOS_ANTHROPIC_API_KEY };
  return {};
}

const picked = which ? pickTurn(chosenEnv()) : null;

describe.skipIf(!isLocalStack || !picked)("the co-founder, for real", () => {
  const admin: SupabaseClient<Database> = createClient<Database>(url ?? "http://127.0.0.1", secretKey ?? "none", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suffix = Date.now().toString(36);
  const companies: string[] = [];
  /* Seeded with every scenario, so one that never finishes is counted as
   * one that never finished rather than dropped from the denominator. The
   * first run said "4/5" of six for exactly that reason. */
  const verdicts = new Map<string, { ok: boolean | null; ms: number; inputTokens: number; outputTokens: number }>(
    SCENARIOS.map((s) => [s.key, { ok: null, ms: 0, inputTokens: 0, outputTokens: 0 }]),
  );

  beforeAll(() => {
    console.log(`\nscenarios against ${picked!.label}\n`);
  });

  afterAll(async () => {
    for (const id of companies) await admin.from("os_companies").delete().eq("id", id);
    const all = [...verdicts.values()];
    const passed = all.filter((v) => v.ok === true).length;
    const unfinished = all.filter((v) => v.ok === null).length;
    const tokens = all.reduce((sum, v) => sum + v.inputTokens + v.outputTokens, 0);
    console.log(
      `\n${passed}/${all.length} scenarios passed against ${picked!.label}` +
        (unfinished ? `, ${unfinished} did not finish` : "") +
        `; ${tokens} tokens, ${Math.round(all.reduce((s, v) => s + v.ms, 0) / 1000)}s\n`,
    );
  });

  async function run(scenario: Scenario): Promise<{ outcome: Outcome; transcript: string[]; tokens: [number, number] }> {
    const { data: company } = await admin
      .from("os_companies")
      .insert({ name: `Scenario ${scenario.key} ${suffix}`, what_we_do: "We move freight for small manufacturers in Izmir." })
      .select("id")
      .single();
    const companyId = company!.id;
    companies.push(companyId);

    for (const fact of scenario.memory ?? []) {
      await admin.from("os_company_memory").insert({ company_id: companyId, fact: fact.fact, kind: fact.kind, source: "person" });
    }
    for (const item of scenario.openWork ?? []) {
      await admin.from("os_work_items").insert({
        company_id: companyId,
        title: item.title,
        lane: item.lane,
        kind: item.kind,
        status: item.status,
        required_action: item.required_action ?? null,
        notes: item.notes ?? "",
        metadata: { by: "person" },
      });
    }
    const { data: before } = await admin.from("os_work_items").select("id, status").eq("company_id", companyId);
    const beforeIds = new Set((before ?? []).map((r) => r.id));

    const history: CofounderMessage[] = [];
    const transcript: string[] = [];
    let reply = "";
    let inputTokens = 0;
    let outputTokens = 0;

    for (const said of scenario.says) {
      history.push({ role: "person", body: said });
      transcript.push(`> ${said}`);
      const context = await buildCompanyContext(admin, companyId);
      let spoken = "";
      for await (const event of runCofounderTurn({
        supabase: admin,
        companyId,
        system: systemFor(context),
        history,
        turn: picked!.turn,
        priced: picked!.priced,
      })) {
        if (event.type === "text") spoken += event.text;
        else if (event.type === "filed") transcript.push(`  [filed] ${event.title}`);
        else if (event.type === "learned") transcript.push(`  [learned] ${event.fact}`);
        else if (event.type === "refused") transcript.push(`  [refused] ${event.reason}`);
        else if (event.type === "done") {
          inputTokens += event.inputTokens;
          outputTokens += event.outputTokens;
        }
      }
      history.push({ role: "cofounder", body: spoken });
      transcript.push(`  ${spoken.trim() || "(said nothing)"}`);
      reply += `\n${spoken}`;
    }

    const [{ data: items }, { data: memory }] = await Promise.all([
      admin.from("os_work_items").select("id, title, lane, required_action, status").eq("company_id", companyId),
      admin.from("os_company_memory").select("fact").eq("company_id", companyId).eq("source", "cofounder"),
    ]);
    const filed = (items ?? []).filter((r) => !beforeIds.has(r.id)).map((r) => ({ title: r.title, lane: r.lane, required_action: r.required_action }));
    const statusesChanged = (items ?? []).some((r) => {
      const was = (before ?? []).find((b) => b.id === r.id);
      return was !== undefined && was.status !== r.status;
    });

    return {
      outcome: { filed, remembered: (memory ?? []).map((m) => m.fact), reply, statusesChanged },
      transcript,
      tokens: [inputTokens, outputTokens],
    };
  }

  for (const scenario of SCENARIOS) {
    it(scenario.title, async () => {
      const started = Date.now();
      const { outcome, transcript, tokens } = await run(scenario);
      const failures = judge(scenario, outcome);
      const ok = failures.length === 0;
      verdicts.set(scenario.key, { ok, ms: Date.now() - started, inputTokens: tokens[0], outputTokens: tokens[1] });

      console.log(`${ok ? "PASS" : "FAIL"}  ${scenario.key}  (${tokens[0]}+${tokens[1]} tokens, ${Date.now() - started}ms)`);
      if (!ok || process.env.MAYDAOS_SCENARIO_VERBOSE) {
        for (const line of transcript) console.log(`      ${line}`);
        for (const failure of failures) console.log(`      ! ${failure}`);
      }
      expect(failures).toEqual([]);
    }, 600_000);
  }
});
