import type { ReviewWorkKind } from "@/lib/osReviewGuard";
import { REVIEW_WORK_KINDS } from "@/lib/osReviewGuard";

/* Agent runs, as the browser may see them. Browser-safe: no server import.
 *
 * A run is one reviewed draft turn that works through several model rounds:
 * plan, read the company's records, prepare review cards, stop. The limits
 * below are the product's; supabase/migrations/20261017200000_agent_runs.sql
 * enforces the same numbers (tests/osAgentRunMigration.test.ts reads both).
 * The run row's checkpoint and lease token never reach a client: the column
 * grants keep them from a signed-in read, and parseAgentRunRow refuses a
 * receipt that carries either, so a server mistake fails loudly instead of
 * leaking the conversation the model saw.
 */

export const RUN_LIMITS = {
  rounds: 12, slices: 12, searches: 4, itemReads: 12, memoryReads: 2, cards: 8, questions: 1,
  callsPerReply: 8, faults: 2, cutOffs: 2, providerFailures: 2,
  searchResults: 10, searchScan: 200, memoryResults: 30, memoryScan: 80, openCardScan: 200,
  planSteps: 6, planRefs: 8, instruction: 2000, answer: 1000, question: 300,
  modelTextPerReply: 32_000, summaryChars: 4000, readResultChars: 6000, progress: 150,
} as const;

export const AGENT_RUN_STATUSES = ["running", "waiting", "paused", "completed", "failed", "canceled"] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];
export const OPEN_RUN_STATUSES = ["running", "waiting", "paused"] as const;

/* Three spending limits can stop a run, and each is named: its own ceiling
 * (budget), this month's conversation budget (month_budget) and today's cap
 * (daily_cap). A run stopped by today's cap is not said to have reached its
 * own limit beside a spend line that shows that limit untouched. */
export const STOP_REASONS = ["done", "card_limit", "step_limit", "budget", "month_budget", "daily_cap", "uncertain", "provider", "invalid_replies", "storage", "canceled"] as const;
export type StopReason = (typeof STOP_REASONS)[number];
export const COMPLETED_STOP_REASONS = ["done", "card_limit", "step_limit", "budget", "month_budget", "daily_cap", "uncertain"] as const;
export const BUDGET_STOP_REASONS = ["budget", "month_budget", "daily_cap"] as const;
export type BudgetStopReason = (typeof BUDGET_STOP_REASONS)[number];
export const FAILED_STOP_REASONS = ["provider", "invalid_replies", "storage"] as const;
export type CompletedStopReason = (typeof COMPLETED_STOP_REASONS)[number];
export type FailedStopReason = (typeof FAILED_STOP_REASONS)[number];

/* The closed progress vocabulary. The driver may write only the first eight;
 * SQL writes the rest itself (read, card, answered, skipped, resumed,
 * finished, failed, stopped). A person sees each through its copy key, never
 * as model text: a label is a record or card title, shown as plain text. */
export const DRIVER_PROGRESS_KINDS = ["plan", "search", "memory", "refused", "asked", "paused", "cut_off", "fault"] as const;
export const PROGRESS_KINDS = [...DRIVER_PROGRESS_KINDS, "read", "card", "answered", "skipped", "resumed", "finished", "failed", "stopped"] as const;
export type ProgressKind = (typeof PROGRESS_KINDS)[number];
export type DriverProgressKind = (typeof DRIVER_PROGRESS_KINDS)[number];
export type AgentRunProgress = { k: ProgressKind; n?: number; label?: string; at: string };
export type DriverProgress = { k: DriverProgressKind; n?: number; label?: string };

export const RUN_PAYERS = ["company", "platform", "local"] as const;
export type RunPayer = (typeof RUN_PAYERS)[number];

export type AgentRunPlan = { steps: string[]; refs: string[] };
export type AgentRunQuestion = { text: string; why: string | null; options: string[] };

/** The public columns: what a member may read about any run of their company. */
export type AgentRunRow = {
  id: string; company_id: string; actor_id: string; status: AgentRunStatus; stop_reason: StopReason | null;
  payer: RunPayer; priced: boolean; model_label: string; ceiling_usd: number;
  seq: number; slices: number; lease_until: string | null;
  rounds: number; item_reads: number; cards: number; asked: boolean;
  input_tokens: number; output_tokens: number; cost_usd: number;
  plan: AgentRunPlan | null; question: AgentRunQuestion | null; answer: string | null; answered_at: string | null;
  progress: AgentRunProgress[];
  created_at: string; updated_at: string; finished_at: string | null;
};
export const AGENT_RUN_PUBLIC_COLUMNS = "id, company_id, actor_id, status, stop_reason, payer, priced, model_label, ceiling_usd, seq, slices, lease_until, rounds, item_reads, cards, asked, input_tokens, output_tokens, cost_usd, plan, question, answer, answered_at, progress, created_at, updated_at, finished_at";

export type AgentRunCaptureView = { id: string; ref: string; title: string };
/** A run as a page shows it. stalled and mine are computed by the server, from its clock and the verified claims. */
export type AgentRunView = AgentRunRow & {
  instruction: string; draftFormat: ReviewWorkKind | null; stalled: boolean; mine: boolean; captures: AgentRunCaptureView[];
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
/* Text SQL bounded is measured as SQL measures it: char_length counts code
 * points, String.length counts UTF-16 units, and a title of 199 letters and
 * one emoji is 200 to Postgres and 201 here. A bound that mirrors SQL in the
 * other unit refuses rows SQL accepted — and one refused row used to hide
 * every run of the company. Writers stay stricter (the tool parsers count
 * UTF-16 units), so what this module writes always fits what it reads. */
export function codePoints(value: string): number {
  return [...value].length;
}
function within(value: unknown, max: number): value is string { return typeof value === "string" && codePoints(value) <= max; }
function count(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function money(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function stamp(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function nullableStamp(value: unknown): value is string | null { return value === null || stamp(value); }
function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export function parseAgentRunPlan(value: unknown): AgentRunPlan | null {
  if (!record(value) || Object.keys(value).length !== 2 || !Array.isArray(value.steps) || !Array.isArray(value.refs)) return null;
  if (!value.steps.length || value.steps.length > RUN_LIMITS.planSteps || !value.steps.every((step) => within(step, 160) && step.trim())) return null;
  if (value.refs.length > RUN_LIMITS.planRefs || !value.refs.every((ref) => typeof ref === "string" && /^w[1-9][0-9]?$/.test(ref))) return null;
  return { steps: [...value.steps] as string[], refs: [...value.refs] as string[] };
}

export function parseAgentRunQuestion(value: unknown): AgentRunQuestion | null {
  if (!record(value) || Object.keys(value).length !== 3 || !within(value.text, RUN_LIMITS.question) || !value.text.trim()) return null;
  if (!(value.why === null || (within(value.why, 300) && value.why.trim()))) return null;
  if (!Array.isArray(value.options) || value.options.length > 3 || !value.options.every((option) => within(option, 80) && option.trim())) return null;
  return { text: value.text, why: value.why as string | null, options: [...value.options] as string[] };
}

function progressEntry(value: unknown): AgentRunProgress | null {
  if (!record(value) || !includes(PROGRESS_KINDS, value.k) || !stamp(value.at)) return null;
  if (Object.keys(value).some((key) => !["k", "n", "label", "at"].includes(key))) return null;
  if (value.n !== undefined && !(typeof value.n === "number" && Number.isFinite(value.n) && value.n >= 0)) return null;
  // A read label is the work item's title, copied by SQL: up to 200 code points.
  if (value.label !== undefined && !within(value.label, 200)) return null;
  return { k: value.k, at: value.at, ...(value.n !== undefined ? { n: value.n as number } : {}), ...(value.label !== undefined ? { label: value.label as string } : {}) };
}

/** Narrow a run row from a select or an RPC receipt. A row carrying the
 * checkpoint or the lease token is refused: it must never reach a client. */
export function parseAgentRunRow(value: unknown): AgentRunRow | null {
  if (!record(value) || Object.hasOwn(value, "checkpoint") || Object.hasOwn(value, "lease_id")) return null;
  const ceiling = money(value.ceiling_usd);
  const cost = money(value.cost_usd);
  if (!text(value.id) || !text(value.company_id) || !text(value.actor_id) || !includes(AGENT_RUN_STATUSES, value.status) ||
    !(value.stop_reason === null || includes(STOP_REASONS, value.stop_reason)) || !includes(RUN_PAYERS, value.payer) ||
    typeof value.priced !== "boolean" || !text(value.model_label) || ceiling === null || cost === null ||
    !count(value.seq) || !count(value.slices) || !nullableStamp(value.lease_until) || !count(value.rounds) || !count(value.item_reads) ||
    !count(value.cards) || typeof value.asked !== "boolean" || !count(value.input_tokens) || !count(value.output_tokens) ||
    !(value.answer === null || typeof value.answer === "string") || !nullableStamp(value.answered_at) ||
    !Array.isArray(value.progress) || !stamp(value.created_at) || !stamp(value.updated_at) || !nullableStamp(value.finished_at)) return null;
  const plan = value.plan === null ? null : parseAgentRunPlan(value.plan);
  const question = value.question === null ? null : parseAgentRunQuestion(value.question);
  const progress = value.progress.map(progressEntry);
  if ((value.plan !== null && !plan) || (value.question !== null && !question) || progress.some((entry) => entry === null)) return null;
  return {
    id: value.id, company_id: value.company_id, actor_id: value.actor_id, status: value.status, stop_reason: value.stop_reason as StopReason | null,
    payer: value.payer, priced: value.priced, model_label: value.model_label, ceiling_usd: ceiling,
    seq: value.seq, slices: value.slices, lease_until: value.lease_until,
    rounds: value.rounds, item_reads: value.item_reads, cards: value.cards, asked: value.asked,
    input_tokens: value.input_tokens, output_tokens: value.output_tokens, cost_usd: cost,
    plan, question, answer: value.answer as string | null, answered_at: value.answered_at,
    progress: progress as AgentRunProgress[], created_at: value.created_at, updated_at: value.updated_at, finished_at: value.finished_at,
  };
}

export function parseAgentRunView(value: unknown): AgentRunView | null {
  if (!record(value)) return null;
  const { instruction, draftFormat, stalled, mine, captures, ...rest } = value;
  const row = parseAgentRunRow(rest);
  if (!row || typeof instruction !== "string" || !(draftFormat === null || includes(REVIEW_WORK_KINDS, draftFormat)) ||
    typeof stalled !== "boolean" || typeof mine !== "boolean" || !Array.isArray(captures) ||
    !captures.every((capture) => record(capture) && text(capture.id) && text(capture.ref) && typeof capture.title === "string")) return null;
  return { ...row, instruction, draftFormat: draftFormat as ReviewWorkKind | null, stalled, mine,
    captures: (captures as AgentRunCaptureView[]).map(({ id, ref, title }) => ({ id, ref, title })) };
}

export function isOpenRun(status: AgentRunStatus): boolean {
  return (OPEN_RUN_STATUSES as readonly string[]).includes(status);
}

/** Running, with a lease the server clock says has expired: the function that
 * held it died. Computed on the server only; a page never reads its own clock. */
export function isStalled(run: Pick<AgentRunRow, "status" | "lease_until">, serverNow: number): boolean {
  return run.status === "running" && run.lease_until !== null && Date.parse(run.lease_until) < serverNow;
}

/* Every agent_run_* refusal SQL can raise, plus two the store adds: 'refused'
 * for any other statement the database rolled back (22/23/42/P0 classes), and
 * 'unavailable' for a refused identity (42501). A transport error is none of
 * these: it is unconfirmed and stays an ordinary Error. */
export const AGENT_RUN_REFUSALS = [
  "fenced", "stale", "active", "budget", "request", "read_limit", "item_unavailable", "read_required", "citations",
  "item_carded", "card_limit", "open_card", "plan_once", "already_asked", "slice_limit", "not_resumable", "cancel_instead",
  "refused", "unavailable",
] as const;
export type AgentRunRefusalCode = (typeof AGENT_RUN_REFUSALS)[number];
export function isAgentRunRefusalCode(value: unknown): value is AgentRunRefusalCode {
  return includes(AGENT_RUN_REFUSALS, value);
}

/** A refusal whose statement provably rolled back. Only the store raises it. */
export class AgentRunRefusal extends Error {
  constructor(public readonly code: AgentRunRefusalCode) { super(`agent_run_${code}`); this.name = "AgentRunRefusal"; }
}
