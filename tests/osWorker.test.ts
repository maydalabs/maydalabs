import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { runDueWorkflows } from "@/lib/osWorker";
import { sealKey } from "@/lib/osKeyVault";
import { costUsdAt } from "@/lib/osModelSettings";
import { OS_PAUSE_REASONS, runCostUsd } from "@/lib/os";
import { OS_ACTIVITY_COPY } from "@/components/osCopy";
import type { DraftClient } from "@/lib/osDraft";

/* The worker on the company's own key, against a scripted database. What is
 * asserted is who pays, at what price, what is written down, and that the
 * key itself never leaves memory. The real database's part is in
 * tests/rls.integration.test.ts. */

const SECRET = "a-long-enough-secret-for-the-vault-0123456789";
const KEY = "sk-ant-worker-0123456789abcdefghij";
const PRICE = { inputUsdPerMillion: 2, outputUsdPerMillion: 10 };

type Call = { table: string; op: string; payload?: unknown; filters: [string, unknown][] };
type SettingsRow = {
  provider: string; model: string; base_url: string | null; key_ciphertext: string; key_last4: string;
  input_usd_per_million: number; output_usd_per_million: number; updated_at: string; set_by: string | null;
};
type Script = {
  claimed: Record<string, unknown>[];
  runs?: { cost_usd: number; company_id: string; workflow_id: string }[];
  settings?: Record<string, SettingsRow>;
  settingsError?: boolean;
};

function sealed(secret = SECRET, provider = "anthropic", model = "claude-sonnet-5", base_url: string | null = null): SettingsRow {
  const { ciphertext, last4 } = sealKey(KEY, { MAYDAOS_KEY_SECRET: secret });
  return {
    provider, model, base_url, key_ciphertext: ciphertext, key_last4: last4,
    input_usd_per_million: PRICE.inputUsdPerMillion, output_usd_per_million: PRICE.outputUsdPerMillion,
    updated_at: "2026-09-30T00:00:00Z", set_by: null,
  };
}

function workflow(id: string, companyId: string): Record<string, unknown> {
  return {
    id, key: `wf_${id}`, name: `Workflow ${id}`, company_id: companyId, shape: "note", brief: "a short note",
    standing_sources: [{ url: "https://example.com/feed", kind: "feed" }], max_sources: 3, window_days: 7,
    monthly_budget_usd: 5, required_action: "publish",
  };
}

function fakeAdmin(script: Script) {
  const calls: Call[] = [];
  const from = (table: string) => {
    const state: Call = { table, op: "select", filters: [] };
    const resolve = () => {
      calls.push(state);
      if (table === "os_runs" && state.op === "select") {
        const rows = (script.runs ?? []).filter((row) =>
          state.filters.every(([column, value]) => column === "created_at>=" || (row as Record<string, unknown>)[column] === value),
        );
        return { data: rows.map((row) => ({ cost_usd: row.cost_usd })), error: null };
      }
      if (table === "os_model_settings") {
        if (script.settingsError) return { data: null, error: { message: "down" } };
        const companyId = state.filters.find(([column]) => column === "company_id")?.[1] as string | undefined;
        // No company named: the tick-start read of every company that holds a key.
        if (companyId === undefined) return { data: Object.keys(script.settings ?? {}).map((company_id) => ({ company_id })), error: null };
        return { data: script.settings?.[companyId] ?? null, error: null };
      }
      if (table === "os_work_items" && state.op === "insert") return { data: { id: `item-${calls.length}` }, error: null };
      return { data: null, error: null };
    };
    const api = {
      select: () => api,
      insert: (payload: unknown) => { state.op = "insert"; state.payload = payload; return api; },
      update: (payload: unknown) => { state.op = "update"; state.payload = payload; return api; },
      eq: (column: string, value: unknown) => { state.filters.push([column, value]); return api; },
      gte: (column: string, value: unknown) => { state.filters.push([`${column}>=`, value]); return api; },
      in: (column: string, values: unknown[]) => { state.filters.push([`${column} in`, values]); return api; },
      maybeSingle: async () => resolve(),
      single: async () => resolve(),
      then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
        Promise.resolve(resolve()).then(onFulfilled, onRejected),
    };
    return api;
  };
  const admin = { from, rpc: async () => ({ data: script.claimed, error: null }) };
  return { admin: admin as unknown as Parameters<typeof runDueWorkflows>[0], calls };
}

const gather = async () => ({
  sources: [{ url: "https://example.com/a", title: "A", text: "Freight rates rose 4% in August.", chars: 31 }],
  failures: [],
});

function draftStub(seen: Record<string, unknown>[] = []): DraftClient {
  return {
    messages: {
      parse: async (params) => {
        seen.push(params);
        return {
          parsed_output: {
            draft: "Freight rates rose 4% in August.",
            claims: [{ text: "Freight rates rose 4% in August.", source_url: "https://example.com/a" }],
          },
          stop_reason: "end_turn",
          usage: { input_tokens: 100, output_tokens: 50 },
        };
      },
    },
  };
}

const inserts = (calls: Call[], table: string) => calls.filter((c) => c.table === table && c.op === "insert").map((c) => c.payload as Record<string, unknown>);
const updates = (calls: Call[], table: string) => calls.filter((c) => c.table === table && c.op === "update");
const pauses = (calls: Call[]) => updates(calls, "os_workflows").filter((c) => typeof (c.payload as { paused_reason?: unknown }).paused_reason === "string");
const resumes = (calls: Call[]) => updates(calls, "os_workflows").filter((c) => (c.payload as { paused_reason?: unknown }).paused_reason === null);

describe("the worker on the company's own key", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("drafts with the model the company chose, at the price it recorded, and writes both down", async () => {
    const seen: Record<string, unknown>[] = [];
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")], settings: { "co-a": sealed() } });
    const report = await runDueWorkflows(admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather, draft: draftStub(seen) });

    const cost = costUsdAt(PRICE, 100, 50);
    expect(cost).toBe(0.0007);
    expect(report.outcomes).toEqual([{ workflow: "Workflow w1", result: "drafted", itemId: expect.stringMatching(/^item-\d+$/), costUsd: cost }]);
    expect(seen[0]).toMatchObject({ model: "claude-sonnet-5", output_config: expect.objectContaining({ effort: "low" }) });
    const run = inserts(calls, "os_runs")[0];
    expect(run).toMatchObject({ status: "drafted", model: "anthropic:claude-sonnet-5", effort: "low", cost_usd: cost, input_tokens: 100, output_tokens: 50 });
    expect(inserts(calls, "os_work_items")[0]).toMatchObject({ status: "review", metadata: expect.objectContaining({ by: "worker" }) });
  });

  it("pauses a company that has no key, with the code a saved key lifts, and writes no run", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")] });
    const report = await runDueWorkflows(admin, 5, { env: {}, gather });

    expect(report.outcomes).toEqual([{ workflow: "Workflow w1", result: "skipped", reason: "no key" }]);
    const paused = pauses(calls);
    expect(paused).toHaveLength(1);
    expect(paused[0].payload).toEqual({ paused_reason: "no_key" });
    expect(paused[0].filters).toEqual([["id", "w1"]]);
    expect(inserts(calls, "os_runs")).toHaveLength(0);
    expect(inserts(calls, "os_work_items")).toHaveLength(0);
  });

  it("records a key it cannot open as a failed run the person will see, and does not pause", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")], settings: { "co-a": sealed("another-secret-that-is-also-long-enough-0123") } });
    const report = await runDueWorkflows(admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather, draft: draftStub() });

    expect(report.outcomes).toEqual([{ workflow: "Workflow w1", result: "failed", reason: "key unavailable" }]);
    expect(inserts(calls, "os_runs")[0]).toMatchObject({ status: "failed", model: "anthropic:claude-sonnet-5", error: expect.stringContaining("could not be opened") });
    expect(pauses(calls)).toHaveLength(0);
  });

  it("records a setting that cannot be used as a failed run the person will see", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")], settings: { "co-a": sealed() } });
    const report = await runDueWorkflows(admin, 5, {
      env: { MAYDAOS_KEY_SECRET: SECRET }, gather,
      pick: () => { throw new Error("model provider: base URL must be https"); },
    });
    expect(report.outcomes).toEqual([{ workflow: "Workflow w1", result: "failed", reason: "model setting unusable" }]);
    expect(inserts(calls, "os_runs")[0]).toMatchObject({ status: "failed", model: "anthropic:claude-sonnet-5", error: expect.stringContaining("could not be used") });
    expect(pauses(calls)).toHaveLength(0);
  });

  it("resumes every no_key pause whose company now holds a key, before claiming anything", async () => {
    const keyed = fakeAdmin({ claimed: [], settings: { "co-a": sealed(), "co-b": sealed() } });
    await runDueWorkflows(keyed.admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather });
    expect(resumes(keyed.calls)).toHaveLength(1);
    expect(resumes(keyed.calls)[0].filters).toEqual([["paused_reason", "no_key"], ["company_id in", ["co-a", "co-b"]]]);
    expect(keyed.calls.findIndex((c) => c.op === "update")).toBeLessThan(keyed.calls.length);

    const keyless = fakeAdmin({ claimed: [] });
    await runDueWorkflows(keyless.admin, 5, { env: {}, gather });
    expect(resumes(keyless.calls)).toHaveLength(0);
  });

  it("fails closed when the settings cannot be read", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")], settingsError: true });
    const report = await runDueWorkflows(admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather, draft: draftStub() });
    expect(report.outcomes).toEqual([{ workflow: "Workflow w1", result: "failed", reason: "model settings could not be read" }]);
    expect(inserts(calls, "os_runs")).toHaveLength(0);
  });

  it("applies the daily ceiling per company on a company key, and reads the settings once per company", async () => {
    const { admin, calls } = fakeAdmin({
      claimed: [workflow("a1", "co-a"), workflow("a2", "co-a"), workflow("b1", "co-b")],
      settings: { "co-a": sealed(), "co-b": sealed() },
      runs: [{ cost_usd: 2.5, company_id: "co-a", workflow_id: "old" }],
    });
    const report = await runDueWorkflows(admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather, draft: draftStub() });

    expect(report.outcomes.map((o) => [o.workflow, o.result])).toEqual([["Workflow a1", "skipped"], ["Workflow a2", "skipped"], ["Workflow b1", "drafted"]]);
    const capReads = calls.filter((c) => c.table === "os_runs" && c.op === "select" && !c.filters.some(([column]) => column === "workflow_id"));
    expect(capReads.map((c) => c.filters.find(([column]) => column === "company_id")?.[1])).toEqual(["co-a", "co-a", "co-b"]);
    expect(calls.filter((c) => c.table === "os_model_settings" && c.filters.some(([column]) => column === "company_id"))).toHaveLength(2);
  });

  it("drafts through a compatible provider end to end: the real picker, a scripted server", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ draft: "Freight rates rose 4% in August.", claims: [{ text: "Freight rates rose 4% in August.", source_url: "https://example.com/a" }] }) }, finish_reason: "stop" }],
      usage: { prompt_tokens: 120, completion_tokens: 40 },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetcher);
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")], settings: { "co-a": sealed(SECRET, "openai_compatible", "grok-4", "https://api.example.test/v1") } });
    const report = await runDueWorkflows(admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather });

    expect(report.outcomes[0]).toMatchObject({ result: "drafted", costUsd: costUsdAt(PRICE, 120, 40) });
    expect(fetcher.mock.calls[0][0]).toBe("https://api.example.test/v1/chat/completions");
    expect(inserts(calls, "os_runs")[0]).toMatchObject({ model: "openai_compatible:grok-4", effort: null, cost_usd: costUsdAt(PRICE, 120, 40), input_tokens: 120, output_tokens: 40 });
    expect(JSON.stringify(calls)).not.toContain(KEY);
  });

  it("prices a client handed in with no company key as the platform's model", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")] });
    const report = await runDueWorkflows(admin, 5, { env: {}, gather, draft: draftStub() });
    expect(report.outcomes[0]).toMatchObject({ result: "drafted", costUsd: runCostUsd(100, 50) });
    expect(inserts(calls, "os_runs")[0]).toMatchObject({ model: "claude-opus-5", effort: "low", cost_usd: runCostUsd(100, 50) });
    expect(pauses(calls)).toHaveLength(0);
  });

  it("charges nothing for a local model and says which one it was", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")] });
    const report = await runDueWorkflows(admin, 5, {
      env: {}, gather,
      pick: () => ({ client: draftStub(), model: "qwen3:14b", effort: null, priced: false, label: "local:qwen3:14b" }),
    });
    expect(report.outcomes[0]).toMatchObject({ result: "drafted", costUsd: 0 });
    expect(inserts(calls, "os_runs")[0]).toMatchObject({ model: "local:qwen3:14b", effort: null, cost_usd: 0 });
  });

  it("never lets the key into a row, an outcome or a pause", async () => {
    const { admin, calls } = fakeAdmin({ claimed: [workflow("w1", "co-a")], settings: { "co-a": sealed() } });
    const report = await runDueWorkflows(admin, 5, { env: { MAYDAOS_KEY_SECRET: SECRET }, gather, draft: draftStub() });
    expect(JSON.stringify(report)).not.toContain(KEY);
    expect(JSON.stringify(calls)).not.toContain(KEY);
  });

  it("says every pause reason in every language", () => {
    for (const locale of ["en", "tr", "fr"] as const) {
      expect(Object.keys(OS_ACTIVITY_COPY[locale].pausedReasons).sort()).toEqual(Object.keys(OS_PAUSE_REASONS).sort());
    }
  });
});
