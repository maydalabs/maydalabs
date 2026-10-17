/* The six tools a run may call, as the model sees them.
 *
 * Deliberately free of imports. lib/osCofounder.ts spreads these definitions
 * into cofounderTools() so the three model adapters can resolve them without
 * learning anything new, and a module with no imports cannot form a cycle
 * with it. Keeping the wording here also means a later change to a tool's
 * description does not touch osCofounder.ts, which the scenario manifest
 * hashes.
 *
 * Four of the six only read. plan_run records the model's own words for the
 * person to see; ask_founder pauses the run for an answer; propose_draft
 * stages one review card. None of them saves Work or company knowledge,
 * approves, sends or publishes, and the host refuses anything else by name.
 * Every schema is closed (additionalProperties: false); the host parsers in
 * lib/osAgentRunTools.ts apply the same keys and bounds again, because a
 * schema is a request to the model, not a guarantee.
 */

export const RUN_TOOL_NAMES = ["plan_run", "search_record", "read_work_item", "list_memory", "ask_founder", "propose_draft"] as const;
export type RunToolName = (typeof RUN_TOOL_NAMES)[number];

export function isRunToolName(value: unknown): value is RunToolName {
  return typeof value === "string" && (RUN_TOOL_NAMES as readonly string[]).includes(value);
}

export const RUN_REF_PATTERN = "^w[1-9][0-9]?$";
const REF = { type: "string", pattern: RUN_REF_PATTERN };

export const PLAN_RUN_TOOL = {
  name: "plan_run",
  description: "Record your plan once, before preparing any card: up to six short steps and the refs from search_record you will prepare cards for (at most 8). Shown to the founder as your own words. Reads, saves and sends nothing.",
  input_schema: { type: "object" as const, additionalProperties: false, properties: {
    steps: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", minLength: 1, maxLength: 160 } },
    refs: { type: "array", minItems: 0, maxItems: 8, items: REF },
  }, required: ["steps", "refs"] },
};

export const SEARCH_RECORD_TOOL = {
  name: "search_record",
  description: "Search the company's OPEN Work (not completed or canceled). Returns at most 10 items, longest-waiting first, each with a ref (w1, w2, ...) for read_work_item and plan_run. waiting_days = whole days since the item last changed. Read-only.",
  input_schema: { type: "object" as const, additionalProperties: false, properties: {
    waiting_more_than_days: { type: "integer", minimum: 0, maximum: 365 },
    query: { type: "string", minLength: 1, maxLength: 120, description: "case-insensitive text in title or notes" },
    statuses: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", enum: ["pending", "triaged", "drafted", "review", "approved", "blocked"] } },
    lane: { type: "string", minLength: 1, maxLength: 40 },
    limit: { type: "integer", minimum: 1, maximum: 10 },
  }, required: [] },
};

export const READ_WORK_ITEM_TOOL = {
  name: "read_work_item",
  description: "Read one Work item in full by its ref from search_record: status, required action, due date, notes and its last five events. Read every item before drafting about it. Read-only; reading the same ref again returns the same capture.",
  input_schema: { type: "object" as const, additionalProperties: false, properties: { ref: REF }, required: ["ref"] },
};

export const LIST_MEMORY_TOOL = {
  name: "list_memory",
  description: "List current company knowledge: facts, preferences, constraints, people, decisions. Read-only.",
  input_schema: { type: "object" as const, additionalProperties: false, properties: {
    kind: { type: "string", enum: ["fact", "preference", "constraint", "person", "decision"] },
    query: { type: "string", minLength: 1, maxLength: 80 },
    limit: { type: "integer", minimum: 1, maximum: 30 },
  }, required: [] },
};

export const ASK_FOUNDER_TOOL = {
  name: "ask_founder",
  description: "Ask the founder one short question when something essential is ambiguous and the records cannot settle it. Call it alone in its reply; the run waits for the answer. At most once per run.",
  input_schema: { type: "object" as const, additionalProperties: false, properties: {
    question: { type: "string", minLength: 1, maxLength: 300 },
    why: { type: "string", minLength: 1, maxLength: 300 },
    options: { type: "array", minItems: 0, maxItems: 3, items: { type: "string", minLength: 1, maxLength: 80 } },
  }, required: ["question"] },
};

export const PROPOSE_DRAFT_TOOL = {
  name: "propose_draft",
  description: "Prepare ONE draft card about one record you read in an earlier reply of this run, in the founder's selected format. Supply the ref, a title and the complete ready-to-edit body. The app attaches the format, its later human action, the record's lane and both sources (the founder's request and the record as you read it). Does NOT save to Work, approve, send or publish. One card per ref.",
  input_schema: { type: "object" as const, additionalProperties: false, properties: {
    ref: REF,
    title: { type: "string", minLength: 1, maxLength: 200 },
    body: { type: "string", minLength: 1, maxLength: 8000 },
  }, required: ["ref", "title", "body"] },
};

export const RUN_TOOL_DEFINITIONS = [PLAN_RUN_TOOL, SEARCH_RECORD_TOOL, READ_WORK_ITEM_TOOL, LIST_MEMORY_TOOL, ASK_FOUNDER_TOOL, PROPOSE_DRAFT_TOOL];
