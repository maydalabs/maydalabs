import "server-only";
import type { Db } from "@/lib/osCofounder";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { ConfirmedReviewRejection, REVIEW_WORK_KINDS, type ReviewGuardReason, type ReviewWorkKind } from "@/lib/osReviewGuard";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  AGENT_RUN_PUBLIC_COLUMNS, AgentRunRefusal, BUDGET_STOP_REASONS, isAgentRunRefusalCode, isStalled, parseAgentRunRow, RUN_LIMITS,
  type AgentRunRow, type AgentRunView, type CompletedStopReason, type FailedStopReason, type RunPayer,
} from "@/lib/osAgentRunTypes";
import type { RunCaptureRecord } from "@/lib/osAgentRunTools";
import type { RoundReservation, RunStepPatch } from "@/lib/osAgentRun";

/* The ten run RPCs, typed, and the reads a run needs.
 *
 * Every RPC is service-role only (the migration grants nothing else), so
 * every writer here takes the admin client; identity comes from verified
 * claims in the route, never from a body. A receipt is narrowed before it is
 * trusted, and a run receipt that carries the checkpoint or the lease token
 * is refused outright (parseAgentRunRow), so neither can be forwarded to a
 * browser by mistake.
 *
 * Errors are sorted by what they prove, as lib/osReviewStore.ts sorts them:
 *   - an agent_run_* exception (P0001) is a refusal with a known meaning;
 *   - a review_* exception from a propose is the review layer's own refusal;
 *   - any other data (22), constraint (23), access (42) or plpgsql (P0) class
 *     rolled the statement back, so it is a confirmed refusal too;
 *   - PostgREST's request errors (PGRST100-107: a body that is not JSON, a
 *     query it cannot parse, the wrong media type) are refused before any
 *     statement runs, so they are confirmed refusals as well;
 *   - everything else — transport, gateway, timeouts — is unconfirmed: the
 *     write may have committed, and nothing here retries or guesses.
 */

type Who = { companyId: string; actorId: string };
type Functions = Database["public"]["Functions"];
type RunRpc = Extract<keyof Functions, `os_agent_run_${string}`>;

const REVIEW_REASONS: Record<string, ReviewGuardReason> = {
  review_duplicate_work: "duplicate_work", review_work_action_mismatch: "work_action", review_intent_required: "intent_required",
  review_draft_format: "draft_format", review_knowledge_assertion: "knowledge_assertion",
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function seqOf(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("agent_run_unconfirmed");
  return value;
}
const unconfirmed = () => new Error("agent_run_unconfirmed");
/** A run's own counter as SQL returns it: a whole number within its limit, or the receipt is not trusted. */
function countOf(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > max) throw unconfirmed();
  return value;
}

/** Sort a PostgREST error by what it proves. Exported for the route's own reads. */
export function agentRunError(name: string, error: { code?: string; message?: string } | null | undefined): Error {
  const code = error?.code;
  const message = error?.message ?? "";
  if (code === "P0001" && message.startsWith("agent_run_")) {
    const refusal = message.slice("agent_run_".length);
    if (isAgentRunRefusalCode(refusal)) return new AgentRunRefusal(refusal);
  }
  if (code === "P0001" && Object.hasOwn(REVIEW_REASONS, message)) {
    return name === "os_agent_run_propose" ? new ConfirmedReviewRejection(REVIEW_REASONS[message]) : new AgentRunRefusal("refused");
  }
  if (code === "42501") return name === "os_agent_run_propose" ? new ConfirmedReviewRejection("refused") : new AgentRunRefusal("unavailable");
  if (typeof code === "string" && (/^(22|23|42|P0)[0-9A-Z]{3}$/.test(code) || /^PGRST10[0-7]$/.test(code))) {
    return name === "os_agent_run_propose" ? new ConfirmedReviewRejection("refused") : new AgentRunRefusal("refused");
  }
  return unconfirmed();
}

async function rpc<Name extends RunRpc>(db: Db, name: Name, args: Functions[Name]["Args"], timeoutMs = 10_000): Promise<unknown> {
  let result;
  try { result = await db.rpc(name, args).abortSignal(AbortSignal.timeout(timeoutMs)); }
  catch { throw unconfirmed(); }
  if (result.error) throw agentRunError(name, result.error);
  if (result.data === null || result.data === undefined) throw unconfirmed();
  return result.data;
}

function runReceipt(value: unknown, who: Who, id: string): AgentRunRow {
  const run = parseAgentRunRow(value);
  if (!run || run.id !== id || run.company_id !== who.companyId || run.actor_id !== who.actorId) throw unconfirmed();
  return run;
}

export async function startAgentRun(admin: Db, who: Who, input: {
  id: string; instruction: string; draftFormat: ReviewWorkKind; payer: RunPayer; modelLabel: string; capUsd: number; dailyCapUsd: number;
  /** runStartMinimumUsd: what the first rounds would be held at; below it SQL refuses with budget. */
  minUsd: number; leaseSeconds: number;
}) {
  const data = await rpc(admin, "os_agent_run_start", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_instruction: input.instruction, p_draft_format: input.draftFormat,
    p_payer: input.payer, p_model_label: input.modelLabel, p_cap_usd: input.capUsd, p_daily_cap: input.dailyCapUsd, p_min_usd: input.minUsd,
    p_lease_seconds: input.leaseSeconds,
  });
  if (!record(data) || typeof data.created !== "boolean") throw unconfirmed();
  const run = runReceipt(data.run, who, input.id);
  if (data.created && !text(data.lease)) throw unconfirmed();
  return { created: data.created, run, lease: data.created ? data.lease as string : null };
}

export async function roundAgentRun(admin: Db, who: Who, input: { id: string; lease: string; seq: number; projectedUsd: number; dailyCapUsd: number }): Promise<RoundReservation> {
  const data = await rpc(admin, "os_agent_run_round", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_lease: input.lease, p_seq: input.seq,
    p_projected_usd: input.projectedUsd, p_daily_cap: input.dailyCapUsd,
  });
  if (!record(data)) throw unconfirmed();
  if (data.go === true && typeof data.round === "number" && Number.isSafeInteger(data.round) && data.round >= 1 && data.round <= RUN_LIMITS.rounds) {
    return { go: true as const, round: data.round, seq: seqOf(data.seq) };
  }
  if (data.go === false && (data.stop === "step_limit" || BUDGET_STOP_REASONS.some((stop) => stop === data.stop))) {
    return { go: false, stop: data.stop as Extract<RoundReservation, { go: false }>["stop"], seq: seqOf(data.seq) };
  }
  throw unconfirmed();
}

export async function recordAgentRunUsage(admin: Db, input: { id: string; round: number; inputTokens: number; outputTokens: number; costUsd: number }) {
  const data = await rpc(admin, "os_agent_run_usage", {
    p_id: input.id, p_round: input.round, p_input: input.inputTokens, p_output: input.outputTokens, p_cost: input.costUsd,
  });
  if (!record(data) || typeof data.recorded !== "boolean") throw unconfirmed();
  return { recorded: data.recorded };
}

export async function stepAgentRun(admin: Db, who: Who, input: { id: string; lease: string; seq: number; patch: RunStepPatch }) {
  const data = await rpc(admin, "os_agent_run_step", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_lease: input.lease, p_seq: input.seq,
    p_patch: input.patch as unknown as Json,
  });
  if (!record(data) || typeof data.status !== "string") throw unconfirmed();
  const seq = seqOf(data.seq);
  if (seq !== input.seq + 1) throw unconfirmed();
  return { seq, status: data.status };
}

function captureReceipt(value: unknown, input: { id: string; itemId: string; ref: string }, companyId: string): RunCaptureRecord {
  if (!record(value) || !text(value.id) || value.run_id !== input.id || value.company_id !== companyId || value.item_id !== input.itemId ||
    value.ref !== input.ref || !text(value.title) || !text(value.lane) || !text(value.kind) || !text(value.status) ||
    !(value.required_action === null || typeof value.required_action === "string") || !(value.due_on === null || typeof value.due_on === "string") ||
    typeof value.waiting_days !== "number" || !text(value.item_updated_at) || !text(value.source_text) || !text(value.created_at)) throw unconfirmed();
  return {
    id: value.id, item_id: value.item_id, ref: value.ref, title: value.title, lane: value.lane, kind: value.kind, status: value.status,
    required_action: value.required_action as string | null, due_on: value.due_on as string | null, waiting_days: value.waiting_days,
    item_updated_at: value.item_updated_at, source_text: value.source_text, created_at: value.created_at,
  };
}

export async function readForAgentRun(admin: Db, who: Who, input: { id: string; lease: string; itemId: string; ref: string }) {
  const data = await rpc(admin, "os_agent_run_read", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_lease: input.lease, p_item: input.itemId, p_ref: input.ref,
  });
  if (!record(data) || typeof data.created !== "boolean") throw unconfirmed();
  return { created: data.created, seq: seqOf(data.seq), itemReads: countOf(data.item_reads, RUN_LIMITS.itemReads), capture: captureReceipt(data.read, input, who.companyId) };
}

export async function proposeForAgentRun(admin: Db, who: Who, input: { id: string; lease: string; proposalId: string; readId: string; payload: ProposalPayload }) {
  const data = await rpc(admin, "os_agent_run_propose", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_lease: input.lease,
    p_proposal: input.proposalId, p_read: input.readId, p_payload: input.payload as unknown as Json,
  });
  if (!record(data) || typeof data.created !== "boolean" || !record(data.proposal)) throw unconfirmed();
  const proposal = data.proposal;
  // A replay may return a card the person has revised since: its identity is
  // checked, its payload is theirs.
  if (proposal.id !== input.proposalId || proposal.turn_id !== input.id || proposal.company_id !== who.companyId || proposal.actor_id !== who.actorId) {
    throw unconfirmed();
  }
  return { created: data.created, seq: seqOf(data.seq), cards: countOf(data.cards, RUN_LIMITS.cards), proposalId: input.proposalId };
}

export async function finishAgentRun(admin: Db, who: Who, input: {
  id: string; lease: string; seq: number; status: "completed" | "failed"; stopReason: CompletedStopReason | FailedStopReason;
  text: string; refused: number; faults: number;
}) {
  const data = await rpc(admin, "os_agent_run_finish", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_lease: input.lease, p_seq: input.seq,
    p_status: input.status, p_stop_reason: input.stopReason, p_text: input.text, p_refused: input.refused, p_faults: input.faults,
  });
  if (!record(data)) throw unconfirmed();
  return runReceipt(data.run, who, input.id);
}

export async function cancelAgentRun(admin: Db, who: Who, id: string) {
  const data = await rpc(admin, "os_agent_run_cancel", { p_id: id, p_company: who.companyId, p_actor: who.actorId });
  if (!record(data)) throw unconfirmed();
  return runReceipt(data.run, who, id);
}

/** Give a live lease up, so the run reads as stalled at once. Only the
 * holder's own lease moves; anything else answers released false. */
export async function releaseAgentRun(admin: Db, who: Who, input: { id: string; lease: string }) {
  const data = await rpc(admin, "os_agent_run_release", { p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_lease: input.lease });
  if (!record(data) || typeof data.released !== "boolean") throw unconfirmed();
  return { released: data.released };
}

export async function resumeAgentRun(admin: Db, who: Who, input: {
  id: string; seq: number; action: "continue" | "answer" | "skip"; answer: string | null; leaseSeconds: number;
}) {
  const data = await rpc(admin, "os_agent_run_resume", {
    p_id: input.id, p_company: who.companyId, p_actor: who.actorId, p_seq: input.seq, p_action: input.action,
    // SQL null means no answer; the generated Args type cannot say so.
    p_answer: input.answer as string, p_lease_seconds: input.leaseSeconds,
  });
  if (!record(data) || !text(data.lease)) throw unconfirmed();
  return { run: runReceipt(data.run, who, input.id), lease: data.lease };
}

export type AgentRunPrivate = {
  run: AgentRunRow & { lease_id: string | null; checkpoint: unknown };
  turn: { question: string; person_message_id: string; draftFormat: ReviewWorkKind; status: string };
};

/** The driver's own view: the checkpoint and the lease, read with the admin
 * client and never returned to a route response. */
export async function loadAgentRunPrivate(admin: Db, who: Who, id: string, timeoutMs = 10_000): Promise<AgentRunPrivate> {
  const [runResult, turnResult] = await Promise.all([
    admin.from("os_agent_runs").select(`${AGENT_RUN_PUBLIC_COLUMNS}, lease_id, checkpoint`).eq("id", id)
      .eq("company_id", who.companyId).eq("actor_id", who.actorId).abortSignal(AbortSignal.timeout(timeoutMs)).maybeSingle(),
    admin.from("os_review_turns").select("question, person_message_id, request_mode, request_intent, status").eq("id", id)
      .eq("company_id", who.companyId).eq("actor_id", who.actorId).abortSignal(AbortSignal.timeout(timeoutMs)).maybeSingle(),
  ]);
  if (runResult.error || turnResult.error || !runResult.data || !turnResult.data) throw unconfirmed();
  const { lease_id: lease, checkpoint, ...rest } = runResult.data;
  const run = runReceipt(rest, who, id);
  const turn = turnResult.data;
  const intent = turn.request_intent as { draftFormat?: unknown } | null;
  const draftFormat = intent?.draftFormat;
  if (turn.request_mode !== "draft" || !REVIEW_WORK_KINDS.some((kind) => kind === draftFormat) || !text(turn.question) || !text(turn.person_message_id)) throw unconfirmed();
  return { run: { ...run, lease_id: lease, checkpoint }, turn: { question: turn.question, person_message_id: turn.person_message_id, draftFormat: draftFormat as ReviewWorkKind, status: turn.status } };
}

/** After a start or resume whose response was lost: the lease SQL issued, if
 * the run is running on a live lease at exactly the seq that call would have
 * left it at. A driver scheduled on it is as safe as the one that was not:
 * every write it makes is fenced on that lease and sequenced by seq, so were
 * a second driver on the same lease ever to exist, the first write either
 * makes would fence the other. Anything else is null, and the response stays
 * unconfirmed. */
export async function leaseToRecover(admin: Db, who: Who, id: string, expectedSeq: number, serverNow: number, timeoutMs = 10_000): Promise<string | null> {
  const { data, error } = await admin.from("os_agent_runs").select("status, lease_id, lease_until, seq").eq("id", id)
    .eq("company_id", who.companyId).eq("actor_id", who.actorId).abortSignal(AbortSignal.timeout(timeoutMs)).maybeSingle();
  if (error || !data || data.status !== "running" || !text(data.lease_id) || !text(data.lease_until) || data.seq !== expectedSeq) return null;
  return Date.parse(data.lease_until) > serverNow ? data.lease_id : null;
}

/** What the cancel watcher polls: status and lease only. */
export async function readAgentRunLease(admin: Db, id: string, timeoutMs = 10_000) {
  const { data, error } = await admin.from("os_agent_runs").select("status, lease_id").eq("id", id).abortSignal(AbortSignal.timeout(timeoutMs)).maybeSingle();
  if (error) throw unconfirmed();
  return data;
}

/** For a server render: the runs, and the server clock they were judged by
 * (stalled, the last day). A component never reads its own clock, so the
 * clock is read here and handed on with the rows. */
export async function loadAgentRunsNow(db: Db, companyId: string, viewerId: string) {
  const serverNow = Date.now();
  return { runs: await listAgentRuns(db, companyId, viewerId, serverNow), serverNow };
}

/** Runs as a member sees them, through the signed-in client's RLS and column
 * grants: one run, or the company's open runs plus its recent ones. stalled
 * and mine are the server's: its clock, the verified viewer. In the list, a
 * row that does not parse is left out rather than failing the whole read:
 * one unreadable run must not hide every other run of the company. A run
 * asked for by its id is still refused when it does not parse — the caller
 * then says it could not be read, which is true. */
export async function listAgentRuns(db: Db, companyId: string, viewerId: string, serverNow: number, options: { id?: string; recent?: number; sinceDays?: number } = {}): Promise<AgentRunView[]> {
  const select = () => db.from("os_agent_runs").select(AGENT_RUN_PUBLIC_COLUMNS).eq("company_id", companyId);
  const results = options.id
    ? [await select().eq("id", options.id)]
    : await Promise.all([
      select().in("status", ["running", "waiting", "paused"]).order("created_at", { ascending: false }).limit(20),
      select().gte("created_at", new Date(serverNow - (options.sinceDays ?? 7) * 86_400_000).toISOString())
        .order("created_at", { ascending: false }).limit(options.recent ?? 5),
    ]);
  if (results.some((result) => result.error || !Array.isArray(result.data))) throw new Error("agent_runs_unavailable");
  const rows = new Map<string, AgentRunRow>();
  for (const result of results) for (const value of result.data!) {
    const row = parseAgentRunRow(value);
    if (!row && !options.id) continue;
    if (!row || row.company_id !== companyId) throw new Error("agent_runs_unavailable");
    rows.set(row.id, row);
  }
  if (!rows.size) return [];
  const ids = [...rows.keys()];
  const [turns, captures] = await Promise.all([
    db.from("os_review_turns").select("id, question, request_intent").eq("company_id", companyId).in("id", ids),
    db.from("os_agent_run_reads").select("id, run_id, ref, title").eq("company_id", companyId).in("run_id", ids).order("created_at", { ascending: true }).limit(200),
  ]);
  if (turns.error || captures.error || !Array.isArray(turns.data) || !Array.isArray(captures.data)) throw new Error("agent_runs_unavailable");
  return [...rows.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((row): AgentRunView => {
    const turn = turns.data.find((candidate) => candidate.id === row.id);
    if (!turn) throw new Error("agent_runs_unavailable");
    const format = (turn.request_intent as { draftFormat?: unknown } | null)?.draftFormat;
    return {
      ...row, instruction: turn.question,
      draftFormat: REVIEW_WORK_KINDS.some((kind) => kind === format) ? format as ReviewWorkKind : null,
      stalled: isStalled(row, serverNow), mine: row.actor_id === viewerId,
      captures: captures.data.filter((capture) => capture.run_id === row.id).map(({ id, ref, title }) => ({ id, ref, title })),
    };
  });
}
