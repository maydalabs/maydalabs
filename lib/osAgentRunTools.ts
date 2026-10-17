import { parseReviewProposal, type ProposalPayload } from "@/lib/osReviewBoundary";
import { REVIEW_WORK_ACTIONS, type ReviewWorkKind } from "@/lib/osReviewGuard";
import { RUN_LIMITS, type AgentRunPlan, type AgentRunQuestion } from "@/lib/osAgentRunTypes";
import type { RunToolName } from "@/lib/osAgentRunToolDefs";

/* What a run's tools accept and return, with no I/O.
 *
 * The model's input is parsed with exact keys and the same bounds as the
 * schemas in lib/osAgentRunToolDefs.ts; anything else is refused in words the
 * model can correct from, and nothing runs. What comes back is record data:
 * framed as untrusted, with the three characters that could close or forge a
 * frame escaped, and cut to a fixed size. A card's kind, later action, lane
 * and citations are never the model's: runDraftEnvelope builds them from the
 * founder's selection and the capture the run read.
 */

export const OPEN_WORK_STATUSES = ["pending", "triaged", "drafted", "review", "approved", "blocked"] as const;
export const NEEDS_YOU_STATUSES = ["review", "approved", "blocked"] as const;
export const MEMORY_KINDS = ["fact", "preference", "constraint", "person", "decision"] as const;
const REF = /^w[1-9][0-9]?$/;
const DAY_MS = 86_400_000;

export type SearchFilters = { waitingMoreThanDays: number | null; query: string | null; statuses: string[] | null; lane: string | null; limit: number };
export type MemoryFilters = { kind: string | null; query: string | null; limit: number };
export type ProposeInput = { ref: string; title: string; body: string };
export type RunToolInput =
  | { tool: "plan_run"; plan: AgentRunPlan }
  | { tool: "search_record"; filters: SearchFilters }
  | { tool: "read_work_item"; ref: string }
  | { tool: "list_memory"; filters: MemoryFilters }
  | { tool: "ask_founder"; question: AgentRunQuestion }
  | { tool: "propose_draft"; draft: ProposeInput };

type Parsed = { ok: true; value: RunToolInput } | { ok: false; message: string };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function bounded(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

export function invalidInput(tool: string, reason: string) {
  return `Invalid input for ${tool}: ${reason}. Nothing was done.`;
}

/** Exact keys, the schema's bounds, and nothing else. */
export function parseRunToolInput(tool: RunToolName, input: unknown): Parsed {
  const fail = (reason: string): Parsed => ({ ok: false, message: invalidInput(tool, reason) });
  if (!record(input)) return fail("expected an object");
  const allowed: Record<RunToolName, string[]> = {
    plan_run: ["steps", "refs"], search_record: ["waiting_more_than_days", "query", "statuses", "lane", "limit"],
    read_work_item: ["ref"], list_memory: ["kind", "query", "limit"], ask_founder: ["question", "why", "options"],
    propose_draft: ["ref", "title", "body"],
  };
  const unknown = Object.keys(input).filter((key) => !allowed[tool].includes(key));
  if (unknown.length) return fail(`unknown field ${unknown[0].slice(0, 40)}`);
  switch (tool) {
    case "plan_run": {
      const { steps, refs } = input;
      if (!Array.isArray(steps) || steps.length < 1 || steps.length > RUN_LIMITS.planSteps || !steps.every((step) => bounded(step, 160))) {
        return fail("steps must be 1 to 6 short texts of at most 160 characters");
      }
      if (!Array.isArray(refs) || refs.length > RUN_LIMITS.planRefs || !refs.every((ref) => typeof ref === "string" && REF.test(ref)) ||
        new Set(refs).size !== refs.length) return fail("refs must be at most 8 distinct refs such as w1");
      return { ok: true, value: { tool, plan: { steps: steps.map((step) => (step as string).trim()), refs: [...refs] as string[] } } };
    }
    case "search_record": {
      const days = input.waiting_more_than_days;
      if (days !== undefined && !integer(days, 0, 365)) return fail("waiting_more_than_days must be a whole number from 0 to 365");
      if (input.query !== undefined && !bounded(input.query, 120)) return fail("query must be 1 to 120 characters");
      const statuses = input.statuses;
      if (statuses !== undefined && (!Array.isArray(statuses) || statuses.length < 1 || statuses.length > 6 ||
        !statuses.every((status) => (OPEN_WORK_STATUSES as readonly unknown[]).includes(status)) || new Set(statuses).size !== statuses.length)) {
        return fail("statuses must list open statuses: pending, triaged, drafted, review, approved or blocked");
      }
      if (input.lane !== undefined && !bounded(input.lane, 40)) return fail("lane must be 1 to 40 characters");
      if (input.limit !== undefined && !integer(input.limit, 1, RUN_LIMITS.searchResults)) return fail("limit must be from 1 to 10");
      return { ok: true, value: { tool, filters: {
        waitingMoreThanDays: days === undefined ? null : days as number,
        query: input.query === undefined ? null : (input.query as string).trim(),
        statuses: statuses === undefined ? null : [...statuses] as string[],
        lane: input.lane === undefined ? null : (input.lane as string).trim(),
        limit: input.limit === undefined ? RUN_LIMITS.searchResults : input.limit as number,
      } } };
    }
    case "read_work_item": {
      if (typeof input.ref !== "string" || !REF.test(input.ref)) return fail("ref must be a ref such as w1 from search_record");
      return { ok: true, value: { tool, ref: input.ref } };
    }
    case "list_memory": {
      if (input.kind !== undefined && !(MEMORY_KINDS as readonly unknown[]).includes(input.kind)) return fail("kind must be fact, preference, constraint, person or decision");
      if (input.query !== undefined && !bounded(input.query, 80)) return fail("query must be 1 to 80 characters");
      if (input.limit !== undefined && !integer(input.limit, 1, RUN_LIMITS.memoryResults)) return fail("limit must be from 1 to 30");
      return { ok: true, value: { tool, filters: {
        kind: input.kind === undefined ? null : input.kind as string,
        query: input.query === undefined ? null : (input.query as string).trim(),
        limit: input.limit === undefined ? RUN_LIMITS.memoryResults : input.limit as number,
      } } };
    }
    case "ask_founder": {
      if (!bounded(input.question, RUN_LIMITS.question)) return fail("question must be 1 to 300 characters");
      if (input.why !== undefined && !bounded(input.why, 300)) return fail("why must be 1 to 300 characters");
      const options = input.options;
      if (options !== undefined && (!Array.isArray(options) || options.length > 3 || !options.every((option) => bounded(option, 80)))) {
        return fail("options must be at most 3 texts of at most 80 characters");
      }
      return { ok: true, value: { tool, question: {
        text: (input.question as string).trim(), why: input.why === undefined ? null : (input.why as string).trim(),
        options: options === undefined ? [] : (options as string[]).map((option) => option.trim()),
      } } };
    }
    case "propose_draft": {
      if (typeof input.ref !== "string" || !REF.test(input.ref)) return fail("ref must be a ref such as w1");
      if (!bounded(input.title, 200)) return fail("title must be 1 to 200 characters");
      if (!bounded(input.body, 8000)) return fail("body must be the complete draft, 1 to 8000 characters");
      // The body is kept byte for byte: it is the artifact the person reviews.
      return { ok: true, value: { tool, draft: { ref: input.ref, title: (input.title as string).trim(), body: input.body as string } } };
    }
  }
}

/** Whole days since a timestamp, rounded exactly like os_needs_you's
 * (extract(epoch)/86400)::integer: half a day and more rounds up. */
export function waitingDays(updatedAt: string, now: number): number {
  const at = Date.parse(updatedAt);
  if (!Number.isFinite(at)) return 0;
  return Math.max(0, Math.round((now - at) / DAY_MS));
}

/* Refs are the run's short names for records: w1, w2 ... w99, assigned in the
 * order search_record first returned each item and kept for the whole run, so
 * a model that copies a ref from an earlier result still names the same
 * record. They live in the checkpoint and survive a JSON round-trip. */
export function assignRefs(refs: Readonly<Record<string, string>>, itemIds: readonly string[]) {
  const next: Record<string, string> = { ...refs };
  const byItem = new Map(Object.entries(next).map(([ref, item]) => [item, ref]));
  let highest = Math.max(0, ...Object.keys(next).map((ref) => Number(ref.slice(1))));
  for (const item of itemIds) {
    if (byItem.has(item) || highest >= 99) continue;
    highest += 1;
    next[`w${highest}`] = item;
    byItem.set(item, `w${highest}`);
  }
  return { refs: next, refFor: (item: string) => byItem.get(item) ?? null };
}

export function resolveRef(refs: Readonly<Record<string, string>>, ref: string): string | null {
  return Object.hasOwn(refs, ref) ? refs[ref] : null;
}

function escapeRecord(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
function clip(value: string | null | undefined, limit: number): string {
  const text = value ?? "";
  return text.length > limit ? `${text.slice(0, limit)} [truncated]` : text;
}

/* Record data, framed. Stored text is data even when it claims to be an
 * instruction, from the founder, the system or a tool; the frame says so, and
 * escaping keeps a stored "</record_data>" from closing it. When the JSON is
 * too long the caller's shrink step removes content and sets truncated, so
 * the model always receives valid JSON rather than a cut string. */
export function recordData(tool: RunToolName, value: Record<string, unknown>, shrink?: (value: Record<string, unknown>) => Record<string, unknown> | null): string {
  let current: Record<string, unknown> | null = value;
  for (;;) {
    const body = escapeRecord(JSON.stringify(current));
    const framed = `<record_data tool="${tool}" untrusted="true">${body}</record_data>`;
    if (framed.length <= RUN_LIMITS.readResultChars) return framed;
    current = shrink ? shrink({ ...current, truncated: true }) : null;
    if (!current) return `<record_data tool="${tool}" untrusted="true">${escapeRecord(JSON.stringify({ truncated: true, note: "The result was too large to show." }))}</record_data>`;
  }
}

export type WorkRow = {
  id: string; title: string; lane: string; kind: string; status: string; required_action: string | null;
  due_on: string | null; notes: string | null; updated_at: string;
};

/** Filter the scanned open items as the tool promises, longest-waiting first. */
export function filterSearch(rows: readonly WorkRow[], filters: SearchFilters, now: number) {
  const query = filters.query?.toLowerCase() ?? null;
  const lane = filters.lane?.toLowerCase() ?? null;
  return rows.filter((row) => (OPEN_WORK_STATUSES as readonly string[]).includes(row.status))
    .filter((row) => filters.waitingMoreThanDays === null || waitingDays(row.updated_at, now) > filters.waitingMoreThanDays)
    .filter((row) => !filters.statuses || filters.statuses.includes(row.status))
    .filter((row) => lane === null || row.lane.toLowerCase() === lane)
    .filter((row) => query === null || row.title.toLowerCase().includes(query) || (row.notes ?? "").toLowerCase().includes(query))
    .sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at));
}

export function formatSearchResult(input: {
  matched: readonly WorkRow[]; limit: number; openTotal: number | null; scanned: number; now: number;
  refFor: (item: string) => string | null; openCards: ReadonlySet<string>;
}) {
  const shown = input.matched.filter((row) => input.refFor(row.id)).slice(0, input.limit);
  const complete = input.openTotal !== null && input.openTotal <= input.scanned && shown.length === input.matched.length;
  const value = {
    matched: input.matched.length, returned: shown.length, open_total: input.openTotal, complete,
    items: shown.map((row) => ({
      ref: input.refFor(row.id), title: clip(row.title, 200), status: row.status,
      needs_you: (NEEDS_YOU_STATUSES as readonly string[]).includes(row.status), required_action: row.required_action,
      lane: row.lane, kind: row.kind, due_on: row.due_on, waiting_days: waitingDays(row.updated_at, input.now),
      excerpt: clip(row.notes, 240), open_card: input.openCards.has(row.id),
    })),
  };
  return recordData("search_record", value, (current) => {
    const items = current.items as unknown[];
    return items.length ? { ...current, items: items.slice(0, -1), returned: items.length - 1, complete: false } : null;
  });
}

export type RunCaptureRecord = {
  id: string; item_id: string; ref: string; title: string; lane: string; kind: string; status: string;
  required_action: string | null; due_on: string | null; waiting_days: number; item_updated_at: string;
  source_text: string; created_at: string;
};
export type RunEvent = { event: string; at: string; actor: string | null };

export function formatReadResult(input: { capture: RunCaptureRecord; events: readonly RunEvent[] | null; openCard: boolean; now: number }) {
  const { capture } = input;
  const notes = capture.source_text.startsWith(capture.title) ? capture.source_text.slice(capture.title.length).replace(/^\n\n/, "") : capture.source_text;
  const value = {
    ref: capture.ref, title: capture.title, status: capture.status,
    needs_you: (NEEDS_YOU_STATUSES as readonly string[]).includes(capture.status), required_action: capture.required_action,
    lane: capture.lane, kind: capture.kind, due_on: capture.due_on, waiting_days: capture.waiting_days,
    captured_at: capture.created_at, notes: clip(notes, 3000),
    ...(input.events === null ? { events_available: false } : {}),
    events: (input.events ?? []).slice(0, 5).map((event) => ({ event: clip(event.event, 60), days_ago: waitingDays(event.at, input.now), by: event.actor ? "person" : "system" })),
    open_card: input.openCard,
  };
  return recordData("read_work_item", value, (current) => {
    const text = String(current.notes ?? "");
    if (text.length > 200) return { ...current, notes: `${text.slice(0, Math.floor(text.length / 2))} [truncated]` };
    const events = current.events as unknown[];
    return events.length ? { ...current, events: events.slice(0, -1) } : null;
  });
}

export type RunMemoryRow = { kind: string; fact: string; source: string; reviewed: boolean; scope: string | null };

export function formatMemoryResult(rows: readonly RunMemoryRow[], filters: MemoryFilters, complete: boolean) {
  const query = filters.query?.toLowerCase() ?? null;
  const matched = rows.filter((row) => (filters.kind === null || row.kind === filters.kind) && (query === null || row.fact.toLowerCase().includes(query)));
  const shown = matched.slice(0, filters.limit);
  const value = {
    returned: shown.length, complete: complete && shown.length === matched.length,
    items: shown.map((row) => ({ kind: row.kind, fact: clip(row.fact, 300), source: row.source === "person" ? "person" : "cofounder", reviewed: row.reviewed, scope: row.scope })),
  };
  return { text: recordData("list_memory", value, (current) => {
    const items = current.items as unknown[];
    return items.length ? { ...current, items: items.slice(0, -1), returned: items.length - 1, complete: false } : null;
  }), returned: shown.length };
}

/** The card, built by the host. The model wrote only the title and body. */
export function runDraftEnvelope(input: {
  draftFormat: ReviewWorkKind; source: { id: string; text: string };
  capture: { id: string; title: string; lane: string }; title: string; body: string;
}): ProposalPayload | null {
  return parseReviewProposal({
    type: "work", title: input.title, body: input.body, lane: input.capture.lane, kind: input.draftFormat,
    outwardAction: REVIEW_WORK_ACTIONS[input.draftFormat],
    citations: [
      { sourceId: input.source.id, quote: input.source.text },
      { sourceId: `read:${input.capture.id}`, quote: input.capture.title },
    ],
  });
}

/* What the model is told when a call does not run. Each says that nothing
 * happened, and what to do instead, so a correction is possible. */
export const RUN_REFUSAL_MESSAGES = {
  unavailable: "This action is unavailable. A run can only read records and prepare draft cards for review; it cannot save, approve, send or publish.",
  not_offered: "This tool is not available at this step.",
  plan_first: "Call plan_run before preparing cards. Nothing was staged.",
  plan_once: "The plan is already recorded; plans are set once. Mention anything else in your summary.",
  plan_refs: "Plan only refs that search_record returned in this run. Nothing was recorded.",
  not_planned: "This ref is not in your plan. Plans are set once; draft only for planned refs and mention anything else in your summary.",
  read_first: "Read this record with read_work_item, and see the result, before drafting about it.",
  already_carded: "A card about this record is already prepared in this run. Do not repeat it.",
  card_limit: "This run has prepared its eight cards. Nothing was staged; mention the rest in your summary.",
  uncertain: "A card could not be confirmed, so no further cards may be prepared in this run. Nothing was staged. Say so in your summary.",
  unknown_ref: "Use a ref returned by search_record in this run.",
  search_limit: "This run has used its four searches. Work with the refs you have.",
  memory_limit: "This run has already listed company knowledge twice.",
  read_limit: "This run has read its twelve records. Work with what you have read.",
  item_unavailable: "That record is not available to this run. Nothing was read.",
  ask_alone: "Ask alone, in a reply with no other tool calls. Nothing was asked.",
  already_asked: "You have already asked once in this run. Decide without it, or say what is missing in your summary.",
  open_card: "An earlier run's card about this record is still waiting for the founder's decision. Skip it and mention it in your summary.",
  item_carded: "A card about this record is already prepared in this run. Do not repeat it.",
  citations: "The card did not match the record as read. Nothing was staged; read the record again before drafting.",
  lane: "This record's lane is too long to carry on a review card, so no card can be prepared for it. Nothing was staged; mention the record in your summary.",
  read_required: "Read this record with read_work_item before drafting about it. Nothing was staged.",
  read_failed: "The records could not be read just now; nothing was changed. Continue with what you have.",
  duplicate_check: "The duplicate check could not run, so nothing was staged. Mention this record in your summary.",
  summary: "No tool runs in this final step. Nothing was done; reply with your summary.",
} as const;

export const RUN_NOTES = {
  cutOff: "Your previous reply was cut off; nothing from it was used. Prepare at most two drafts per reply.",
  fault: "Your previous reply asked for too much at once or repeated an action id; none of it was done.",
  summary: "Stop calling tools and reply now with your summary.",
  skip: "The founder chose not to answer. Do not guess; skip anything that depends on it and say so in your summary.",
} as const;

export function cardReadyText(ref: string) {
  return `Draft card about ${ref} is ready for the founder's review; it is not saved to Work, approved or sent. Do not repeat it.`;
}
export function planRecordedText(plan: AgentRunPlan) {
  return plan.refs.length
    ? `Plan recorded. Prepare cards only for these refs, after reading each: ${plan.refs.join(", ")}.`
    : "Plan recorded with no refs: there is nothing to prepare a card for. Say so in your summary.";
}
export function founderAnswerText(answer: string) {
  return `<founder_answer>${escapeRecord(answer)}</founder_answer> The founder answered your question. Use it for this run only; it is not company knowledge and not a record you can cite.`;
}
