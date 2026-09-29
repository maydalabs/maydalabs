import type { CofounderToolName } from "@/lib/osCofounder";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { REVIEW_WORK_KINDS, type ReviewWorkKind, type ReviewGuardReason } from "@/lib/osReviewGuard";

/** The founder chooses which kinds of review suggestion this question permits.
 * This is a capability ceiling, not an instruction to manufacture a proposal.
 */
export const REVIEW_REQUEST_MODES = ["ask", "draft", "knowledge", "both"] as const;
export type ReviewRequestMode = (typeof REVIEW_REQUEST_MODES)[number];

export function isReviewRequestMode(value: unknown): value is ReviewRequestMode {
  return typeof value === "string" && REVIEW_REQUEST_MODES.some((mode) => mode === value);
}

export function reviewToolsForMode(mode: ReviewRequestMode): readonly CofounderToolName[] {
  if (mode === "draft") return ["propose_work"];
  if (mode === "knowledge") return ["propose_knowledge"];
  if (mode === "both") return ["propose_work", "propose_knowledge"];
  return [];
}

/** Founder-authored request data, never inferred from prose or model output.
 * A null assertion permits discussion, not a knowledge proposal. */
export type ReviewRequestIntent = {
  draftFormat: ReviewWorkKind | null;
  knowledgeAssertion: string | null;
};

export function parseReviewRequestIntent(value: unknown, mode: ReviewRequestMode): ReviewRequestIntent | null {
  if (!isReviewRequestMode(mode)) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).length !== 2 || !Object.hasOwn(p, "draftFormat") || !Object.hasOwn(p, "knowledgeAssertion")) return null;
  if (p.draftFormat !== null && !REVIEW_WORK_KINDS.some((kind) => kind === p.draftFormat)) return null;
  // Minimum matches the existing Postgres memory constraint; maximum matches
  // proposal payloads and the HTML field's UTF-16 limit.
  if (p.knowledgeAssertion !== null && (typeof p.knowledgeAssertion !== "string" || p.knowledgeAssertion.trim() !== p.knowledgeAssertion || Array.from(p.knowledgeAssertion).length < 3 || p.knowledgeAssertion.length > 2000)) return null;
  if ((mode === "draft" || mode === "both") ? p.draftFormat === null : p.draftFormat !== null) return null;
  if ((mode === "ask" || mode === "draft") && p.knowledgeAssertion !== null) return null;
  return { draftFormat: p.draftFormat as ReviewWorkKind | null, knowledgeAssertion: p.knowledgeAssertion as string | null };
}

export function reviewIntentEquals(a: ReviewRequestIntent | null | undefined, b: ReviewRequestIntent | null | undefined): boolean {
  return a === b || (!!a && !!b && a.draftFormat === b.draftFormat && a.knowledgeAssertion === b.knowledgeAssertion);
}

export function reviewToolsForIntent(mode: ReviewRequestMode, intent: ReviewRequestIntent | null | undefined): readonly CofounderToolName[] {
  if (!parseReviewRequestIntent(intent, mode)) return [];
  return reviewToolsForMode(mode).filter((name) => name !== "propose_knowledge" || intent!.knowledgeAssertion !== null);
}

export function reviewIntentGuard(payload: ProposalPayload, intent: ReviewRequestIntent | null | undefined): ReviewGuardReason | null {
  if (!intent) return "intent_required";
  if (payload.type === "work") return intent.draftFormat !== payload.kind ? "draft_format" : null;
  return !intent.knowledgeAssertion || payload.statement !== intent.knowledgeAssertion ? "knowledge_assertion" : null;
}

export function reviewSourceForIntent(type: ProposalPayload["type"], current: { id: string; text: string }, intent: ReviewRequestIntent) {
  return type === "knowledge"
    ? { id: `${current.id}:assertion`, text: intent.knowledgeAssertion ?? "" }
    : current;
}
