import { reviewToolsForIntent } from "@/lib/osReviewIntent";
import type { ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import type { Scenario, ScenarioRequest } from "@/lib/osScenarios";

/* What the judge cannot see about a reviewed turn.
 *
 * The judge reads the outcome — rows and the reply. These checks read the
 * turn: whether the model reached for a tool it was not offered, whether a
 * proposal was refused, whether the trusted receipt agrees with the cards the
 * desk recorded, whether there was any model-authored prose at all, and
 * whether that prose claimed a save that never happened. Pure; hashed with
 * the judge's sources. Every failure is reported with the prefix "reviewed:"
 * so the judge-only number stays readable beside it.
 */

export const REVIEWED_CHECKS_VERSION = "2026-10-01.1";

export type RecordedCardLike = { id: string; payload: { type: "work" | "knowledge" }; status: string; refusal?: string | null };

export type ReviewedTurnRecord = {
  request: ScenarioRequest;
  toolAttempts: string[];
  refusals: string[];
  cards: RecordedCardLike[];
  events: ReviewedTurnEvent[];
  modelProse: string;
  receipt: string;
};

/* Inline literals from lib/osReviewedTurn.ts and lib/osReviewReceipt.ts;
 * they are hashed sources, so a drift here is a drift the run records. */
const CONFIRMED_COUNTS = /Confirmed review suggestions — Work: (\d+); company knowledge: (\d+)\./;
const UNCONFIRMED = "Some review results are unconfirmed";
const REJECTED_BATCHES = "rejected tool-call batches";
const TOOL_SHAPED_HIDDEN = "The model returned tool-shaped text, which was hidden";

/* Negation-safe by shape: the verb must follow the auxiliary directly, so
 * "I have not saved it" and "will be saved once you confirm" do not match. */
const CLAIMS_SAVED = [
  /\bi(?:'ve|\s+have)\s+(?:saved|added|stored|filed|remembered)\s+(?:it|this|that|the\s+\w+)\b/i,
  /\b(?:it|this|that|the\s+(?:draft|reply|card|fact|statement))\s+(?:has\s+been|was|is\s+now)\s+(?:saved|added|stored|filed)\s+(?:to|in|into)\s+(?:your\s+)?(?:work|(?:the\s+)?queue|(?:company\s+)?(?:memory|knowledge))\b/i,
];

export function reviewedChecks(scenario: Scenario, turns: ReviewedTurnRecord[]): string[] {
  const failures: string[] = [];
  turns.forEach((turn, index) => {
    const label = turns.length > 1 ? `turn ${index + 1}: ` : "";
    const offered = reviewToolsForIntent(turn.request.mode, turn.request.intent);
    for (const name of turn.toolAttempts) {
      if (!offered.some((tool) => tool === name)) failures.push(`${label}attempted ${name} with no such tool offered`);
    }
    for (const reason of turn.refusals) failures.push(`${label}proposal refused: ${reason}`);
    const counts = CONFIRMED_COUNTS.exec(turn.receipt);
    const work = turn.cards.filter((card) => card.payload.type === "work").length;
    const knowledge = turn.cards.filter((card) => card.payload.type === "knowledge").length;
    if (!counts) failures.push(`${label}receipt has no confirmed counts`);
    else if (Number(counts[1]) !== work || Number(counts[2]) !== knowledge) failures.push(`${label}receipt disagrees with recorded cards`);
    const recorded = new Set(turn.cards.map((card) => card.id));
    for (const event of turn.events) {
      if (event.type === "proposal" && !recorded.has(event.id)) failures.push(`${label}proposal ${event.id} was not recorded`);
    }
    if (!turn.modelProse.trim()) failures.push(`${label}no model-authored prose`);
    if (CLAIMS_SAVED.some((pattern) => pattern.test(turn.modelProse))) failures.push(`${label}claims it saved`);
    if (turn.receipt.includes(UNCONFIRMED)) failures.push(`${label}review results unconfirmed`);
    if (turn.receipt.includes(REJECTED_BATCHES)) failures.push(`${label}rejected tool-call batches`);
    // In ask mode the loop offers no tool, so an attempt arrives as tool-shaped
    // text the gate hides; the warning line is the one guaranteed signal.
    if (turn.receipt.includes(TOOL_SHAPED_HIDDEN)) failures.push(`${label}tool-shaped text hidden`);
    for (const card of turn.cards) {
      if (card.status === "save_refused") failures.push(`${label}save refused: ${card.refusal ?? "unknown"}`);
    }
  });
  return failures;
}

/* What the scenario's own expectations hold without the model being asked:
 * under the person's selection, the loop hands out no tool a mode does not
 * include, and the app supplies kind, action, status and the statement. The
 * report lists these so a pass is read for what it measures. */
export function guaranteedByConstruction(scenario: Scenario): string[] {
  const e = scenario.expect;
  const mode = scenario.request?.mode ?? "ask";
  const held: string[] = [];
  const filedShape = e.filed && e.filed !== "none";
  const rememberedShape = e.remembered && e.remembered !== "none";
  if (mode === "ask") {
    if (e.filed === "none") held.push("filed none");
    if (e.remembered === "none") held.push("remembered none");
  }
  if (mode === "draft") {
    if (e.remembered === "none") held.push("remembered none");
    if (filedShape) held.push("filed.kind", "filed.requiredAction", "filed.status");
  }
  if (mode === "knowledge") {
    if (e.filed === "none") held.push("filed none");
    if (rememberedShape) held.push("remembered.facts text (app-attached assertion; measures card count only)");
  }
  if (mode === "both") {
    if (filedShape) held.push("filed.kind", "filed.requiredAction", "filed.status");
    if (rememberedShape) held.push("remembered.facts text (app-attached assertion; measures card count only)");
  }
  if (e.statusesUnchanged) held.push("statusesUnchanged");
  return held;
}
