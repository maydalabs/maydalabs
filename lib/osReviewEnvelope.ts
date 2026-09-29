import { parseReviewProposal, type ProposalPayload } from "@/lib/osReviewBoundary";
import { REVIEW_WORK_ACTIONS } from "@/lib/osReviewGuard";
import { reviewSourceForIntent, type ReviewRequestIntent } from "@/lib/osReviewIntent";

/** The host supplies the immutable current message, never a model-selected
 * source. Company/actor/turn binding is independently enforced by the store. */
export type ReviewCurrentSource = Readonly<{ id: string; text: string }>;

export function validReviewCurrentSource(value: unknown): value is ReviewCurrentSource {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  return typeof source.id === "string" && source.id.trim().length > 0 && source.id.length <= 190 &&
    typeof source.text === "string" && source.text.trim().length > 0 && source.text.length <= 8000;
}

/** Convert a narrow MODEL tool input to the full proposal DTO. Do not silently
 * correct/strip authoritative fields supplied by a model, even if they happen
 * to match. A format choice alone never calls this function or stages a card.
 * The citation attributes the request; it does not verify the generated body. */
export function reviewProposalEnvelope(
  name: string, input: unknown, intent: ReviewRequestIntent, current: ReviewCurrentSource,
): ProposalPayload | null {
  if (!validReviewCurrentSource(current) || !input || typeof input !== "object" || Array.isArray(input)) return null;
  const fields = input as Record<string, unknown>;
  const type = name === "propose_work" ? "work" : name === "propose_knowledge" ? "knowledge" : null;
  if (!type) return null;
  const keys = type === "work" ? ["title", "body", "lane"] : ["kind", "scope", "duration"];
  if (Object.keys(fields).length !== keys.length || keys.some((key) => !Object.hasOwn(fields, key))) return null;
  const source = reviewSourceForIntent(type, current, intent);
  const citations = [{ sourceId: source.id, quote: source.text }];
  if (type === "work") {
    if (!intent.draftFormat || !Object.hasOwn(REVIEW_WORK_ACTIONS, intent.draftFormat)) return null;
    return parseReviewProposal({ type, title: fields.title, body: fields.body, lane: fields.lane,
      kind: intent.draftFormat, outwardAction: REVIEW_WORK_ACTIONS[intent.draftFormat], citations });
  }
  if (!intent.knowledgeAssertion) return null;
  return parseReviewProposal({ type, statement: intent.knowledgeAssertion, kind: fields.kind,
    scope: fields.scope, duration: fields.duration, citations });
}
