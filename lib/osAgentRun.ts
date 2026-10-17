import type { ModelEvent } from "@/lib/osCofounder";
import { runCostUsd } from "@/lib/os";
import { LOCAL_DRAFT_TIMEOUT_MS } from "@/lib/osDraftSchema";
import { costUsdAt, type ModelPrice } from "@/lib/osModelSettings";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { ConfirmedReviewRejection, REVIEW_REFUSAL_MESSAGES, reviewProposalGuard, type ReviewWorkKind } from "@/lib/osReviewGuard";
import { reviewIntentGuard } from "@/lib/osReviewIntent";
import { ReviewedTextGate } from "@/lib/osReviewTextGate";
import { RUN_TOOL_DEFINITIONS, RUN_TOOL_NAMES, isRunToolName, type RunToolName } from "@/lib/osAgentRunToolDefs";
import {
  AgentRunRefusal, RUN_LIMITS, type AgentRunPlan, type AgentRunQuestion, type BudgetStopReason, type CompletedStopReason, type DriverProgress,
  type FailedStopReason,
} from "@/lib/osAgentRunTypes";
import {
  RUN_NOTES, RUN_REFUSAL_MESSAGES, assignRefs, cardReadyText, filterSearch, formatMemoryResult, formatReadResult, formatSearchResult,
  founderAnswerText, parseRunToolInput, planRecordedText, resolveRef, runDraftEnvelope,
  type MemoryFilters, type RunCaptureRecord, type RunEvent, type RunMemoryRow, type SearchFilters, type WorkRow,
} from "@/lib/osAgentRunTools";

/* One slice of an agent run: the loop, and nothing it touches directly.
 *
 * Every effect goes through options.host — the lease-fenced RPCs, the admin
 * reads, the clock — so the same loop runs over Postgres in the driver and
 * over tests/helpers/agentRunDesk.ts in tests, and every stop rule is a
 * pass/fail assertion rather than a comment.
 *
 * The loop can stage review cards and nothing else. It never writes Work or
 * company knowledge; a card is an os_review_proposals row a person decides.
 *
 * Two rules make a crash, a timeout or a closed tab safe:
 *   - every planned call, with a fresh proposal id, is checkpointed BEFORE
 *     anything runs, so a resumed slice replays the same calls with the same
 *     ids instead of asking the model again;
 *   - a reply that was cut off, asked for too much, or arrived after Stop
 *     executes nothing at all.
 * A storage response that is lost is never guessed at: the slice stops
 * without finishing, the driver gives its lease up, and the person sees a
 * stalled run they can continue or stop.
 */

/** The route's exported maxDuration; a text test pins app/api/os/runs/route.ts to it. */
export const RUN_FUNCTION_SECONDS = 300;

export type RunTiming = {
  sliceMs: number; minRoundStartMs: number; roundMaxMs: number; roundMarginMs: number;
  leaseSeconds: number; queryTimeoutMs: number; watchMs: number;
};
/* Hosted: a 240 s slice inside the 300 s function, no round started with less
 * than 75 s left, and a lease (330 s) longer than the function can live, so
 * two drivers never overlap. Local (no VERCEL, the only place Ollama is ever
 * picked): one 30-minute slice, rounds as long as the local draft timeout. */
export const RUN_TIMING: { hosted: RunTiming; local: RunTiming } = {
  hosted: { sliceMs: 240_000, minRoundStartMs: 75_000, roundMaxMs: 90_000, roundMarginMs: 15_000, leaseSeconds: 330, queryTimeoutMs: 10_000, watchMs: 5_000 },
  local: { sliceMs: 30 * 60_000, minRoundStartMs: 60_000, roundMaxMs: LOCAL_DRAFT_TIMEOUT_MS, roundMarginMs: 15_000, leaseSeconds: 1890, queryTimeoutMs: 10_000, watchMs: 5_000 },
};

export type RunBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
export type RunMessage = { role: "user" | "assistant"; content: string | RunBlock[] };

/** ModelTurn, typed to the run's own tool names. */
export type RunTurn = (args: {
  system: string;
  messages: { role: "user" | "assistant"; content: unknown }[];
  tools?: readonly RunToolName[];
  signal?: AbortSignal;
  /** ModelTurn's: called once the provider has accepted the request. */
  accepted?: () => void;
}) => AsyncIterable<ModelEvent>;

export type RunCapture = { id: string; title: string; lane: string; round: number };

export type PlannedCall =
  | { i: number; toolUseId: string; kind: "refuse"; message: string }
  | { i: number; toolUseId: string; kind: "plan"; plan: AgentRunPlan }
  | { i: number; toolUseId: string; kind: "search"; filters: SearchFilters }
  | { i: number; toolUseId: string; kind: "read"; ref: string; itemId: string }
  | { i: number; toolUseId: string; kind: "memory"; filters: MemoryFilters }
  | { i: number; toolUseId: string; kind: "ask"; question: AgentRunQuestion }
  | { i: number; toolUseId: string; kind: "propose"; ref: string; proposalId: string; readId: string; payload: ProposalPayload };

/* The checkpoint, version 1. Pending calls are keyed by (round, index), never
 * by a provider's tool id: Ollama's ids repeat (local-1, local-2) each round. */
export type RunCheckpoint = {
  v: 1;
  messages: RunMessage[];
  refs: Record<string, string>;
  captures: Record<string, RunCapture>;
  cards: Record<string, string>;
  counters: { searches: number; memoryReads: number; refused: number; faults: number; cutOffs: number; consecutiveCutOffs: number; providerFailures: number };
  staging: "open" | "uncertain";
  awaiting: { toolUseId: string } | null;
  pending: { round: number; calls: PlannedCall[]; assistant: RunBlock[] } | null;
  lastInputTokens: number;
  lastText: string;
};

export type RunStepPatch = {
  checkpoint: RunCheckpoint;
  plan?: AgentRunPlan;
  progress?: DriverProgress[];
  transition?: { to: "paused" } | { to: "waiting"; question: AgentRunQuestion };
};

/* A reserved round is held in SQL at its projection until the call reports
 * its usage; a call that never reports (Stop, a timeout, a failure after
 * the provider accepted it, a lost response) is charged at that hold before
 * the next round or when the run ends, so the loop has nothing to estimate
 * itself. A call the provider refused before accepting it reports zero. A
 * refused round names the limit that stopped it. */
export type RoundReservation = { go: true; round: number; seq: number } | { go: false; stop: "step_limit" | BudgetStopReason; seq: number };

/** Every effect a slice may have. The driver implements it over Postgres; the desk in memory. */
export type RunHost = {
  now(): number;
  round(input: { seq: number; projectedUsd: number }): Promise<RoundReservation>;
  usage(input: { round: number; inputTokens: number; outputTokens: number; costUsd: number }): Promise<void>;
  step(input: { seq: number; patch: RunStepPatch }): Promise<{ seq: number }>;
  /** Both answer with SQL's own count, which the loop takes over its own. */
  read(input: { itemId: string; ref: string }): Promise<{ created: boolean; seq: number; itemReads: number; capture: RunCaptureRecord }>;
  propose(input: { proposalId: string; readId: string; payload: ProposalPayload }): Promise<{ created: boolean; seq: number; cards: number; proposalId: string }>;
  finish(input: { seq: number; status: "completed" | "failed"; stopReason: CompletedStopReason | FailedStopReason; text: string; refused: number; faults: number }): Promise<void>;
  searchRecord(): Promise<{ rows: WorkRow[]; openTotal: number | null }>;
  readEvents(itemId: string): Promise<RunEvent[]>;
  listMemory(): Promise<{ rows: RunMemoryRow[]; complete: boolean }>;
  openCardItems(): Promise<ReadonlySet<string>>;
  duplicateWork(payload: ProposalPayload): Promise<boolean>;
};

export type SliceOutcome =
  | { outcome: "finished"; status: "completed" | "failed"; stopReason: CompletedStopReason | FailedStopReason }
  | { outcome: "waiting" }
  | { outcome: "paused" }
  | { outcome: "fenced" }
  | { outcome: "unconfirmed"; at: string };

export type RunSliceOptions = {
  /** The run row as SQL holds it at slice start: counters are SQL's, never remembered. */
  run: { seq: number; priced: boolean; rounds: number; itemReads: number; cards: number; asked: boolean; plan: AgentRunPlan | null; answer: string | null; answeredAt: string | null };
  checkpoint: unknown;
  /** The stored instruction: the turn's person message, its id and its text. */
  source: { id: string; text: string };
  draftFormat: ReviewWorkKind;
  system: string;
  turn: RunTurn;
  host: RunHost;
  price?: ModelPrice;
  /** Epoch milliseconds measured from the route's entry, not from this call. */
  deadline: number;
  timing: RunTiming;
  /** Aborted by the driver's watcher when the run leaves running (Stop) or the lease moves. */
  signal?: AbortSignal;
  timeout?: (ms: number) => AbortSignal;
  newId?: () => string;
};

/** A slice that cannot read its own checkpoint, or a programming error the
 * driver logs by code only. Never carries provider text. */
export class AgentRunError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "AgentRunError"; }
}

const SUMMARY_TOOLS: readonly RunToolName[] = ["search_record", "read_work_item", "list_memory"];
const UNTRUSTED_TEXT_LIMIT = RUN_LIMITS.summaryChars;

/** At most max code points: SQL's char_length bound, and never half of a
 * surrogate pair — a lone surrogate makes the request body invalid JSON,
 * which PostgREST refuses before any statement runs. */
export function clipCodePoints(text: string, max: number): string {
  const points = [...text];
  return points.length > max ? points.slice(0, max).join("") : text;
}

/* ReviewedTextGate hides a printed tool call naming one of the chat's tools.
 * A run's tools have other names, and a printed call to one of them would
 * otherwise stand as the run's own words above the receipt. The same line
 * test, over the run's names: the gate releases a held JSON line whole, so a
 * line-by-line pass over the finished reply sees exactly the lines it saw.
 * Hiding the echo is all it does, as in the chat, where a hidden echo adds a
 * warning but never counts toward a fault limit. */
const RUN_TOOL_ECHO = new RegExp(`"name"\\s*:\\s*"(?:${RUN_TOOL_NAMES.join("|")})"`, "i");
export function withoutRunToolEcho(text: string): string {
  return text.split("\n").filter((line) => {
    const trimmed = line.trim();
    return !(/^[{[]/.test(trimmed) && RUN_TOOL_ECHO.test(trimmed) && /"arguments"\s*:/i.test(trimmed));
  }).join("\n");
}

export function freshCheckpoint(): RunCheckpoint {
  return {
    v: 1, messages: [], refs: {}, captures: {}, cards: {},
    counters: { searches: 0, memoryReads: 0, refused: 0, faults: 0, cutOffs: 0, consecutiveCutOffs: 0, providerFailures: 0 },
    staging: "open", awaiting: null, pending: null, lastInputTokens: 0, lastText: "",
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/* What tokens cost at the run's price: nothing on an unpriced local model,
 * the company's recorded rates on its own key, the platform's otherwise.
 * The loop, the start and the quote price every token this one way. */
export function runPriceUsd(run: { priced: boolean; price?: ModelPrice }, inputTokens: number, outputTokens: number): number {
  return !run.priced ? 0 : run.price ? costUsdAt(run.price, inputTokens, outputTokens) : runCostUsd(inputTokens, outputTokens);
}

/* What a round is held at before its call: the whole request — system,
 * history, the offered tools' definitions — at three characters a token, or
 * the previous call's own input count when that is larger, plus 3000 tokens
 * of slack, plus the most a reply may write (max_tokens 2000). It has no
 * upper bound of its own (os_agent_run_round). */
export function projectRoundUsd(input: {
  priced: boolean; price?: ModelPrice; system: string; messages: readonly RunMessage[]; tools: readonly RunToolName[]; lastInputTokens: number;
}): number {
  if (!input.priced) return 0;
  const definitions = RUN_TOOL_DEFINITIONS.filter((tool) => input.tools.includes(tool.name as RunToolName));
  const chars = input.system.length + JSON.stringify(input.messages).length + JSON.stringify(definitions).length;
  return runPriceUsd(input, Math.max(input.lastInputTokens, Math.ceil(chars / 3)) + 3000, 2000);
}

/* The tools a round may offer, from what the run has done so far. */
function offeredRunTools(cp: RunCheckpoint, run: { itemReads: number; plan: AgentRunPlan | null; asked: boolean; cards: number }): RunToolName[] {
  const offered = new Set<RunToolName>();
  if (cp.counters.searches < RUN_LIMITS.searches) offered.add("search_record");
  if (Object.keys(cp.refs).length && run.itemReads < RUN_LIMITS.itemReads) offered.add("read_work_item");
  if (cp.counters.memoryReads < RUN_LIMITS.memoryReads) offered.add("list_memory");
  if (!run.plan) offered.add("plan_run");
  if (!run.asked) offered.add("ask_founder");
  if (run.plan && run.cards < RUN_LIMITS.cards && cp.staging === "open") offered.add("propose_draft");
  return RUN_TOOL_NAMES.filter((name) => offered.has(name));
}

/** The fewest model rounds that can stage one card: search, read, propose. */
export const RUN_START_ROUNDS = 3;

/* What a run must be able to afford before it may begin
 * (os_agent_run_start's p_min_usd): its first round exactly as the loop will
 * hold it — the instruction alone, the tools a fresh run is offered, this
 * run's system prompt, at this run's price — for each of the fewest rounds
 * that can stage a card. Later rounds carry more history and are held
 * higher, so this is a floor, not a promise that three rounds will fit. */
export function runStartMinimumUsd(input: { priced: boolean; price?: ModelPrice; system: string; instruction: string }): number {
  const fresh = freshCheckpoint();
  const first = projectRoundUsd({
    priced: input.priced, price: input.price, system: input.system,
    messages: [{ role: "user", content: input.instruction }],
    tools: offeredRunTools(fresh, { itemReads: 0, plan: null, asked: false, cards: 0 }),
    lastInputTokens: fresh.lastInputTokens,
  });
  return Math.round(first * RUN_START_ROUNDS * 1_000_000) / 1_000_000;
}

/** The driver's own data, but read as if it were not: a checkpoint that does
 * not have this shape is never guessed at. An empty object is a fresh run. */
export function parseRunCheckpoint(value: unknown): RunCheckpoint | null {
  if (record(value) && Object.keys(value).length === 0) return freshCheckpoint();
  if (!record(value) || value.v !== 1 || !Array.isArray(value.messages) || !record(value.refs) || !record(value.captures) ||
    !record(value.cards) || !record(value.counters) || (value.staging !== "open" && value.staging !== "uncertain") ||
    !(value.awaiting === null || (record(value.awaiting) && typeof value.awaiting.toolUseId === "string")) ||
    !(value.pending === null || (record(value.pending) && Number.isSafeInteger(value.pending.round) && Array.isArray(value.pending.calls) && Array.isArray(value.pending.assistant))) ||
    typeof value.lastInputTokens !== "number" || typeof value.lastText !== "string") return null;
  const counters = value.counters;
  const names = ["searches", "memoryReads", "refused", "faults", "cutOffs", "consecutiveCutOffs", "providerFailures"] as const;
  if (!names.every((name) => Number.isSafeInteger(counters[name]) && (counters[name] as number) >= 0)) return null;
  if (!value.messages.every((message) => record(message) && (message.role === "user" || message.role === "assistant") &&
    (typeof message.content === "string" || Array.isArray(message.content)))) return null;
  return structuredClone(value) as unknown as RunCheckpoint;
}

/* A host note joins the previous user message when there is one; otherwise it
 * becomes its own user turn, which every provider merges with the turn
 * before. An assistant message is never written with empty visible text: an
 * empty assistant turn in the middle of a conversation is refused by the
 * Anthropic API, and a refused request would count as a provider failure. */
function appendUserText(messages: RunMessage[], note: string) {
  const last = messages.at(-1);
  if (last?.role === "user") {
    last.content = typeof last.content === "string" ? `${last.content}\n\n${note}` : [...last.content, { type: "text", text: note }];
  } else messages.push({ role: "user", content: note });
}
function appendSetAside(messages: RunMessage[], visible: string, note: string) {
  if (visible.trim()) messages.push({ role: "assistant", content: [{ type: "text", text: visible }] });
  appendUserText(messages, note);
}

type Reply =
  | { kind: "cancel"; usage: Usage | null }
  | { kind: "deadline"; usage: Usage | null }
  | { kind: "failed"; usage: Usage | null }
  | { kind: "reply"; usage: Usage; text: string; calls: { id: string; name: string; input: Record<string, unknown> }[]; invalidBatch: boolean; overLimit: boolean; stopReason: string | null };
type Usage = { inputTokens: number; outputTokens: number };

export async function runAgentSlice(options: RunSliceOptions): Promise<SliceOutcome> {
  const { host, timing } = options;
  const cp = parseRunCheckpoint(options.checkpoint);
  if (!cp) return { outcome: "unconfirmed", at: "checkpoint" };
  const newId = options.newId ?? (() => crypto.randomUUID());
  const intent = Object.freeze({ draftFormat: options.draftFormat, knowledgeAssertion: null });
  const source = Object.freeze({ id: options.source.id, text: options.source.text });
  let seq = options.run.seq;
  let rounds = options.run.rounds;
  let itemReads = options.run.itemReads;
  let cards = options.run.cards;
  let asked = options.run.asked;
  let plan = options.run.plan;
  const opening: RunMessage = { role: "user", content: source.text };

  const priceAt = { priced: options.run.priced, price: options.price };
  const price = (inputTokens: number, outputTokens: number) => runPriceUsd(priceAt, inputTokens, outputTokens);

  const finish = async (status: "completed" | "failed", stopReason: CompletedStopReason | FailedStopReason, text = cp.lastText): Promise<SliceOutcome> => {
    try {
      await host.finish({ seq, status, stopReason, text: clipCodePoints(text, UNTRUSTED_TEXT_LIMIT), refused: cp.counters.refused, faults: cp.counters.faults + cp.counters.cutOffs });
      return { outcome: "finished", status, stopReason };
    } catch (error) {
      return error instanceof AgentRunRefusal && error.code === "fenced" ? { outcome: "fenced" } : { outcome: "unconfirmed", at: "finish" };
    }
  };
  /* A round or a checkpoint the database refused rolled back, and would be
   * refused the same way on every Continue; the run finishes 'storage'
   * instead of stalling. Fenced means Stop happened or the lease moved. */
  const failure = async (error: unknown, at: string): Promise<SliceOutcome> => {
    if (error instanceof AgentRunRefusal) {
      if (error.code === "fenced") return { outcome: "fenced" };
      return finish("failed", "storage");
    }
    return { outcome: "unconfirmed", at };
  };
  const step = async (patch: Omit<RunStepPatch, "checkpoint"> = {}): Promise<SliceOutcome | null> => {
    try {
      seq = (await host.step({ seq, patch: { checkpoint: cp, ...patch } })).seq;
      return null;
    } catch (error) { return failure(error, "step"); }
  };
  const pause = async (): Promise<SliceOutcome> => (await step({ transition: { to: "paused" }, progress: [{ k: "paused" }] })) ?? { outcome: "paused" };
  const recordUsage = async (round: number, usage: Usage): Promise<SliceOutcome | null> => {
    // Recorded once per round in SQL; a lost response is retried once, which
    // cannot double-count. A call whose cost cannot be ledgered stops the run.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await host.usage({ round, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsd: price(usage.inputTokens, usage.outputTokens) });
        return null;
      } catch (error) {
        if (error instanceof AgentRunRefusal) return failure(error, "usage");
      }
    }
    return { outcome: "unconfirmed", at: "usage" };
  };

  function offeredTools(): RunToolName[] {
    return offeredRunTools(cp!, { itemReads, plan, asked, cards });
  }

  function notOffered(name: RunToolName): string {
    if (name === "propose_draft") return !plan ? RUN_REFUSAL_MESSAGES.plan_first : cp!.staging === "uncertain" ? RUN_REFUSAL_MESSAGES.uncertain : RUN_REFUSAL_MESSAGES.card_limit;
    if (name === "plan_run") return RUN_REFUSAL_MESSAGES.plan_once;
    if (name === "ask_founder") return RUN_REFUSAL_MESSAGES.already_asked;
    if (name === "search_record") return RUN_REFUSAL_MESSAGES.search_limit;
    if (name === "list_memory") return RUN_REFUSAL_MESSAGES.memory_limit;
    return Object.keys(cp!.refs).length ? RUN_REFUSAL_MESSAGES.read_limit : RUN_REFUSAL_MESSAGES.unknown_ref;
  }

  /* Planning is pure and runs over the whole reply before anything executes,
   * so in-reply limits count the calls before them and the checkpoint holds
   * the exact calls a resumed slice will replay. */
  function planCalls(round: number, calls: { id: string; name: string; input: Record<string, unknown> }[], offered: readonly RunToolName[]): PlannedCall[] {
    let searches = cp!.counters.searches;
    let memoryReads = cp!.counters.memoryReads;
    let planned = false;
    const newReads = new Set<string>();
    const carded = new Set<string>();
    return calls.map((call, i): PlannedCall => {
      const refuse = (message: string): PlannedCall => ({ i, toolUseId: call.id, kind: "refuse", message });
      if (!isRunToolName(call.name)) return refuse(RUN_REFUSAL_MESSAGES.unavailable);
      if (!offered.includes(call.name)) return refuse(notOffered(call.name));
      const parsed = parseRunToolInput(call.name, call.input);
      if (!parsed.ok) return refuse(parsed.message);
      const input = parsed.value;
      switch (input.tool) {
        case "plan_run":
          if (planned) return refuse(RUN_REFUSAL_MESSAGES.plan_once);
          if (!input.plan.refs.every((ref) => resolveRef(cp!.refs, ref))) return refuse(RUN_REFUSAL_MESSAGES.plan_refs);
          planned = true;
          return { i, toolUseId: call.id, kind: "plan", plan: input.plan };
        case "search_record":
          if (searches >= RUN_LIMITS.searches) return refuse(RUN_REFUSAL_MESSAGES.search_limit);
          searches += 1;
          return { i, toolUseId: call.id, kind: "search", filters: input.filters };
        case "read_work_item": {
          const itemId = resolveRef(cp!.refs, input.ref);
          if (!itemId) return refuse(RUN_REFUSAL_MESSAGES.unknown_ref);
          if (!cp!.captures[input.ref] && !newReads.has(input.ref)) {
            if (itemReads + newReads.size >= RUN_LIMITS.itemReads) return refuse(RUN_REFUSAL_MESSAGES.read_limit);
            newReads.add(input.ref);
          }
          return { i, toolUseId: call.id, kind: "read", ref: input.ref, itemId };
        }
        case "list_memory":
          if (memoryReads >= RUN_LIMITS.memoryReads) return refuse(RUN_REFUSAL_MESSAGES.memory_limit);
          memoryReads += 1;
          return { i, toolUseId: call.id, kind: "memory", filters: input.filters };
        case "ask_founder":
          if (calls.length > 1) return refuse(RUN_REFUSAL_MESSAGES.ask_alone);
          return { i, toolUseId: call.id, kind: "ask", question: input.question };
        case "propose_draft": {
          const { ref, title, body } = input.draft;
          if (cp!.staging !== "open") return refuse(RUN_REFUSAL_MESSAGES.uncertain);
          if (cards + carded.size >= RUN_LIMITS.cards) return refuse(RUN_REFUSAL_MESSAGES.card_limit);
          if (!plan) return refuse(RUN_REFUSAL_MESSAGES.plan_first);
          if (!plan.refs.includes(ref)) return refuse(RUN_REFUSAL_MESSAGES.not_planned);
          const capture = cp!.captures[ref];
          // Read in an EARLIER reply: the model must have seen the record.
          if (!capture || capture.round >= round) return refuse(RUN_REFUSAL_MESSAGES.read_first);
          if (cp!.cards[ref] || carded.has(ref)) return refuse(RUN_REFUSAL_MESSAGES.already_carded);
          const payload = runDraftEnvelope({ draftFormat: options.draftFormat, source, capture, title, body });
          // Title and body passed the tool's own bounds, so a refused envelope
          // is the record's lane: the review layer's parser — the chat's too,
          // and measured — counts it in UTF-16 units, and a stored card it
          // cannot parse would make the co-founder window unreadable. Such a
          // record gets no card, and the model is told why, not "re-read it".
          if (!payload) return refuse(capture.lane.length > 40 ? RUN_REFUSAL_MESSAGES.lane : RUN_REFUSAL_MESSAGES.citations);
          const guard = reviewIntentGuard(payload, intent) ?? reviewProposalGuard(payload);
          if (guard) return refuse(REVIEW_REFUSAL_MESSAGES[guard]);
          carded.add(ref);
          return { i, toolUseId: call.id, kind: "propose", ref, proposalId: newId(), readId: capture.id, payload };
        }
      }
    });
  }

  /* Execute the checkpointed calls in order, then write the result
   * checkpoint. The same function replays a pending reply after a crash:
   * a read returns its existing capture, a propose its existing card. */
  async function executePending(replay: boolean): Promise<SliceOutcome | null> {
    const pending = cp!.pending!;
    const results: Extract<RunBlock, { type: "tool_result" }>[] = [];
    const progress: DriverProgress[] = [];
    let refused = 0;
    let planned: AgentRunPlan | undefined;
    let question: AgentRunQuestion | null = null;
    let openCards: ReadonlySet<string> | null = null;
    const cardsOpen = async () => {
      if (!openCards) { try { openCards = await host.openCardItems(); } catch { openCards = new Set(); } }
      return openCards;
    };
    const fail = (call: PlannedCall, message: string) => {
      refused += 1;
      results.push({ type: "tool_result", tool_use_id: call.toolUseId, content: message, is_error: true });
    };
    for (const call of pending.calls) {
      // No tool runs after Stop, not even a read.
      if (options.signal?.aborted) return { outcome: "fenced" };
      switch (call.kind) {
        case "refuse": fail(call, call.message); break;
        case "plan":
          planned = call.plan;
          progress.push({ k: "plan", n: call.plan.steps.length });
          results.push({ type: "tool_result", tool_use_id: call.toolUseId, content: planRecordedText(call.plan) });
          break;
        case "search": {
          cp!.counters.searches += 1;
          try {
            const now = host.now();
            const { rows, openTotal } = await host.searchRecord();
            const matched = filterSearch(rows, call.filters, now);
            const assigned = assignRefs(cp!.refs, matched.slice(0, call.filters.limit).map((row) => row.id));
            cp!.refs = assigned.refs;
            const text = formatSearchResult({ matched, limit: call.filters.limit, openTotal, scanned: rows.length, now, refFor: assigned.refFor, openCards: await cardsOpen() });
            progress.push({ k: "search", n: matched.length });
            results.push({ type: "tool_result", tool_use_id: call.toolUseId, content: text });
          } catch { fail(call, RUN_REFUSAL_MESSAGES.read_failed); }
          break;
        }
        case "read": {
          let read;
          try { read = await host.read({ itemId: call.itemId, ref: call.ref }); }
          catch (error) {
            if (error instanceof AgentRunRefusal) {
              if (error.code === "fenced") return { outcome: "fenced" };
              fail(call, error.code === "read_limit" ? RUN_REFUSAL_MESSAGES.read_limit : RUN_REFUSAL_MESSAGES.item_unavailable);
              break;
            }
            // The capture may exist. Replaying the same read is safe, so stop
            // here and let a Continue replay it rather than guess.
            return { outcome: "unconfirmed", at: "read" };
          }
          seq = read.seq;
          itemReads = read.itemReads;
          cp!.captures[call.ref] = cp!.captures[call.ref] ?? { id: read.capture.id, title: read.capture.title, lane: read.capture.lane, round: pending.round };
          let events: RunEvent[] | null;
          // Scoped by the capture's item, which SQL already checked belongs to the company.
          try { events = await host.readEvents(read.capture.item_id); } catch { events = null; }
          results.push({ type: "tool_result", tool_use_id: call.toolUseId,
            content: formatReadResult({ capture: read.capture, events, openCard: (await cardsOpen()).has(read.capture.item_id), now: host.now() }) });
          break;
        }
        case "memory": {
          cp!.counters.memoryReads += 1;
          try {
            const { rows, complete } = await host.listMemory();
            const formatted = formatMemoryResult(rows, call.filters, complete);
            progress.push({ k: "memory", n: formatted.returned });
            results.push({ type: "tool_result", tool_use_id: call.toolUseId, content: formatted.text });
          } catch { fail(call, RUN_REFUSAL_MESSAGES.read_failed); }
          break;
        }
        case "ask":
          question = call.question;
          cp!.awaiting = { toolUseId: call.toolUseId };
          progress.push({ k: "asked" });
          break;
        case "propose": {
          if (cp!.staging !== "open") { fail(call, RUN_REFUSAL_MESSAGES.uncertain); break; }
          // A replayed call may name a card the person has saved since; SQL's own
          // duplicate trigger still guards a new insert, so the preflight is
          // only for calls running for the first time.
          if (!replay) {
            let duplicate: boolean;
            try { duplicate = await host.duplicateWork(call.payload); }
            catch { fail(call, RUN_REFUSAL_MESSAGES.duplicate_check); break; }
            if (duplicate) { fail(call, REVIEW_REFUSAL_MESSAGES.duplicate_work); break; }
          }
          let outcome: "staged" | "refused" | "fenced" | "unconfirmed" = "unconfirmed";
          for (let attempt = 0; attempt < 2 && outcome === "unconfirmed"; attempt += 1) {
            try {
              const staged = await host.propose({ proposalId: call.proposalId, readId: call.readId, payload: call.payload });
              seq = staged.seq;
              // SQL's count, not ours: a retry after a lost response that had
              // committed answers created false, and counting only creations
              // would leave the run one card short of its limit.
              cards = staged.cards;
              cp!.cards[call.ref] = staged.proposalId;
              outcome = "staged";
            } catch (error) {
              if (error instanceof AgentRunRefusal) {
                if (error.code === "fenced") { outcome = "fenced"; break; }
                const message = error.code === "open_card" ? RUN_REFUSAL_MESSAGES.open_card
                  : error.code === "item_carded" ? RUN_REFUSAL_MESSAGES.item_carded
                  : error.code === "card_limit" ? RUN_REFUSAL_MESSAGES.card_limit
                  : error.code === "read_required" ? RUN_REFUSAL_MESSAGES.read_required
                  : error.code === "citations" ? RUN_REFUSAL_MESSAGES.citations
                  : REVIEW_REFUSAL_MESSAGES.refused;
                fail(call, message);
                outcome = "refused";
              } else if (error instanceof ConfirmedReviewRejection) {
                fail(call, REVIEW_REFUSAL_MESSAGES[error.reason]);
                outcome = "refused";
              }
              // Anything else is a lost response: retried once with the same id,
              // which is exactly-once by construction.
            }
          }
          if (outcome === "fenced") return { outcome: "fenced" };
          if (outcome === "staged") results.push({ type: "tool_result", tool_use_id: call.toolUseId, content: cardReadyText(call.ref) });
          if (outcome === "unconfirmed") {
            // A lost DB response is not proof of rollback: close staging for the
            // whole run; one summary round follows and the run ends 'uncertain'.
            cp!.staging = "uncertain";
            fail(call, RUN_REFUSAL_MESSAGES.uncertain);
          }
          break;
        }
      }
    }
    if (refused) progress.push({ k: "refused", n: refused });
    cp!.counters.refused += refused;
    cp!.messages.push({ role: "assistant", content: pending.assistant });
    // The ask's own result arrives with the founder's answer on resume.
    if (results.length) cp!.messages.push({ role: "user", content: results });
    cp!.pending = null;
    const stopped = await step({
      ...(planned ? { plan: planned } : {}),
      ...(progress.length ? { progress } : {}),
      ...(question ? { transition: { to: "waiting" as const, question } } : {}),
    });
    if (stopped) return stopped;
    if (planned) plan = planned;
    if (question) { asked = true; return { outcome: "waiting" }; }
    return null;
  }

  async function callModel(messages: RunMessage[], tools: readonly RunToolName[], remaining: number): Promise<Reply> {
    const bound = remaining - timing.roundMarginMs;
    // When the slice deadline is nearer than the round limit, a timeout is the
    // deadline's doing, not the provider's: the run pauses instead of failing.
    const deadlineBound = bound <= timing.roundMaxMs;
    const roundTimeout = (options.timeout ?? ((ms: number) => AbortSignal.timeout(ms)))(Math.max(1, Math.min(timing.roundMaxMs, bound)));
    const signal = options.signal ? AbortSignal.any([options.signal, roundTimeout]) : roundTimeout;
    const gate = new ReviewedTextGate();
    let text = "";
    let size = 0;
    let overLimit = false;
    let invalidBatch = false;
    let usage: Usage | null = null;
    let stopReason: string | null = null;
    // Whether the provider took the request: its response began (the turn
    // says so), or any event arrived. From then on the call may be billed.
    let accepted = false;
    const calls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    const ids = new Set<string>();
    const ended = (kind: "cancel" | "deadline" | "failed"): Reply => ({ kind, usage });
    try {
      for await (const event of options.turn({ system: options.system, messages, tools, signal, accepted: () => { accepted = true; } })) {
        accepted = true;
        if (usage) return ended("failed");   // anything after completion is an inconsistent reply
        if (event.type === "text") {
          if (typeof event.text !== "string") return ended("failed");
          size += event.text.length;
          // Past the limit the text is dropped, not the stream: the done event
          // still arrives and the call is still ledgered.
          if (size > RUN_LIMITS.modelTextPerReply) { overLimit = true; continue; }
          for (const visible of gate.feed(event.text)) text += visible;
        } else if (event.type === "tool") {
          if (calls.length >= RUN_LIMITS.callsPerReply || typeof event.id !== "string" || !event.id.trim() || event.id.length > 200 || ids.has(event.id)) {
            invalidBatch = true;
            continue;
          }
          ids.add(event.id);
          calls.push({ id: event.id, name: event.name, input: record(event.input) ? event.input : {} });
        } else {
          if (![event.inputTokens, event.outputTokens].every((value) => Number.isSafeInteger(value) && value >= 0)) return ended("failed");
          usage = { inputTokens: event.inputTokens, outputTokens: event.outputTokens };
          stopReason = event.stopReason;
        }
      }
    } catch {
      if (options.signal?.aborted) return ended("cancel");
      if (roundTimeout.aborted) return ended(deadlineBound ? "deadline" : "failed");
      /* Refused before the provider took it — a 429 or 529 once the SDK's
       * retries are spent, a refused request, a DNS or connection failure.
       * Nothing was billed, so the round is ledgered at zero now. Left
       * without usage it would be charged at its whole hold before the next
       * round: two phantom holds per failing run, counted against the month,
       * the chat's 402 and the platform's day. A call stopped or timed out,
       * or one that failed after it was taken, keeps its hold: it may have
       * been billed, and the hold errs high. */
      if (!accepted) return { kind: "failed", usage: { inputTokens: 0, outputTokens: 0 } };
      return ended("failed");
    }
    if (options.signal?.aborted) return ended("cancel");
    if (!usage) return ended("failed");
    for (const visible of gate.finish()) text += visible;
    if (calls.length > 0 && stopReason !== "tool_use") invalidBatch = true;
    if (calls.length === 0 && stopReason === "tool_use") invalidBatch = true;
    return { kind: "reply", usage, text: withoutRunToolEcho(text), calls, invalidBatch, overLimit, stopReason };
  }

  function projection(messages: RunMessage[], tools: readonly RunToolName[]): number {
    return projectRoundUsd({ ...priceAt, system: options.system, messages, tools, lastInputTokens: cp!.lastInputTokens });
  }

  // 0. Resume: the founder's answer first, then any calls planned before a crash.
  if (cp.awaiting) {
    if (!options.run.answeredAt) return { outcome: "unconfirmed", at: "awaiting" };
    appendToolResult(cp.messages, cp.awaiting.toolUseId, options.run.answer ? founderAnswerText(options.run.answer) : RUN_NOTES.skip);
    cp.awaiting = null;
    const stopped = await step();
    if (stopped) return stopped;
  }
  if (cp.pending) {
    const stopped = await executePending(true);
    if (stopped) return stopped;
  }

  for (;;) {
    if (options.signal?.aborted) return { outcome: "fenced" };
    const remaining = options.deadline - host.now();
    if (remaining < timing.minRoundStartMs) return pause();
    const forced: CompletedStopReason | null = rounds + 1 >= RUN_LIMITS.rounds ? "step_limit"
      : cards >= RUN_LIMITS.cards ? "card_limit" : cp.staging === "uncertain" ? "uncertain" : null;
    const offered = forced ? SUMMARY_TOOLS : offeredTools();
    // The summary note is sent, never stored: a resumed summary round must not repeat it.
    const messages: RunMessage[] = structuredClone([opening, ...cp.messages]);
    if (forced) appendUserText(messages, RUN_NOTES.summary);

    let reservation: RoundReservation;
    try { reservation = await host.round({ seq, projectedUsd: projection(messages, offered) }); }
    catch (error) { return failure(error, "round"); }
    seq = reservation.seq;
    if (!reservation.go) return finish("completed", reservation.stop, "");
    rounds = reservation.round;

    const reply = await callModel(messages, offered, remaining);
    // No usage (Stop, a deadline, a failure after the provider took the
    // call): SQL holds the round at its projection and charges that hold
    // before the next round or at the end. A refused call reports zero.
    if (reply.usage) {
      const stopped = await recordUsage(reservation.round, reply.usage);
      if (stopped) return stopped;
    }
    if (reply.kind === "cancel") return { outcome: "fenced" };
    if (reply.kind === "deadline") return pause();
    if (reply.kind === "failed") {
      cp.counters.providerFailures += 1;
      if (cp.counters.providerFailures >= RUN_LIMITS.providerFailures) return finish("failed", "provider");
      const stopped = await step();
      if (stopped) return stopped;
      continue;
    }
    cp.counters.providerFailures = 0;
    cp.lastInputTokens = reply.usage.inputTokens;

    if (reply.stopReason === "max_tokens" || reply.overLimit) {
      cp.counters.cutOffs += 1;
      cp.counters.consecutiveCutOffs += 1;
      if (cp.counters.consecutiveCutOffs >= RUN_LIMITS.cutOffs) return finish("failed", "provider", reply.text || cp.lastText);
      appendSetAside(cp.messages, reply.text, RUN_NOTES.cutOff);
      const stopped = await step({ progress: [{ k: "cut_off" }] });
      if (stopped) return stopped;
      continue;
    }
    if (reply.invalidBatch) {
      cp.counters.faults += 1;
      if (cp.counters.faults >= RUN_LIMITS.faults) return finish("failed", "invalid_replies", reply.text || cp.lastText);
      appendSetAside(cp.messages, reply.text, RUN_NOTES.fault);
      const stopped = await step({ progress: [{ k: "fault" }] });
      if (stopped) return stopped;
      continue;
    }
    if (reply.stopReason !== "end_turn" && reply.stopReason !== "tool_use") return finish("failed", "provider", reply.text || cp.lastText);
    cp.counters.consecutiveCutOffs = 0;
    cp.lastText = reply.text;
    if (!reply.calls.length) return finish("completed", forced ?? "done");
    if (forced) {
      // The final step runs nothing it asks for; the run finishes on its text.
      cp.counters.refused += reply.calls.length;
      return finish("completed", forced);
    }

    const assistant: RunBlock[] = [
      ...(reply.text.trim() ? [{ type: "text" as const, text: reply.text }] : []),
      ...reply.calls.map((call) => ({ type: "tool_use" as const, id: call.id, name: call.name, input: call.input })),
    ];
    cp.pending = { round: reservation.round, calls: planCalls(reservation.round, reply.calls, offered), assistant };
    // The planning checkpoint: nothing runs until these exact calls are durable.
    const planning = await step();
    if (planning) return planning;
    const stopped = await executePending(false);
    if (stopped) return stopped;
  }
}

/* The ask's result, on resume. The message before it is always the
 * assistant's ask, so this is always a new user turn. */
function appendToolResult(messages: RunMessage[], toolUseId: string, content: string) {
  messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUseId, content }] });
}
