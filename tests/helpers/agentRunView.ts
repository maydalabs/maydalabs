import { AGENT_RUN_PUBLIC_COLUMNS, PROGRESS_KINDS, type AgentRunProgress, type AgentRunRow, type AgentRunView } from "@/lib/osAgentRunTypes";

/* One agent run as the browser receives it (GET /api/os/runs), for component
 * tests. Synthetic throughout, and free of second-person words: the
 * non-starter tests assert that no "you" reaches the screen, so the fixture
 * must not bring one in through the instruction, a plan step or a title. */

export const RUN_ID = "00000000-0000-4000-8000-0000000000e1";
export const RUN_ACTOR = "00000000-0000-4000-8000-0000000000a1";
export const RUN_COMPANY = "00000000-0000-4000-8000-0000000000c1";
export const RUN_CAPTURE = "00000000-0000-4000-8000-0000000000d1";
const at = "2026-10-17T10:00:00.000Z";

export function runView(patch: Partial<AgentRunView> = {}): AgentRunView {
  return {
    id: RUN_ID, company_id: RUN_COMPANY, actor_id: RUN_ACTOR, status: "running", stop_reason: null,
    payer: "platform", priced: true, model_label: "synthetic-model", ceiling_usd: 1, seq: 7, slices: 1,
    lease_until: "2026-10-17T10:05:00.000Z", rounds: 3, item_reads: 2, cards: 1, asked: false,
    input_tokens: 1000, output_tokens: 200, cost_usd: 0.12,
    plan: { steps: ["Find the open items", "Draft a follow-up for each"], refs: ["w1", "w2"] },
    question: null, answer: null, answered_at: null,
    progress: [
      { k: "search", n: 2, at }, { k: "plan", n: 2, at },
      { k: "read", n: 9, label: "Invoice 42 for Acme", at }, { k: "card", label: "Follow up on invoice 42", at },
    ],
    created_at: at, updated_at: at, finished_at: null,
    instruction: "Prepare follow-ups for everything waiting more than a week.", draftFormat: "reply", stalled: false, mine: true,
    captures: [{ id: RUN_CAPTURE, ref: "w1", title: "Invoice 42 for Acme" }],
    ...patch,
  };
}

/** The same run as an RPC receipt carries it: the public columns only. */
export function runRow(patch: Partial<AgentRunView> = {}): AgentRunRow {
  const view = runView(patch);
  return Object.fromEntries(AGENT_RUN_PUBLIC_COLUMNS.split(", ").map((column) => [column, view[column as keyof AgentRunView]])) as AgentRunRow;
}

/** Every progress kind SQL and the driver can write, once each. */
export function everyProgress(): AgentRunProgress[] {
  return PROGRESS_KINDS.map((k) => ({ k, at, ...(k === "read" || k === "card" ? { label: "Invoice 42 for Acme" } : {}), ...(k === "card" ? {} : { n: 2 }) }));
}

export const RUN_QUESTION = { text: "Which contact at Acme should the follow-up address?", why: "The record names two contacts.", options: ["Dana", "Jordan"] };
