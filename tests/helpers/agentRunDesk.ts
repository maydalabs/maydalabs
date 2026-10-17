import type { ModelEvent } from "@/lib/osCofounder";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { ConfirmedReviewRejection } from "@/lib/osReviewGuard";
import { AgentRunRefusal, RUN_LIMITS, type AgentRunPlan, type AgentRunProgress, type AgentRunQuestion, type AgentRunStatus, type StopReason } from "@/lib/osAgentRunTypes";
import { waitingDays, type RunCaptureRecord, type RunEvent, type RunMemoryRow, type WorkRow } from "@/lib/osAgentRunTools";
import { RUN_TIMING, type RunHost, type RunSliceOptions, type RunTurn } from "@/lib/osAgentRun";
import type { ReviewWorkKind } from "@/lib/osReviewGuard";

/* An in-memory twin of the run RPCs, for the loop's tests and, later, the
 * local agent-run scenarios. It keeps the rules the SQL keeps — the lease
 * and seq fence, a hold per reserved round, usage once per round in any
 * status, a round that never reported charged at its hold before the next
 * round and at the end, one capture per item, one card per capture, eight
 * cards, the open-card rule, the plan once, one question, an immediate Stop
 * — and the same seq arithmetic, so a test that passes here describes what
 * Postgres does
 * (tests/sql/os_agent_runs.sql asserts the same cases against the real
 * schema). It has no Work table to write to and no memory table: the count
 * of writes to either is a constant zero a test can assert.
 */

export const DESK_NOW = Date.parse("2026-10-17T12:00:00Z");
function wellFormed(text: string): boolean {
  try { encodeURIComponent(text); return true; } catch { return false; }
}
const DAY = 86_400_000;

export type DeskItem = WorkRow & { company?: "own" | "other" };
export type DeskCard = { id: string; readId: string; itemId: string; payload: ProposalPayload; status: "proposed" | "saved" | "dismissed" };

export function deskItem(n: number, daysWaiting: number, overrides: Partial<DeskItem> = {}): DeskItem {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, title: `Follow up with buyer ${n}`, lane: "sales", kind: "reply",
    status: "review", required_action: "send", due_on: null,
    notes: `Waiting on buyer ${n} about invoice INV-${100 + n}. Contact: buyer${n}@example.invalid.`,
    updated_at: new Date(DESK_NOW - daysWaiting * DAY - 3_600_000).toISOString(), ...overrides,
  };
}

type Failure = { method: keyof RunHost; error: unknown; times: number };

export function agentRunDesk(options: {
  items: DeskItem[];
  memory?: RunMemoryRow[];
  events?: Record<string, RunEvent[]>;
  priced?: boolean;
  ceilingUsd?: number;
  draftFormat?: ReviewWorkKind;
  instruction?: string;
  /** Items with an undecided card from an EARLIER run. */
  earlierOpenCards?: string[];
  rounds?: number;
}) {
  let clock = DESK_NOW;
  let leases = 0;
  const draftFormat = options.draftFormat ?? "reply";
  const source = { id: "person-message-1", text: options.instruction ?? "Prepare follow-ups for everything waiting more than a week." };
  const run = {
    id: "run-1", status: "running" as AgentRunStatus, stopReason: null as StopReason | null, seq: 0, lease: `lease-${++leases}` as string | null,
    leaseUntil: DESK_NOW + RUN_TIMING.local.leaseSeconds * 1000 as number | null,
    slices: 1, rounds: options.rounds ?? 0, itemReads: 0, cards: 0, asked: false, plan: null as AgentRunPlan | null,
    question: null as AgentRunQuestion | null, answer: null as string | null, answeredAt: null as string | null,
    progress: [] as AgentRunProgress[], checkpoint: {} as unknown, priced: options.priced ?? false,
    ceilingUsd: options.priced ? options.ceilingUsd ?? 1 : 0, costUsd: 0, inputTokens: 0, outputTokens: 0,
  };
  const holds = new Map<number, number>();
  const ledger = new Map<number, { inputTokens: number; outputTokens: number; costUsd: number; estimated?: true }>();
  const captures = new Map<string, RunCaptureRecord>();
  const cards = new Map<string, DeskCard>();
  const failures: Failure[] = [];
  const log: string[] = [];
  let reply: string | null = null;
  let finishInput: Parameters<RunHost["finish"]>[0] | null = null;
  const stopNext: { round?: Extract<Awaited<ReturnType<RunHost["round"]>>, { go: false }>["stop"] } = {};
  const writes = Object.freeze({ work: 0, memory: 0, approvals: 0 });

  const at = () => new Date(clock).toISOString();
  const progress = (entry: Omit<AgentRunProgress, "at">) => { run.progress.push({ ...entry, at: at() }); };
  const terminal = () => ["completed", "failed", "canceled"].includes(run.status);
  const fence = (lease: string | null, seq?: number) => {
    if (run.status !== "running" || !lease || run.lease !== lease || (run.leaseUntil !== null && run.leaseUntil < clock)) throw new AgentRunRefusal("fenced");
    if (seq !== undefined && seq !== run.seq) throw new AgentRunRefusal("fenced");
  };
  const injected = (method: keyof RunHost) => {
    const failure = failures.find((entry) => entry.method === method && entry.times > 0);
    if (!failure) return;
    failure.times -= 1;
    throw failure.error;
  };
  const ownItems = () => options.items.filter((item) => item.company !== "other");
  /* internal.os_agent_run_settle: every held round with no ledger row is charged at its hold. */
  const settle = () => {
    for (const [round, hold] of holds) {
      if (ledger.has(round)) continue;
      ledger.set(round, { inputTokens: 0, outputTokens: 0, costUsd: hold, estimated: true });
      run.costUsd += hold;
    }
  };

  /* The receipt the SQL writes at finish and stop, from the cards as they stand. */
  function receipt(): string {
    const all = [...cards.values()];
    const count = (status: DeskCard["status"]) => all.filter((card) => card.status === status).length;
    const reasons: Record<StopReason, string> = {
      done: "it finished", card_limit: "it reached its limit of eight cards", step_limit: "it used all its model steps",
      budget: "its next step could have passed this run's spending limit",
      month_budget: "its next step could have passed this month's conversation budget",
      daily_cap: "its next step could have passed today's spending limit",
      uncertain: "a card could not be confirmed, so it prepared no more",
      provider: "the model could not finish", invalid_replies: "the model kept asking for too much at once",
      storage: "storage refused a step, so it stopped", canceled: "the member who started it stopped it",
    };
    return [
      all.length ? `Run receipt — cards prepared: ${all.length} (waiting for a decision: ${count("proposed")}; saved to Work by the member who started the run: ${count("saved")}; dismissed by that member: ${count("dismissed")}).` : "Run receipt — this run prepared no cards.",
      "Only the member who started the run can decide its cards. The run itself saved, approved, sent and published nothing.",
      `Model steps: ${run.rounds} of at most 12; records read: ${run.itemReads}; stopped: ${run.stopReason ? reasons[run.stopReason] : "unknown"}.`,
    ].join("\n");
  }

  function host(lease: string | null = run.lease): RunHost {
    return {
      now: () => clock,
      async round({ seq, projectedUsd }) {
        log.push("round"); injected("round");
        fence(lease, seq);
        if (projectedUsd < 0 || (!run.priced && projectedUsd !== 0)) throw new AgentRunRefusal("refused");
        settle();
        if (run.rounds >= RUN_LIMITS.rounds) return { go: false, stop: "step_limit", seq: run.seq };
        if (stopNext.round) { const stop = stopNext.round; delete stopNext.round; return { go: false, stop, seq: run.seq }; }
        if (run.priced && run.costUsd + projectedUsd > run.ceilingUsd) return { go: false, stop: "budget", seq: run.seq };
        run.rounds += 1; run.seq += 1;
        holds.set(run.rounds, projectedUsd);
        return { go: true, round: run.rounds, seq: run.seq };
      },
      async usage({ round, inputTokens, outputTokens, costUsd }) {
        log.push("usage"); injected("usage");
        if (!holds.has(round) || (!run.priced && costUsd !== 0) || costUsd < 0) throw new AgentRunRefusal("refused");
        if (ledger.has(round)) return;
        ledger.set(round, { inputTokens, outputTokens, costUsd });
        run.inputTokens += inputTokens; run.outputTokens += outputTokens; run.costUsd += costUsd;
      },
      async step({ seq, patch }) {
        log.push("step"); injected("step");
        fence(lease, seq);
        const entries = patch.progress ?? [];
        if (entries.filter((entry) => entry.k === "refused").length > 1 || entries.length > 12) throw new AgentRunRefusal("refused");
        if (patch.plan && run.plan) throw new AgentRunRefusal("plan_once");
        if (patch.transition?.to === "waiting" && run.asked) throw new AgentRunRefusal("already_asked");
        const stored = JSON.parse(JSON.stringify(patch.checkpoint)) as unknown;
        if (JSON.stringify(stored).length > 400_000) throw new AgentRunRefusal("refused");
        run.checkpoint = stored;
        if (patch.plan) run.plan = structuredClone(patch.plan);
        for (const entry of entries) progress(entry);
        if (patch.transition) {
          run.status = patch.transition.to;
          run.lease = null; run.leaseUntil = null;
          if (patch.transition.to === "waiting") {
            run.question = structuredClone(patch.transition.question); run.asked = true; run.answer = null; run.answeredAt = null;
          }
        }
        run.seq += 1;
        return { seq: run.seq };
      },
      async read({ itemId, ref }) {
        log.push(`read:${ref}`); injected("read");
        fence(lease);
        const existing = captures.get(itemId);
        if (existing) {
          if (existing.ref !== ref) throw new AgentRunRefusal("refused");
          return { created: false, seq: run.seq, itemReads: run.itemReads, capture: structuredClone(existing) };
        }
        if (run.itemReads >= RUN_LIMITS.itemReads) throw new AgentRunRefusal("read_limit");
        const item = ownItems().find((candidate) => candidate.id === itemId);
        if (!item) throw new AgentRunRefusal("item_unavailable");
        const capture: RunCaptureRecord = {
          id: `capture-${captures.size + 1}`, item_id: item.id, ref, title: item.title, lane: item.lane, kind: item.kind, status: item.status,
          required_action: item.required_action, due_on: item.due_on, waiting_days: waitingDays(item.updated_at, clock), item_updated_at: item.updated_at,
          source_text: item.title + ((item.notes ?? "").trim() ? `\n\n${(item.notes ?? "").slice(0, 3000)}` : ""), created_at: at(),
        };
        captures.set(itemId, capture);
        run.itemReads += 1; run.seq += 1;
        progress({ k: "read", label: capture.title, n: capture.waiting_days });
        return { created: true, seq: run.seq, itemReads: run.itemReads, capture: structuredClone(capture) };
      },
      async propose({ proposalId, readId, payload }) {
        log.push("propose"); injected("propose");
        fence(lease);
        const existing = cards.get(proposalId);
        if (existing) return { created: false, seq: run.seq, cards: run.cards, proposalId };
        const capture = [...captures.values()].find((candidate) => candidate.id === readId);
        if (!capture) throw new AgentRunRefusal("read_required");
        if (payload.type !== "work" || JSON.stringify(payload.citations) !== JSON.stringify([
          { sourceId: source.id, quote: source.text }, { sourceId: `read:${capture.id}`, quote: capture.title },
        ]) || payload.lane !== capture.lane) throw new AgentRunRefusal("citations");
        if ([...cards.values()].some((card) => card.readId === readId)) throw new AgentRunRefusal("item_carded");
        if (run.cards >= RUN_LIMITS.cards) throw new AgentRunRefusal("card_limit");
        if ((options.earlierOpenCards ?? []).includes(capture.item_id)) throw new AgentRunRefusal("open_card");
        if (payload.kind !== draftFormat) throw new ConfirmedReviewRejection("draft_format");
        cards.set(proposalId, { id: proposalId, readId, itemId: capture.item_id, payload: structuredClone(payload), status: "proposed" });
        run.cards += 1; run.seq += 1;
        progress({ k: "card", label: payload.title.slice(0, 200) });
        return { created: true, seq: run.seq, cards: run.cards, proposalId };
      },
      async finish(input) {
        log.push("finish"); injected("finish");
        if (terminal()) return;
        fence(lease, input.seq);
        // char_length, as SQL bounds it; and a lone surrogate, which PostgREST
        // refuses as invalid JSON (encodeURIComponent throws on one too).
        if ([...input.text].length > RUN_LIMITS.summaryChars || !wellFormed(input.text)) throw new AgentRunRefusal("refused");
        settle();
        run.status = input.status; run.stopReason = input.stopReason; run.lease = null; run.leaseUntil = null; run.seq += 1;
        progress({ k: input.status === "failed" ? "failed" : "finished" });
        finishInput = structuredClone(input);
        reply = [input.text.trim() || null, input.status === "failed" ? "[Interrupted: this answer is incomplete. Review stored suggestions separately.]" : null,
          input.text.trim() ? null : run.rounds === 0 ? "The run stopped before its first model step." : "The model gave no summary of its own; the receipt below is what the run did.",
          receipt()].filter(Boolean).join("\n\n");
      },
      async searchRecord() {
        log.push("search"); injected("searchRecord");
        const open = ownItems().filter((item) => !["completed", "canceled"].includes(item.status))
          .sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at));
        return { rows: structuredClone(open.slice(0, RUN_LIMITS.searchScan)), openTotal: open.length };
      },
      async readEvents(itemId) { log.push("events"); injected("readEvents"); return structuredClone(options.events?.[itemId] ?? []); },
      async listMemory() { log.push("memory"); injected("listMemory"); return { rows: structuredClone(options.memory ?? []), complete: true }; },
      async openCardItems() {
        injected("openCardItems");
        return new Set([...(options.earlierOpenCards ?? []), ...[...cards.values()].filter((card) => card.status === "proposed").map((card) => card.itemId)]);
      },
      async duplicateWork(payload) {
        injected("duplicateWork");
        return payload.type === "work" && ownItems().some((item) => !["completed", "canceled"].includes(item.status) && item.notes === payload.body);
      },
    };
  }

  return {
    run, holds, ledger, captures, cards, log, writes, source, draftFormat,
    get reply() { return reply; },
    get finished() { return finishInput; },
    advance(ms: number) { clock += ms; },
    now: () => clock,
    fail(method: keyof RunHost, error: unknown, times = 1) { failures.push({ method, error, times }); },
    stopNextRound(stop: NonNullable<typeof stopNext.round>) { stopNext.round = stop; },
    host,
    /** Stop, as os_agent_run_cancel does it: at once, in any open state. */
    cancel() {
      if (terminal()) return;
      settle();
      run.status = "canceled"; run.stopReason = "canceled"; run.lease = null; run.leaseUntil = null; run.seq += 1;
      progress({ k: "stopped" });
      reply = ["Run stopped by the member who started it.", receipt()].join("\n\n");
    },
    /** Continue (paused or stalled) or answer/skip (waiting), as os_agent_run_resume does it. */
    resume(action: "continue" | "answer" | "skip", answer?: string) {
      const stalled = run.status === "running" && run.leaseUntil !== null && run.leaseUntil < clock;
      if (action === "continue" ? !(run.status === "paused" || stalled) : run.status !== "waiting") throw new AgentRunRefusal("not_resumable");
      if (run.slices >= RUN_LIMITS.slices) throw new AgentRunRefusal("slice_limit");
      if (action !== "continue") { run.answer = action === "answer" ? answer!.trim() : null; run.answeredAt = at(); }
      run.status = "running"; run.lease = `lease-${++leases}`; run.leaseUntil = clock + RUN_TIMING.local.leaseSeconds * 1000;
      run.slices += 1; run.seq += 1;
      progress({ k: action === "continue" ? "resumed" : action === "answer" ? "answered" : "skipped" });
      return run.lease;
    },
    expireLease() { run.leaseUntil = clock - 1; },
    decide(proposalId: string, action: "save" | "dismiss") {
      const card = cards.get(proposalId);
      if (!card || card.status !== "proposed") throw new Error("not decidable");
      card.status = action === "save" ? "saved" : "dismissed";
    },
    /** The slice options the driver would build from this run row. */
    sliceOptions(turn: RunTurn, overrides: Partial<RunSliceOptions> = {}): RunSliceOptions {
      return {
        run: { seq: run.seq, priced: run.priced, rounds: run.rounds, itemReads: run.itemReads, cards: run.cards, asked: run.asked,
          plan: run.plan ? structuredClone(run.plan) : null, answer: run.answer, answeredAt: run.answeredAt },
        checkpoint: structuredClone(run.checkpoint), source, draftFormat, system: "Synthetic run instructions", turn,
        host: host(), deadline: clock + RUN_TIMING.local.sliceMs, timing: RUN_TIMING.local, ...overrides,
      };
    },
  };
}

/* A model that says exactly what a test needs, one scripted reply per round,
 * and records every request: what the loop did and what it would have sent. */
export type RunRequest = Parameters<RunTurn>[0];
export function scriptedRunTurn(replies: (ModelEvent[] | ((request: RunRequest) => AsyncIterable<ModelEvent>))[]) {
  const requests: RunRequest[] = [];
  const turn: RunTurn = async function* (request) {
    const index = requests.length;
    requests.push({ ...request, messages: structuredClone(request.messages) });
    const reply = replies[index];
    if (!reply) throw new Error(`Unexpected model round ${index + 1}`);
    if (typeof reply === "function") { yield* reply(request); return; }
    yield* reply;
  };
  return { turn, requests };
}

export const text = (value: string): ModelEvent => ({ type: "text", text: value });
let toolIds = 0;
export const tool = (name: string, input: Record<string, unknown>, id = `${name}-${++toolIds}`): ModelEvent => ({ type: "tool", id, name, input });
export const done = (stopReason: string | null, inputTokens = 1000, outputTokens = 100): ModelEvent => ({ type: "done", stopReason, inputTokens, outputTokens });
/** One reply: its events, then done with tool_use when it called a tool, end_turn otherwise. */
export const reply = (...events: ModelEvent[]): ModelEvent[] => [...events, done(events.some((event) => event.type === "tool") ? "tool_use" : "end_turn")];
