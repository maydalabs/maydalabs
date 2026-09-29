import type { ProposalPayload } from "@/lib/osReviewBoundary";

/** A known, pre-storage refusal. Never use this result for an RPC failure:
 * after an attempted write, a lost response cannot prove that nothing staged. */
export type CurrentMessageCitationRefusal = { rejected: "current_message_citation" };

/** Review proposals currently cite only the founder message stored for this
 * turn. Check its identity and exact quote before attempting durable staging. */
export function rejectUnavailableCurrentMessageCitation(
  payload: ProposalPayload,
  current: { id: string; text: string },
): CurrentMessageCitationRefusal | null {
  return payload.citations.some((citation) => citation.sourceId !== current.id || !current.text.includes(citation.quote))
    ? { rejected: "current_message_citation" }
    : null;
}
