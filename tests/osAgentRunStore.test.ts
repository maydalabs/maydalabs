import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/osCofounder";
import { ConfirmedReviewRejection } from "@/lib/osReviewGuard";
import { AGENT_RUN_REFUSALS, AgentRunRefusal } from "@/lib/osAgentRunTypes";
import { freshCheckpoint } from "@/lib/osAgentRun";

vi.mock("server-only", () => ({}));
import {
  agentRunError, cancelAgentRun, finishAgentRun, leaseToRecover, listAgentRuns, loadAgentRunsNow, proposeForAgentRun, readForAgentRun, recordAgentRunUsage,
  releaseAgentRun, resumeAgentRun, roundAgentRun, startAgentRun, stepAgentRun,
} from "@/lib/osAgentRunStore";

const who = { companyId: "00000000-0000-4000-8000-0000000000c1", actorId: "00000000-0000-4000-8000-0000000000a1" };
const runId = "00000000-0000-4000-8000-0000000000r1".replace("r", "e");
const row = (overrides: Record<string, unknown> = {}) => ({
  id: runId, company_id: who.companyId, actor_id: who.actorId, status: "running", stop_reason: null, payer: "local", priced: false,
  model_label: "local:qwen3:14b", ceiling_usd: 0, seq: 1, slices: 1, lease_until: "2026-10-17T12:30:00Z", rounds: 0, item_reads: 0, cards: 0,
  asked: false, input_tokens: 0, output_tokens: 0, cost_usd: 0, plan: null, question: null, answer: null, answered_at: null,
  progress: [], created_at: "2026-10-17T12:00:00Z", updated_at: "2026-10-17T12:00:00Z", finished_at: null, ...overrides,
});

type Result = { data: unknown; error: null | { code?: string; message?: string } };
function client(result: Result | (() => Promise<Result>)) {
  const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
    void name; void args;
    return { abortSignal: () => typeof result === "function" ? result() : Promise.resolve(result) };
  });
  return { db: { rpc } as unknown as Db, rpc };
}

describe("RPC arguments", () => {
  it("start passes the verified identity, the format, the payer, the start minimum and the lease length", async () => {
    const { db, rpc } = client({ data: { created: true, run: row(), lease: "00000000-0000-4000-8000-00000000001e" }, error: null });
    const started = await startAgentRun(db, who, { id: runId, instruction: "Prepare follow-ups.", draftFormat: "reply", payer: "platform", modelLabel: "claude-opus-5", capUsd: 1, dailyCapUsd: 2, minUsd: 0.2351, leaseSeconds: 1890 });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("os_agent_run_start", {
      p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_instruction: "Prepare follow-ups.", p_draft_format: "reply",
      p_payer: "platform", p_model_label: "claude-opus-5", p_cap_usd: 1, p_daily_cap: 2, p_min_usd: 0.2351, p_lease_seconds: 1890,
    });
    expect(started).toMatchObject({ created: true, lease: "00000000-0000-4000-8000-00000000001e", run: { id: runId } });
  });

  it("a start replay returns no lease", async () => {
    const { db } = client({ data: { created: false, run: row() }, error: null });
    expect(await startAgentRun(db, who, { id: runId, instruction: "x", draftFormat: "reply", payer: "local", modelLabel: "x", capUsd: 1, dailyCapUsd: 2, minUsd: 0, leaseSeconds: 600 })).toMatchObject({ created: false, lease: null });
  });

  it("round, usage, step, read, propose, finish, cancel and resume send exactly their arguments", async () => {
    const calls: [string, unknown][] = [];
    const results: Record<string, unknown> = {
      os_agent_run_round: { go: true, round: 1, seq: 2 },
      os_agent_run_usage: { recorded: true },
      os_agent_run_step: { seq: 3, status: "running" },
      os_agent_run_read: { created: true, seq: 4, item_reads: 1, read: { id: "capture-1", run_id: runId, company_id: who.companyId, item_id: "item-1", ref: "w1", title: "T", lane: "sales", kind: "reply", status: "review", required_action: "send", due_on: null, waiting_days: 9, item_updated_at: "2026-10-08T12:00:00Z", source_text: "T", created_at: "2026-10-17T12:00:00Z" } },
      os_agent_run_propose: { created: false, seq: 4, cards: 1, proposal: { id: "proposal-1", turn_id: runId, company_id: who.companyId, actor_id: who.actorId, revision: 2 } },
      os_agent_run_finish: { run: row({ status: "completed", stop_reason: "done", lease_until: null, finished_at: "2026-10-17T12:05:00Z" }) },
      os_agent_run_cancel: { run: row({ status: "canceled", stop_reason: "canceled", lease_until: null, finished_at: "2026-10-17T12:05:00Z" }) },
      os_agent_run_resume: { run: row(), lease: "lease-2" },
    };
    const db = { rpc: vi.fn((name: string, args: unknown) => { calls.push([name, args]); return { abortSignal: async () => ({ data: results[name], error: null }) }; }) } as unknown as Db;
    const lease = "lease-1";
    expect(await roundAgentRun(db, who, { id: runId, lease, seq: 1, projectedUsd: 0, dailyCapUsd: 2 })).toEqual({ go: true, round: 1, seq: 2 });
    await recordAgentRunUsage(db, { id: runId, round: 1, inputTokens: 10, outputTokens: 2, costUsd: 0 });
    expect(await stepAgentRun(db, who, { id: runId, lease, seq: 2, patch: { checkpoint: freshCheckpoint() } })).toEqual({ seq: 3, status: "running" });
    expect((await readForAgentRun(db, who, { id: runId, lease, itemId: "item-1", ref: "w1" })).capture.id).toBe("capture-1");
    expect(await proposeForAgentRun(db, who, { id: runId, lease, proposalId: "proposal-1", readId: "capture-1", payload: { type: "work", title: "T", body: "B", lane: "sales", kind: "reply", outwardAction: "send", citations: [] } }))
      .toEqual({ created: false, seq: 4, cards: 1, proposalId: "proposal-1" });
    await finishAgentRun(db, who, { id: runId, lease, seq: 4, status: "completed", stopReason: "done", text: "Summary.", refused: 1, faults: 0 });
    await cancelAgentRun(db, who, runId);
    await resumeAgentRun(db, who, { id: runId, seq: 5, action: "skip", answer: null, leaseSeconds: 600 });
    expect(calls).toEqual([
      ["os_agent_run_round", { p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_lease: lease, p_seq: 1, p_projected_usd: 0, p_daily_cap: 2 }],
      ["os_agent_run_usage", { p_id: runId, p_round: 1, p_input: 10, p_output: 2, p_cost: 0 }],
      ["os_agent_run_step", { p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_lease: lease, p_seq: 2, p_patch: { checkpoint: freshCheckpoint() } }],
      ["os_agent_run_read", { p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_lease: lease, p_item: "item-1", p_ref: "w1" }],
      ["os_agent_run_propose", expect.objectContaining({ p_id: runId, p_lease: lease, p_proposal: "proposal-1", p_read: "capture-1" })],
      ["os_agent_run_finish", { p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_lease: lease, p_seq: 4, p_status: "completed", p_stop_reason: "done", p_text: "Summary.", p_refused: 1, p_faults: 0 }],
      ["os_agent_run_cancel", { p_id: runId, p_company: who.companyId, p_actor: who.actorId }],
      ["os_agent_run_resume", { p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_seq: 5, p_action: "skip", p_answer: null, p_lease_seconds: 600 }],
    ]);
  });

  it("names which spending limit refused a round", async () => {
    for (const stop of ["budget", "month_budget", "daily_cap", "step_limit"] as const) {
      expect(await roundAgentRun(client({ data: { go: false, stop, seq: 3 }, error: null }).db, who, { id: runId, lease: "l", seq: 3, projectedUsd: 0.1, dailyCapUsd: 2 }))
        .toEqual({ go: false, stop, seq: 3 });
    }
    await expect(roundAgentRun(client({ data: { go: false, stop: "invented", seq: 3 }, error: null }).db, who, { id: runId, lease: "l", seq: 3, projectedUsd: 0, dailyCapUsd: 2 }))
      .rejects.toThrow("agent_run_unconfirmed");
  });

  it("takes SQL's own read and card counts, and distrusts a receipt without them", async () => {
    const payload = { type: "work" as const, title: "T", body: "B", lane: "sales", kind: "reply", outwardAction: "send", citations: [] };
    const proposal = { id: "proposal-1", turn_id: runId, company_id: who.companyId, actor_id: who.actorId };
    for (const cards of [undefined, -1, 9, "1"]) {
      await expect(proposeForAgentRun(client({ data: { created: false, seq: 4, cards, proposal }, error: null }).db, who, { id: runId, lease: "l", proposalId: "proposal-1", readId: "c", payload }))
        .rejects.toThrow("agent_run_unconfirmed");
    }
    expect(await proposeForAgentRun(client({ data: { created: false, seq: 4, cards: 8, proposal }, error: null }).db, who, { id: runId, lease: "l", proposalId: "proposal-1", readId: "c", payload }))
      .toMatchObject({ created: false, cards: 8 });
  });

  it("gives a lease up with exactly its arguments", async () => {
    const { db, rpc } = client({ data: { released: true, seq: 7 }, error: null });
    expect(await releaseAgentRun(db, who, { id: runId, lease: "lease-1" })).toEqual({ released: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("os_agent_run_release", { p_id: runId, p_company: who.companyId, p_actor: who.actorId, p_lease: "lease-1" });
    await expect(releaseAgentRun(client({ data: { seq: 7 }, error: null }).db, who, { id: runId, lease: "lease-1" })).rejects.toThrow("agent_run_unconfirmed");
  });

  it("a step whose seq did not advance by one is unconfirmed", async () => {
    const { db } = client({ data: { seq: 9, status: "running" }, error: null });
    await expect(stepAgentRun(db, who, { id: runId, lease: "l", seq: 2, patch: { checkpoint: freshCheckpoint() } })).rejects.toThrow("agent_run_unconfirmed");
  });
});

describe("what an error proves", () => {
  it.each(AGENT_RUN_REFUSALS.filter((code) => code !== "refused" && code !== "unavailable"))("maps agent_run_%s to its refusal code", (code) => {
    const error = agentRunError("os_agent_run_step", { code: "P0001", message: `agent_run_${code}` });
    expect(error).toBeInstanceOf(AgentRunRefusal);
    expect((error as AgentRunRefusal).code).toBe(code);
  });

  it("passes the review layer's own refusals through for a propose", () => {
    for (const [message, reason] of [["review_duplicate_work", "duplicate_work"], ["review_draft_format", "draft_format"], ["review_work_action_mismatch", "work_action"], ["review_intent_required", "intent_required"]] as const) {
      const error = agentRunError("os_agent_run_propose", { code: "P0001", message });
      expect(error).toBeInstanceOf(ConfirmedReviewRejection);
      expect((error as ConfirmedReviewRejection).reason).toBe(reason);
    }
  });

  it.each(["23514", "22023", "42883", "P0002", "23505"])("treats class %s as a confirmed refusal", (code) => {
    expect((agentRunError("os_agent_run_step", { code, message: "PRIVATE" }) as AgentRunRefusal).code).toBe("refused");
    expect((agentRunError("os_agent_run_propose", { code, message: "PRIVATE" }) as ConfirmedReviewRejection).reason).toBe("refused");
  });

  it("treats an unknown raise as a confirmed refusal: it still rolled back", () => {
    expect((agentRunError("os_agent_run_step", { code: "P0001", message: "agent_run_invented" }) as AgentRunRefusal).code).toBe("refused");
  });

  it.each(["PGRST100", "PGRST102", "PGRST107"])("treats PostgREST request error %s as a confirmed refusal: no statement ran", (code) => {
    expect((agentRunError("os_agent_run_finish", { code, message: "Empty or invalid json" }) as AgentRunRefusal).code).toBe("refused");
    expect((agentRunError("os_agent_run_propose", { code, message: "Empty or invalid json" }) as ConfirmedReviewRejection).reason).toBe("refused");
  });

  it("treats a refused identity as unavailable", () => {
    expect((agentRunError("os_agent_run_cancel", { code: "42501", message: "agent run unavailable" }) as AgentRunRefusal).code).toBe("unavailable");
  });

  it.each([undefined, null, { message: "fetch failed" }, { code: "08006" }, { code: "57014" }, { code: "PGRST301" }, { code: "PGRST116" }, { code: "PGRST000" }])("treats %j as unconfirmed", (error) => {
    const mapped = agentRunError("os_agent_run_step", error as never);
    expect(mapped).not.toBeInstanceOf(AgentRunRefusal);
    expect(mapped.message).toBe("agent_run_unconfirmed");
  });

  it("treats a thrown transport error and an empty response as unconfirmed", async () => {
    await expect(cancelAgentRun(client(() => Promise.reject(new Error("socket hang up"))).db, who, runId)).rejects.toThrow("agent_run_unconfirmed");
    await expect(cancelAgentRun(client({ data: null, error: null }).db, who, runId)).rejects.toThrow("agent_run_unconfirmed");
  });
});

describe("receipts toward a client", () => {
  it("refuse a run row carrying the checkpoint or the lease token", async () => {
    for (const leaked of [{ checkpoint: {} }, { lease_id: "lease-1" }]) {
      await expect(cancelAgentRun(client({ data: { run: row(leaked) }, error: null }).db, who, runId)).rejects.toThrow("agent_run_unconfirmed");
    }
  });
  it("refuse a run of another company or actor", async () => {
    await expect(cancelAgentRun(client({ data: { run: row({ actor_id: "someone-else" }) }, error: null }).db, who, runId)).rejects.toThrow("agent_run_unconfirmed");
  });
  it("refuse a propose receipt naming another card or turn", async () => {
    const { db } = client({ data: { created: true, seq: 3, proposal: { id: "other", turn_id: runId, company_id: who.companyId, actor_id: who.actorId } }, error: null });
    await expect(proposeForAgentRun(db, who, { id: runId, lease: "l", proposalId: "proposal-1", readId: "c", payload: { type: "work", title: "T", body: "B", lane: "s", kind: "reply", outwardAction: "send", citations: [] } }))
      .rejects.toThrow("agent_run_unconfirmed");
  });
});

describe("listing runs for a member", () => {
  it("adds the instruction, the format, captures, stalled from the server clock and mine from the viewer", async () => {
    const serverNow = Date.parse("2026-10-17T13:00:00Z");
    const tables: Record<string, unknown[]> = {
      os_agent_runs: [row(), row({ id: "00000000-0000-4000-8000-0000000000e2", actor_id: "other-member", status: "completed", stop_reason: "done", lease_until: null, finished_at: "2026-10-17T12:10:00Z", created_at: "2026-10-17T11:00:00Z" })],
      os_review_turns: [{ id: runId, question: "Prepare follow-ups.", request_intent: { draftFormat: "reply", knowledgeAssertion: null } },
        { id: "00000000-0000-4000-8000-0000000000e2", question: "Draft notes.", request_intent: { draftFormat: "note", knowledgeAssertion: null } }],
      os_agent_run_reads: [{ id: "capture-1", run_id: runId, ref: "w1", title: "Item 1" }],
    };
    const filters: [string, string, unknown][] = [];
    const from = vi.fn((table: string) => {
      const query = {
        select: () => query, order: () => query, limit: () => query, gte: () => query,
        eq: (column: string, value: unknown) => { filters.push([table, column, value]); return query; },
        in: (column: string, value: unknown) => { filters.push([table, column, value]); return query; },
        then: (resolve: (value: Result) => unknown) => Promise.resolve({ data: tables[table], error: null }).then(resolve),
      };
      return query;
    });
    const views = await listAgentRuns({ from } as unknown as Db, who.companyId, who.actorId, serverNow);
    expect(views.map((view) => [view.instruction, view.draftFormat, view.stalled, view.mine])).toEqual([
      ["Prepare follow-ups.", "reply", true, true], ["Draft notes.", "note", false, false],
    ]);
    expect(views[0].captures).toEqual([{ id: "capture-1", ref: "w1", title: "Item 1" }]);
    expect(filters.filter(([, column]) => column === "company_id").map(([table]) => table)).toEqual(["os_agent_runs", "os_agent_runs", "os_review_turns", "os_agent_run_reads"]);
    expect(JSON.stringify(views)).not.toContain("checkpoint");
  });

  function tablesClient(tables: Record<string, unknown[]>) {
    const from = vi.fn((table: string) => {
      const query = {
        select: () => query, order: () => query, limit: () => query, gte: () => query, eq: () => query, in: () => query,
        then: (resolve: (value: Result) => unknown) => Promise.resolve({ data: tables[table], error: null }).then(resolve),
      };
      return query;
    });
    return { from } as unknown as Db;
  }

  it("reads a record title SQL accepted: 200 code points, astral characters included", async () => {
    // 199 letters and an emoji: 200 to char_length, 201 UTF-16 units.
    const title = `${"a".repeat(199)}\u{1F600}`;
    expect(title.length).toBe(201);
    const progress = [{ k: "read", label: title, n: 9, at: "2026-10-17T12:01:00Z" }];
    const views = await listAgentRuns(tablesClient({
      os_agent_runs: [row({ progress })], os_agent_run_reads: [],
      os_review_turns: [{ id: runId, question: "Prepare follow-ups.", request_intent: { draftFormat: "reply", knowledgeAssertion: null } }],
    }), who.companyId, who.actorId, Date.parse("2026-10-17T12:10:00Z"));
    expect(views.map((view) => view.progress[0].label)).toEqual([title]);
  });

  it("leaves out one run it cannot read instead of hiding every run of the company", async () => {
    const other = "00000000-0000-4000-8000-0000000000e2";
    const tables = {
      os_agent_runs: [row(), row({ id: other, progress: [{ k: "invented", at: "2026-10-17T12:01:00Z" }] })], os_agent_run_reads: [],
      os_review_turns: [{ id: runId, question: "Prepare follow-ups.", request_intent: { draftFormat: "reply", knowledgeAssertion: null } },
        { id: other, question: "Draft notes.", request_intent: { draftFormat: "note", knowledgeAssertion: null } }],
    };
    expect((await listAgentRuns(tablesClient(tables), who.companyId, who.actorId, Date.parse("2026-10-17T12:10:00Z"))).map((view) => view.id)).toEqual([runId]);
    // Asked for by its id, an unreadable run is said to be unreadable.
    await expect(listAgentRuns(tablesClient({ ...tables, os_agent_runs: [tables.os_agent_runs[1]] }), who.companyId, who.actorId, Date.parse("2026-10-17T12:10:00Z"), { id: other }))
      .rejects.toThrow("agent_runs_unavailable");
  });

  it("recovers a lost start's lease only when the run is live at exactly the expected seq", async () => {
    const now = Date.parse("2026-10-17T12:10:00Z");
    const lease = (data: unknown) => {
      const query = { select: () => query, eq: () => query, abortSignal: () => query, maybeSingle: async () => ({ data, error: null }) };
      return { from: () => query } as unknown as Db;
    };
    const live = { status: "running", lease_id: "lease-1", lease_until: "2026-10-17T12:15:00Z", seq: 0 };
    expect(await leaseToRecover(lease(live), who, runId, 0, now)).toBe("lease-1");
    expect(await leaseToRecover(lease({ ...live, seq: 1 }), who, runId, 0, now)).toBeNull();
    expect(await leaseToRecover(lease({ ...live, lease_until: "2026-10-17T12:09:59Z" }), who, runId, 0, now)).toBeNull();
    expect(await leaseToRecover(lease({ ...live, status: "paused", lease_id: null, lease_until: null }), who, runId, 0, now)).toBeNull();
    expect(await leaseToRecover(lease(null), who, runId, 0, now)).toBeNull();
  });

  it("for a server render, judges the runs by the clock it hands on with them", async () => {
    vi.useFakeTimers();
    try {
      for (const [now, stalled] of [["2026-10-17T12:29:59Z", false], ["2026-10-17T12:30:01Z", true]] as const) {
        vi.setSystemTime(new Date(now));
        const tables: Record<string, unknown[]> = {
          os_agent_runs: [row()], os_agent_run_reads: [],
          os_review_turns: [{ id: runId, question: "Prepare follow-ups.", request_intent: { draftFormat: "reply", knowledgeAssertion: null } }],
        };
        const from = vi.fn((table: string) => {
          const query = {
            select: () => query, order: () => query, limit: () => query, gte: () => query, eq: () => query, in: () => query,
            then: (resolve: (value: Result) => unknown) => Promise.resolve({ data: tables[table], error: null }).then(resolve),
          };
          return query;
        });
        const loaded = await loadAgentRunsNow({ from } as unknown as Db, who.companyId, who.actorId);
        expect(loaded.serverNow).toBe(Date.parse(now));
        expect(loaded.runs.map((run) => run.stalled)).toEqual([stalled]);
      }
    } finally { vi.useRealTimers(); }
  });
});
