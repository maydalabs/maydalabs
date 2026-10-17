import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelEvent } from "@/lib/osCofounder";
import { DEFAULT_PERSONA } from "@/lib/osPersona";
import { RUN_TIMING, type RunTiming } from "@/lib/osAgentRun";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  load: vi.fn(), lease: vi.fn(), round: vi.fn(), usage: vi.fn(), step: vi.fn(), read: vi.fn(), propose: vi.fn(), finish: vi.fn(),
  search: vi.fn(), events: vi.fn(), memory: vi.fn(), openCards: vi.fn(), duplicate: vi.fn(), admin: vi.fn(), release: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osReviewDuplicate", () => ({ rejectExistingOpenWork: mocks.duplicate }));
vi.mock("@/lib/osAgentRunReads", () => ({ searchRecord: mocks.search, readEvents: mocks.events, listMemory: mocks.memory, openCardItems: mocks.openCards }));
vi.mock("@/lib/osAgentRunStore", () => ({
  loadAgentRunPrivate: mocks.load, readAgentRunLease: mocks.lease, roundAgentRun: mocks.round, recordAgentRunUsage: mocks.usage,
  stepAgentRun: mocks.step, readForAgentRun: mocks.read, proposeForAgentRun: mocks.propose, finishAgentRun: mocks.finish, releaseAgentRun: mocks.release,
}));
import { driveAgentRun, runTimingFor } from "@/lib/osAgentRunDriver";

const runId = "00000000-0000-4000-8000-000000000001";
const lease = "00000000-0000-4000-8000-0000000000aa";
const order: string[] = [];
const NOW = Date.parse("2026-10-17T12:00:00Z");
const privateRun = (overrides: Record<string, unknown> = {}) => ({
  run: { id: runId, status: "running", lease_id: lease, seq: 1, priced: false, rounds: 0, item_reads: 0, cards: 0, asked: false, plan: null,
    answer: null, answered_at: null, checkpoint: {}, ...overrides },
  turn: { question: "Prepare follow-ups.", person_message_id: "message-1", draftFormat: "reply", status: "running" },
});
function turnOf(replies: ModelEvent[][]) {
  const requests: { system: string; tools?: readonly string[]; signal?: AbortSignal }[] = [];
  const turn = async function* (args: { system: string; tools?: readonly string[]; signal?: AbortSignal }) {
    requests.push(args);
    order.push("model");
    const reply = replies[requests.length - 1];
    if (!reply) throw new Error("unexpected model round");
    yield* reply;
  };
  return { turn, requests };
}
const context = (turn: unknown, overrides: Record<string, unknown> = {}) => ({
  runId, companyId: "company-1", actorId: "actor-1", lease, startedAt: NOW,
  picked: { turn, priced: false, label: "local:qwen3:14b" }, company: { name: "Synthetic Orchard", what_we_do: "Apples." },
  persona: DEFAULT_PERSONA, env: {}, now: () => NOW, ...overrides,
}) as Parameters<typeof driveAgentRun>[0];

let info: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetAllMocks();
  info = vi.spyOn(console, "info").mockImplementation(() => {});
  order.length = 0;
  let seq = 1;
  mocks.admin.mockReturnValue({});
  mocks.load.mockResolvedValue(privateRun());
  mocks.lease.mockResolvedValue({ status: "running", lease_id: lease });
  mocks.round.mockImplementation(async () => { order.push("round"); seq += 1; return { go: true, round: seq - 1, seq }; });
  mocks.usage.mockImplementation(async () => { order.push("usage"); return { recorded: true }; });
  mocks.step.mockImplementation(async (_admin, _who, input: { patch: { checkpoint: { pending: unknown } } }) => {
    order.push(input.patch.checkpoint.pending ? "planning step" : "result step"); seq += 1; return { seq, status: "running" };
  });
  mocks.search.mockImplementation(async () => { order.push("search"); return { rows: [], openTotal: 0 }; });
  mocks.openCards.mockResolvedValue(new Set());
  mocks.finish.mockImplementation(async () => { order.push("finish"); return {}; });
  mocks.release.mockImplementation(async () => { order.push("release"); return { released: true }; });
});

describe("one slice, driven", () => {
  it("runs round, model, usage, planning step, tools and result step, then finishes exactly once", async () => {
    const model = turnOf([
      [{ type: "tool", id: "s1", name: "search_record", input: {} }, { type: "done", stopReason: "tool_use", inputTokens: 900, outputTokens: 40 }],
      [{ type: "text", text: "Nothing waits." }, { type: "done", stopReason: "end_turn", inputTokens: 1000, outputTokens: 20 }],
    ]);
    const outcome = await driveAgentRun(context(model.turn));
    expect(outcome).toEqual({ outcome: "finished", status: "completed", stopReason: "done" });
    expect(order).toEqual(["round", "model", "usage", "planning step", "search", "result step", "round", "model", "usage", "finish"]);
    expect(mocks.finish).toHaveBeenCalledTimes(1);
    expect(mocks.finish.mock.calls[0][2]).toMatchObject({ id: runId, lease, status: "completed", stopReason: "done", text: "Nothing waits." });
    expect(mocks.round.mock.calls[0][2]).toMatchObject({ id: runId, lease, projectedUsd: 0, dailyCapUsd: 2 });
    expect(model.requests[0].system).toContain("FORMAT: every card is a reply");
    expect(model.requests[0].system).toContain("Today (UTC): 2026-10-17.");
  });

  it("reads the daily cap the worker reads", async () => {
    await driveAgentRun(context(turnOf([[{ type: "text", text: "x" }, { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 }]]).turn, { env: { MAYDAOS_DAILY_USD_CAP: "0.75" } }));
    expect(mocks.round.mock.calls[0][2]).toMatchObject({ dailyCapUsd: 0.75 });
  });

  it("measures the deadline from the route's start, not from when the slice began", async () => {
    const model = turnOf([]);
    const timing = runTimingFor({ VERCEL: "1" });
    expect(timing).toBe(RUN_TIMING.hosted);
    // The route started 170 s ago: 70 s remain, below the 75 s minimum for a round.
    const outcome = await driveAgentRun(context(model.turn, { env: { VERCEL: "1" }, startedAt: NOW - 170_000 }));
    expect(outcome).toEqual({ outcome: "paused" });
    expect(model.requests).toHaveLength(0);
    expect(mocks.step.mock.calls[0][2].patch.transition).toEqual({ to: "paused" });
  });

  it("aborts the round when the watcher sees the run leave running", async () => {
    const timing: RunTiming = { ...RUN_TIMING.local, watchMs: 5 };
    mocks.lease.mockResolvedValue({ status: "canceled", lease_id: null });
    const turn = async function* (args: { signal?: AbortSignal }): AsyncIterable<ModelEvent> {
      order.push("model");
      await new Promise((resolve) => args.signal?.addEventListener("abort", resolve, { once: true }));
      throw new Error("aborted");
    };
    expect(await driveAgentRun(context(turn, { timing }))).toEqual({ outcome: "fenced" });
    expect(order).toEqual(["round", "model"]);
    expect(mocks.finish).not.toHaveBeenCalled();
  });

  it("stops without finishing when a checkpoint is unconfirmed, and gives its lease up at once", async () => {
    mocks.step.mockRejectedValue(new Error("agent_run_unconfirmed"));
    const model = turnOf([[{ type: "tool", id: "s1", name: "search_record", input: {} }, { type: "done", stopReason: "tool_use", inputTokens: 9, outputTokens: 4 }]]);
    expect(await driveAgentRun(context(model.turn))).toEqual({ outcome: "unconfirmed", at: "step" });
    expect(mocks.finish).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
    // The run reads as stalled now, not when a 30-minute local lease would have run out.
    expect(mocks.release).toHaveBeenCalledExactlyOnceWith({}, { companyId: "company-1", actorId: "actor-1" }, { id: runId, lease });
    expect(order.at(-1)).toBe("release");
    expect(JSON.parse(info.mock.calls[0][0] as string)).toEqual({ event: "agent_run_slice", run: runId, outcome: "unconfirmed", at: "step", released: true });
  });

  it("still ends the slice when giving the lease up fails", async () => {
    mocks.step.mockRejectedValue(new Error("agent_run_unconfirmed"));
    mocks.release.mockRejectedValue(new Error("agent_run_unconfirmed"));
    const model = turnOf([[{ type: "tool", id: "s1", name: "search_record", input: {} }, { type: "done", stopReason: "tool_use", inputTokens: 9, outputTokens: 4 }]]);
    expect(await driveAgentRun(context(model.turn))).toEqual({ outcome: "unconfirmed", at: "step" });
    expect(JSON.parse(info.mock.calls[0][0] as string)).toMatchObject({ outcome: "unconfirmed", released: false });
  });

  it("never gives a lease up after a finish, a pause or a fence", async () => {
    await driveAgentRun(context(turnOf([[{ type: "text", text: "x" }, { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 }]]).turn));
    await driveAgentRun(context(turnOf([]).turn, { env: { VERCEL: "1" }, startedAt: NOW - 170_000 }));
    mocks.load.mockResolvedValue(privateRun({ lease_id: "00000000-0000-4000-8000-0000000000bb" }));
    await driveAgentRun(context(turnOf([]).turn));
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("does nothing when the lease it was given is no longer the run's", async () => {
    mocks.load.mockResolvedValue(privateRun({ lease_id: "00000000-0000-4000-8000-0000000000bb" }));
    expect(await driveAgentRun(context(turnOf([]).turn))).toEqual({ outcome: "fenced" });
    expect(mocks.round).not.toHaveBeenCalled();
  });

  it("does nothing but give its own lease up when the private state cannot be read", async () => {
    mocks.load.mockRejectedValue(new Error("agent_run_unconfirmed"));
    expect(await driveAgentRun(context(turnOf([]).turn))).toEqual({ outcome: "unconfirmed", at: "load" });
    expect(mocks.round).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledExactlyOnceWith({}, { companyId: "company-1", actorId: "actor-1" }, { id: runId, lease });
  });

  it("logs codes only, never model or record text", async () => {
    await driveAgentRun(context(turnOf([[{ type: "text", text: "PRIVATE SUMMARY" }, { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 }]]).turn));
    expect(info).toHaveBeenCalledTimes(1);
    expect(JSON.parse(info.mock.calls[0][0] as string)).toEqual({ event: "agent_run_slice", run: runId, outcome: "finished", stop: "done" });
  });
});
