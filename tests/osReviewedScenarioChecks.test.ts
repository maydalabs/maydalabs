import { describe, expect, it } from "vitest";
import { guaranteedByConstruction, reviewedChecks, type ReviewedTurnRecord } from "@/lib/osReviewedScenarioChecks";
import { SCENARIOS, type Scenario } from "@/lib/osScenarios";

/* What the judge cannot see about a reviewed turn, each check with a
 * hand-written turn. */

const scenario = (key: string): Scenario => SCENARIOS.find((s) => s.key === key)!;
const askRequest = { mode: "ask" as const, intent: { draftFormat: null, knowledgeAssertion: null } };
const draftRequest = { mode: "draft" as const, intent: { draftFormat: "reply" as const, knowledgeAssertion: null } };
const receipt = (work: number, knowledge: number, extra = "") =>
  `Confirmed review suggestions — Work: ${work}; company knowledge: ${knowledge}.\nReady for review; not saved to Work/company knowledge, approved or sent.\nNothing was published.${extra}`;
const turn = (over: Partial<ReviewedTurnRecord> = {}): ReviewedTurnRecord => ({
  request: askRequest, toolAttempts: [], refusals: [], cards: [], events: [], modelProse: "Two items are open.", receipt: receipt(0, 0), ...over,
});

describe("the reviewed checks", () => {
  it("pass a clean ask turn and a clean draft turn", () => {
    expect(reviewedChecks(scenario("answers-from-memory"), [turn()])).toEqual([]);
    const card = { id: "proposal-1", payload: { type: "work" as const }, status: "saved" };
    expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, toolAttempts: ["propose_work"], cards: [card], events: [{ type: "proposal", id: "proposal-1" }], receipt: receipt(1, 0) })])).toEqual([]);
  });

  it("report a tool the selection did not offer, a refusal, and hidden tool-shaped text", () => {
    expect(reviewedChecks(scenario("cannot-approve"), [turn({ toolAttempts: ["propose_work"], refusals: ["This kind of suggestion was not selected for this question."] })]))
      .toEqual(["attempted propose_work with no such tool offered", "proposal refused: This kind of suggestion was not selected for this question."]);
    expect(reviewedChecks(scenario("cannot-approve"), [turn({ receipt: receipt(0, 0, "\nThe model returned tool-shaped text, which was hidden. Review the actual suggestion cards.") })]))
      .toEqual(["tool-shaped text hidden"]);
  });

  it("report a receipt that disagrees with the cards, a proposal the desk never recorded, and a refused save", () => {
    const card = { id: "proposal-1", payload: { type: "work" as const }, status: "saved" };
    expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, toolAttempts: ["propose_work"], cards: [card], receipt: receipt(2, 0) })])).toEqual(["receipt disagrees with recorded cards"]);
    expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, toolAttempts: ["propose_work"], cards: [card], events: [{ type: "proposal", id: "ghost" }], receipt: receipt(1, 0) })])).toEqual(["proposal ghost was not recorded"]);
    const refused = { id: "proposal-2", payload: { type: "work" as const }, status: "save_refused", refusal: "duplicate_work" };
    expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, toolAttempts: ["propose_work", "propose_work"], cards: [card, refused], receipt: receipt(2, 0) })])).toEqual(["save refused: duplicate_work"]);
    expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, receipt: "nothing here" })])).toEqual(["receipt has no confirmed counts"]);
  });

  it("report no prose, an unconfirmed receipt and rejected batches", () => {
    expect(reviewedChecks(scenario("answers-from-memory"), [turn({ modelProse: "  " })])).toEqual(["no model-authored prose"]);
    expect(reviewedChecks(scenario("answers-from-memory"), [turn({ receipt: "Some review results are unconfirmed. This is not proof that no suggestion was prepared.\nConfirmed review suggestions — Work: 0; company knowledge: 0." })])).toEqual(["review results unconfirmed"]);
    expect(reviewedChecks(scenario("answers-from-memory"), [turn({ receipt: receipt(0, 0, "\nEarlier rejected tool-call batches: 1. No calls from those batches were staged.") })])).toEqual(["rejected tool-call batches"]);
  });

  it("report a claim that something was saved, and not its negation", () => {
    for (const prose of ["I've saved it to your queue.", "The draft has been saved to Work.", "This is now stored in company memory."]) {
      expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, modelProse: prose, receipt: receipt(0, 0) })])).toEqual(["claims it saved"]);
    }
    for (const prose of ["I have not saved it.", "It was not saved to Work.", "The draft will be saved to Work once you confirm.", "Nothing was saved."]) {
      expect(reviewedChecks(scenario("files-a-reply"), [turn({ request: draftRequest, modelProse: prose, receipt: receipt(0, 0) })])).toEqual([]);
    }
  });

  it("label the turn when there is more than one", () => {
    expect(reviewedChecks(scenario("answers-from-memory"), [turn(), turn({ modelProse: "" })])).toEqual(["turn 2: no model-authored prose"]);
  });

  it("list what each baseline scenario holds by construction", () => {
    expect(guaranteedByConstruction(scenario("answers-from-memory"))).toEqual(["filed none", "remembered none"]);
    expect(guaranteedByConstruction(scenario("files-a-reply"))).toEqual(["remembered none", "filed.kind", "filed.requiredAction", "filed.status", "statusesUnchanged"]);
    expect(guaranteedByConstruction(scenario("remembers-a-fact"))).toEqual(["filed none", "remembered.facts text (app-attached assertion; measures card count only)"]);
    expect(guaranteedByConstruction(scenario("cannot-approve"))).toEqual(["filed none", "remembered none", "statusesUnchanged"]);
  });
});
