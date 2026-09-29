import { describe, expect, it, vi } from "vitest";
import type { ModelTurn } from "@/lib/osCofounder";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { parseReviewRequestIntent, reviewIntentEquals, reviewIntentGuard, reviewSourceForIntent, reviewToolsForIntent } from "@/lib/osReviewIntent";
import { runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import { rejectUnavailableCurrentMessageCitation } from "@/lib/osReviewCitation";

const assertion = "The Cedar project requires owner review.";
const intent = { draftFormat: "reply" as const, knowledgeAssertion: assertion };
const work: ProposalPayload = { type: "work", title: "Customer reply", body: "Hello Sam, please confirm the quantity.", lane: "sales", kind: "reply", outwardAction: "send", citations: [{ sourceId: "message", quote: "quantity" }] };
const knowledge: ProposalPayload = { type: "knowledge", statement: assertion, kind: "constraint", scope: { type: "project", label: "Cedar" }, duration: { type: "until_changed" }, citations: [{ sourceId: "message:assertion", quote: assertion }] };

describe("trusted request controls, independent of model interpretation", () => {
  it.each(["email", "reply", "post", "note", "research", "decision"])("requires explicit supported format %s", (draftFormat) => {
    expect(parseReviewRequestIntent({ draftFormat, knowledgeAssertion: null }, "draft")).toEqual({ draftFormat, knowledgeAssertion: null });
  });
  it.each([undefined, null, {}, [], { draftFormat: "reply" }, { draftFormat: null, knowledgeAssertion: null },
    { draftFormat: "task", knowledgeAssertion: null }, { draftFormat: "reply", knowledgeAssertion: null, approved: true },
    { draftFormat: "reply", knowledgeAssertion: assertion }])("refuses missing, inferred or excessive draft choices %j", (value) => {
    expect(parseReviewRequestIntent(value, "draft")).toBeNull();
  });
  it.each(["", "ab", "   ", "\ttext", "text\n", "x".repeat(2001), true, {}, []])("refuses malformed knowledge assertion %j", (knowledgeAssertion) => {
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion }, "knowledge")).toBeNull();
  });
  it("does not infer endorsement from selecting the knowledge mode", () => {
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion: null }, "knowledge")).not.toBeNull();
    expect(reviewToolsForIntent("knowledge", { draftFormat: null, knowledgeAssertion: null })).toEqual([]);
    expect(reviewToolsForIntent("both", { draftFormat: "reply", knowledgeAssertion: null })).toEqual(["propose_work"]);
    expect(reviewToolsForIntent("both", intent)).toEqual(["propose_work", "propose_knowledge"]);
  });
  it("matches the DB character minimum and proposal/HTML UTF-16 maximum", () => {
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion: "😀a" }, "knowledge")).toBeNull();
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion: "😀ab" }, "knowledge")).not.toBeNull();
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion: "😀".repeat(1000) }, "knowledge")).not.toBeNull();
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion: "😀".repeat(1001) }, "knowledge")).toBeNull();
  });
  it("neither grants draft choice in Ask nor silently discards hidden permissions", () => {
    expect(parseReviewRequestIntent({ draftFormat: null, knowledgeAssertion: null }, "unknown" as never)).toBeNull();
    expect(parseReviewRequestIntent(intent, "ask")).toBeNull();
    expect(parseReviewRequestIntent(intent, "knowledge")).toBeNull();
    expect(reviewToolsForIntent("draft", null)).toEqual([]);
    expect(reviewToolsForIntent("draft", { draftFormat: null, knowledgeAssertion: null })).toEqual([]);
  });
  it("compares exact choices irrespective of JSON key order", () => {
    expect(reviewIntentEquals(intent, { knowledgeAssertion: assertion, draftFormat: "reply" })).toBe(true);
    expect(reviewIntentEquals(intent, { ...intent, knowledgeAssertion: `${assertion} ` })).toBe(false);
    expect(reviewIntentEquals(intent, { ...intent, draftFormat: "note" })).toBe(false);
    expect(reviewIntentEquals(intent, null)).toBe(false);
  });
  it("refuses a coherent but wrongly labelled artifact", () => {
    expect(reviewIntentGuard({ ...work, kind: "note", outwardAction: null }, intent)).toBe("draft_format");
    expect(reviewIntentGuard(work, intent)).toBeNull();
    expect(reviewIntentGuard(work, null)).toBe("intent_required");
  });
  it("requires the exact separate assertion, never a paraphrase or quoted claim", () => {
    expect(reviewIntentGuard(knowledge, intent)).toBeNull();
    expect(reviewIntentGuard({ ...knowledge, statement: "All projects require owner review." }, intent)).toBe("knowledge_assertion");
    expect(reviewIntentGuard(knowledge, { ...intent, knowledgeAssertion: null })).toBe("knowledge_assertion");
  });
  it("keeps attribution sources distinct even when the same words occur in chat", () => {
    const current = { id: "message", text: `A customer wrote: ${assertion}` };
    const source = reviewSourceForIntent("knowledge", current, intent);
    expect(source).toEqual({ id: "message:assertion", text: assertion });
    expect(rejectUnavailableCurrentMessageCitation(knowledge, source)).toBeNull();
    expect(rejectUnavailableCurrentMessageCitation({ ...knowledge, citations: [{ sourceId: current.id, quote: assertion }] }, source)).toEqual({ rejected: "current_message_citation" });
    expect(reviewSourceForIntent("work", current, intent)).toBe(current);
  });
});

describe("production loop enforces founder choices before staging", () => {
  it("rejects model-authored format and assertion fields, then builds exact proposals from the founder choices", async () => {
    let round = 0;
    const turn: ModelTurn = async function* () {
      if (round++ === 0) {
        const workInput = { title: work.title, body: work.body, lane: work.lane };
        const knowledgeInput = { kind: knowledge.kind, scope: knowledge.scope, duration: knowledge.duration };
        const calls = [
          { name: "propose_work", input: { ...workInput, kind: "note", outwardAction: null } },
          { name: "propose_knowledge", input: { ...knowledgeInput, statement: "All projects require owner review." } },
          { name: "propose_work", input: workInput },
          { name: "propose_knowledge", input: knowledgeInput },
        ];
        for (const [index, call] of calls.entries()) {
          yield { type: "tool", id: String(index), ...call };
        }
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
    };
    const propose = vi.fn(async (payload: ProposalPayload) => ({ id: payload.type }));
    const events: ReviewedTurnEvent[] = [];
    for await (const event of runReviewedTurn({ mode: "both", intent, source: { id: "message", text: "quantity" }, system: "Synthetic", history: [], turn, propose, priced: false })) events.push(event);
    expect(propose.mock.calls.map(([payload]) => payload)).toEqual([work, knowledge]);
    const refused = events.filter((event): event is Extract<ReviewedTurnEvent, { type: "refused" }> => event.type === "refused");
    expect(refused).toHaveLength(2);
    expect(refused.every((event) => /field|metadata|format/i.test(event.reason))).toBe(true);
    expect(events.filter((event) => event.type === "proposal")).toHaveLength(2);
    const final = events.at(-1);
    expect(final?.type).toBe("done");
    if (final?.type !== "done") throw new Error("Missing trusted completion");
    expect(final.text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 1.");
    expect(final.text).toContain("Earlier rejected attempts — Work: 1; company knowledge: 1.");
    for (const event of refused) expect(final.text).not.toContain(event.reason);
    expect(final.text).not.toContain("could not be confirmed");
  });
  it("calls neither model nor storage for missing intent", async () => {
    const turn = vi.fn(async function* () { yield { type: "done" as const, stopReason: "end_turn", inputTokens: 0, outputTokens: 0 }; });
    const propose = vi.fn();
    await expect(async () => {
      // Deliberately malformed runtime caller, not an inferred legacy request.
      for await (const event of runReviewedTurn({ mode: "draft", intent: null as never, source: { id: "message", text: "quantity" }, system: "Synthetic", history: [], turn, propose })) void event;
    }).rejects.toMatchObject({ reason: "intent_required" });
    expect(turn).not.toHaveBeenCalled();
    expect(propose).not.toHaveBeenCalled();
  });
});
