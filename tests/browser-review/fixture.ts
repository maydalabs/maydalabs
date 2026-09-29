// Illustrative browser-fixture records only. This is NOT a database writer,
// authentication implementation, model response or durability proof.
import type { DurableProposal, DurableTurn } from "@/lib/osReviewTypes";
import type { ProposalPayload, ReviewSource } from "@/lib/osReviewBoundary";
import { parseReviewRequestIntent, reviewIntentGuard, type ReviewRequestIntent, type ReviewRequestMode } from "@/lib/osReviewIntent";

export const FIXTURE_KEY = "maydaos-synthetic-review-ui-s1i-v1";
export const EXAMPLE_QUESTION = "Draft a short reply to this customer: ‘Can you promise a Friday launch?’ We have not agreed a launch date. Say we will review the scope together before committing to a date.";
export const EXAMPLE_ASSERTION = "For the Atlas project, we agree scope before committing to a launch date.";
export type FixtureState = { turn: DurableTurn | null; proposals: DurableProposal[]; requests: number };
export type FixtureCommand = { proposalId: string; revision: number; fingerprint: string; action: string; payload?: ProposalPayload; knowledgeApproved?: true };
export const emptyFixture = (): FixtureState => ({ turn: null, proposals: [], requests: 0 });
const company = "11111111-1111-4111-8111-111111111111";
const actor = "33333333-3333-4333-8333-333333333333";
const turnId = "44444444-4444-4444-8444-444444444444";
const sourceId = "22222222-2222-4222-8222-222222222222";

export function createFixture(question: string, mode: ReviewRequestMode, intent: ReviewRequestIntent): FixtureState {
  if (!question.trim() || !parseReviewRequestIntent(intent, mode)) throw new Error("invalid_fixture_request");
  const capturedIntent = { ...intent };
  const turn: DurableTurn = {
    id: turnId, company_id: company, actor_id: actor, thread_id: "88888888-8888-4888-8888-888888888888", person_message_id: sourceId,
    status: "completed", question: question.trim(), mode, intent: capturedIntent,
    reply: "Illustrative fixture output only. No model ran. Review each proposal before saving it to this browser’s isolated storage.",
    created_at: "2026-09-27T08:00:00.000Z", updated_at: "2026-09-27T08:00:00.000Z", history: [],
  };
  const source: ReviewSource = { id: sourceId, companyId: company, revision: "b".repeat(64), text: turn.question, origin: "founder" };
  const base = { company_id: company, actor_id: actor, turn_id: turn.id, revision: 1, fingerprint: "a".repeat(64), status: "proposed" as const, record_id: null };
  const proposals: DurableProposal[] = [];
  if (capturedIntent.draftFormat) {
    const kind = capturedIntent.draftFormat;
    proposals.push({ ...base, id: "55555555-5555-4555-8555-555555555555", sources: [source], payload: {
      type: "work", title: "Atlas scope conversation", body: "Thanks for checking. Let’s review the scope together before we commit to a launch date.",
      lane: "product", kind, outwardAction: kind === "email" || kind === "reply" ? "send" : kind === "post" ? "publish" : null,
      citations: [{ sourceId, quote: turn.question }],
    } });
  }
  if (capturedIntent.knowledgeAssertion) {
    const assertionSource = { ...source, id: `${sourceId}:assertion`, text: capturedIntent.knowledgeAssertion };
    proposals.push({ ...base, id: "66666666-6666-4666-8666-666666666666", sources: [assertionSource], payload: {
      type: "knowledge", statement: capturedIntent.knowledgeAssertion, kind: "constraint", scope: { type: "project", label: "Atlas" },
      duration: { type: "until_changed" }, citations: [{ sourceId: assertionSource.id, quote: assertionSource.text }],
    } });
  }
  return { turn, proposals, requests: 0 };
}

export function applyFixtureCommand(state: FixtureState, command: FixtureCommand): { state: FixtureState; status: number; body: object } {
  const next = structuredClone(state);
  next.requests++;
  const proposal = next.proposals.find((row) => row.id === command.proposalId);
  const result = (status: number, body: object) => ({ state: next, status, body });
  const refused = (reason: string) => result(422, { error: "review_rejected", reason });
  if (!proposal || proposal.status !== "proposed" || proposal.revision !== command.revision || proposal.fingerprint !== command.fingerprint) return result(409, { error: "stale_fixture" });
  if (command.action === "dismiss") proposal.status = "dismissed";
  else {
    const payload = command.action === "revise" ? command.payload : proposal.payload;
    if (!payload || payload.type !== proposal.payload.type) return result(400, { error: "invalid_fixture_command" });
    const rejection = reviewIntentGuard(payload, next.turn?.intent);
    if (rejection) return refused(rejection);
    if (command.action === "revise") {
      proposal.payload = structuredClone(payload);
      proposal.revision++;
      proposal.fingerprint = String(proposal.revision).padStart(64, "c");
    } else if (command.action === "save_to_work" && payload.type === "work") {
      proposal.status = "saved";
      proposal.record_id = "77777777-7777-4777-8777-777777777771";
    } else if (command.action === "add_to_company_knowledge" && payload.type === "knowledge") {
      if (command.knowledgeApproved !== true) return refused("knowledge_approval");
      proposal.status = "saved";
      proposal.record_id = "77777777-7777-4777-8777-777777777772";
    } else return result(400, { error: "invalid_fixture_command" });
  }
  return result(200, { proposal });
}
