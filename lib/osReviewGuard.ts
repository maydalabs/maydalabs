import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { findReviewDateIssues } from "@/lib/osReviewDate";

/** Policy for NEW proposals; deliberately separate from the historical DTO
 * reader. Coherent metadata and calendar dates do not prove semantic intent,
 * factual grounding, or the founder's endorsement of quoted material. */
export const REVIEW_WORK_KINDS = ["email", "reply", "post", "note", "research", "decision"] as const;
export type ReviewWorkKind = (typeof REVIEW_WORK_KINDS)[number];
export const REVIEW_WORK_ACTIONS: Record<ReviewWorkKind, "send" | "publish" | null> = {
  email: "send", reply: "send", post: "publish", note: null, research: null, decision: null,
};
export const REVIEW_GUARD_REASONS = ["work_kind", "work_action", "calendar_date", "duplicate_work", "intent_required", "draft_format", "knowledge_assertion", "knowledge_approval"] as const;
export type ReviewGuardReason = (typeof REVIEW_GUARD_REASONS)[number];
export type ReviewProposalRefusal = { rejected: "current_message_citation" | ReviewGuardReason };
export function isReviewGuardReason(value: unknown): value is ReviewGuardReason {
  return REVIEW_GUARD_REASONS.some((reason) => reason === value);
}
export const REVIEW_REFUSAL_MESSAGES: Record<ReviewProposalRefusal["rejected"], string> = {
  current_message_citation: "The proposal's citation did not match its permitted source: the current message for Work, or the separate founder assertion for knowledge. It was not staged; no database staging was attempted for that proposal.",
  intent_required: "This earlier request has no explicit format or knowledge assertion. Start a new request with your choices. No new suggestion was staged or saved.",
  draft_format: "This draft attempt does not match the founder's selected format. Use that format, or ask them to start a new request if their message conflicts with the selection. Do not simply relabel a different artifact.",
  knowledge_assertion: "No matching founder assertion was supplied. Only the exact separate company statement may be proposed as knowledge. Chat text and quotations are not approval. Discuss uncertainty instead; do not rewrite or expand the assertion.",
  knowledge_approval: "Adding company knowledge requires the person's explicit confirmation of this exact reviewed revision. Nothing was saved by this attempt.",
  work_kind: "This draft attempt was not staged. Choose a supported kind: email, reply, post, note, research, or decision. Do not relabel the artifact to bypass its intended action.",
  work_action: "This draft attempt was not staged because its type and later action disagree. Email/reply require send; post requires publish; note/research/decision require null. Saving never performs that later action. Do not relabel the artifact to bypass this check.",
  calendar_date: "This suggestion attempt was not staged because it contains an invalid date or a weekday that disagrees with its date. Check the supplied calendar details; ask the founder if they conflict. Do not silently change a supplied date.",
  duplicate_work: "An open Work item already contains this exact draft body. No duplicate was staged or saved, and the existing item was not approved, sent, or changed. Do not reword it merely to create a replacement. You can still prepare a separately requested new artifact.",
};

export function reviewProposalGuard(payload: ProposalPayload): ReviewGuardReason | null {
  if (payload.type === "work") {
    if (!REVIEW_WORK_KINDS.some((kind) => kind === payload.kind)) return "work_kind";
    if (REVIEW_WORK_ACTIONS[payload.kind as ReviewWorkKind] !== payload.outwardAction) return "work_action";
    if (findReviewDateIssues(payload.title).length || findReviewDateIssues(payload.body).length) return "calendar_date";
  } else if (findReviewDateIssues(payload.statement).length) return "calendar_date";
  return null;
}

/** Only use for a locally refused operation or an exact database refusal
 * whose statement rolled back. Transport/receipt errors stay uncertain. */
export class ConfirmedReviewRejection extends Error {
  constructor(public readonly reason: ReviewGuardReason) { super(reason); this.name = "ConfirmedReviewRejection"; }
}
