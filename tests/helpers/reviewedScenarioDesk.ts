import { createHash } from "node:crypto";
import type { ProposalPayload, ReviewSource } from "@/lib/osReviewBoundary";
import { rejectUnavailableCurrentMessageCitation } from "@/lib/osReviewCitation";
import { rejectExistingOpenWork } from "@/lib/osReviewDuplicate";
import type { ReviewCurrentSource } from "@/lib/osReviewEnvelope";
import { reviewProposalGuard, type ReviewProposalRefusal } from "@/lib/osReviewGuard";
import { reviewIntentGuard, reviewSourceForIntent } from "@/lib/osReviewIntent";
import type { ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import type { ScenarioRequest } from "@/lib/osScenarios";
import type { scenarioFixture } from "./scenarioFixture";

/* The desk's side of a reviewed turn, for a scenario run.
 *
 * The route stages a proposal through a chain of refusals and then a person
 * decides. Here the chain is replayed over the in-memory company with the
 * same modules, in the same order, and after the turn every card is saved
 * unchanged — written exactly as os_review_decide writes it on a person's
 * Save — so the frozen judge reads the same Outcome shape from the same
 * snapshot diff. A card the save would refuse (an exact body already open)
 * is not written, as in production. No person decided; the report says so.
 * Not a database, not RLS: only the checks with a TypeScript twin exist here.
 */

export const REVIEWED_DESK_VERSION = "2026-10-01.1";
export const REVIEWED_DECISION_POLICY =
  "every staged card saved unchanged by the harness after its turn; a card the save refuses is not filed; refused proposals never counted; no person decided";

export type RecordedCard = {
  id: string;
  payload: ProposalPayload;
  sources: ReviewSource[];
  status: "proposed" | "saved" | "save_refused";
  refusal: string | null;
  record_id: string | null;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function reviewedScenarioDesk(args: {
  fixture: ReturnType<typeof scenarioFixture>;
  request: ScenarioRequest;
  said: string;
  turnIndex: number;
  /* YYYY-MM-DD; the one SQL-only check without a twin is an expired until_date. */
  today: string;
}) {
  const { fixture, request, said, turnIndex, today } = args;
  const companyId = fixture.companyId;
  const actorId = `${companyId}:actor`;
  const threadId = `${companyId}:thread`;
  const turnId = `${companyId}:turn-${turnIndex + 1}`;
  const source: ReviewCurrentSource = Object.freeze({ id: `${companyId}:message-${turnIndex + 1}`, text: said });
  const intent = request.intent;
  const cards: RecordedCard[] = [];

  /* The route's chain, in its order: intent guard, citation, duplicate read,
   * then the proposer's own guard and the one SQL-only check. */
  async function propose(payload: ProposalPayload): Promise<{ id: string } | ReviewProposalRefusal> {
    const intentReason = reviewIntentGuard(payload, intent);
    if (intentReason) return { rejected: intentReason };
    const citation = rejectUnavailableCurrentMessageCitation(payload, reviewSourceForIntent(payload.type, source, intent));
    if (citation) return citation;
    const duplicate = await rejectExistingOpenWork(fixture.db, companyId, payload);
    if (duplicate) return duplicate;
    const guard = reviewProposalGuard(payload);
    if (guard) return { rejected: guard };
    if (payload.type === "knowledge" && payload.duration.type === "until_date" && payload.duration.date < today) return { rejected: "refused" };
    const cited = reviewSourceForIntent(payload.type, source, intent);
    const id = `proposal-${cards.length + 1}`;
    cards.push({
      id, payload: structuredClone(payload),
      sources: [{ id: cited.id, companyId, revision: sha256(cited.text), text: cited.text, origin: "founder" }],
      status: "proposed", refusal: null, record_id: null,
    });
    return { id };
  }

  function rowIds(table: "os_work_items" | "os_company_memory"): Set<string> {
    return new Set(fixture.snapshot()[table].map((row) => String(row.id)));
  }

  /* What a person's unchanged Save writes, card by card: decideReview's own
   * pre-check, the save-time duplicate check (the SQL trigger's twin), then
   * the row os_review_decide inserts, with the provenance envelope. */
  async function saveAllUnchanged(): Promise<RecordedCard[]> {
    for (const card of cards) {
      if (card.status !== "proposed") continue;
      const guard = reviewProposalGuard(card.payload);
      if (guard) { card.status = "save_refused"; card.refusal = guard; continue; }
      if (card.payload.type === "work") {
        const duplicate = await rejectExistingOpenWork(fixture.db, companyId, card.payload);
        if (duplicate) { card.status = "save_refused"; card.refusal = duplicate.rejected; continue; }
      }
      const provenance = {
        proposalId: card.id, revision: 1,
        // A harness stand-in for the SQL fingerprint, not storage proof.
        fingerprint: sha256(stable({ desk: REVIEWED_DESK_VERSION, id: card.id, payload: card.payload, sources: card.sources })),
        turnId, threadId, authorship: "model", lastEditedBy: null, confirmedBy: actorId, externallyVerified: false,
        sources: card.sources, citations: card.payload.citations, requestIntent: intent,
        knowledgeApproved: card.payload.type === "knowledge",
      };
      const table = card.payload.type === "work" ? "os_work_items" : "os_company_memory";
      const before = rowIds(table);
      if (card.payload.type === "work") {
        await fixture.db.from("os_work_items").insert({
          company_id: companyId, lane: card.payload.lane, kind: card.payload.kind, title: card.payload.title,
          status: "drafted", required_action: card.payload.outwardAction, notes: card.payload.body,
          sources: card.sources, metadata: { by: "cofounder", review: provenance },
        });
      } else {
        await fixture.db.from("os_company_memory").insert({
          company_id: companyId, fact: card.payload.statement, kind: card.payload.kind, source: "cofounder", created_by: null,
          review_proposal_id: card.id, review_scope: card.payload.scope, review_duration: card.payload.duration,
          review_provenance: provenance, confirmed_by: actorId, confirmed_at: `${today}T00:00:00.000Z`,
        });
      }
      const added = [...rowIds(table)].filter((id) => !before.has(id));
      card.status = "saved";
      card.record_id = added[0] ?? null;
    }
    return structuredClone(cards);
  }

  /* The loop always yields the trusted receipt as its last text event. */
  function split(events: ReviewedTurnEvent[]): { modelProse: string; receipt: string } {
    const texts = events.filter((event): event is Extract<ReviewedTurnEvent, { type: "text" }> => event.type === "text").map((event) => event.text);
    return { receipt: texts.at(-1) ?? "", modelProse: texts.slice(0, -1).join("") };
  }

  return { source, propose, cards: () => structuredClone(cards), saveAllUnchanged, split };
}
