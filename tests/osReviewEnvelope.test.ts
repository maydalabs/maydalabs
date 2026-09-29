import { describe, expect, it, vi } from "vitest";
import { PROPOSE_KNOWLEDGE_TOOL, PROPOSE_WORK_TOOL, reviewedSystemFor, type ModelTurn } from "@/lib/osCofounder";
import { reviewProposalEnvelope, validReviewCurrentSource } from "@/lib/osReviewEnvelope";
import { invalidDraftToolFeedback, invalidKnowledgeToolFeedback } from "@/lib/osReviewProposalFeedback";
import { REVIEW_WORK_ACTIONS, type ReviewWorkKind } from "@/lib/osReviewGuard";
import { runReviewedTurn } from "@/lib/osReviewedTurn";

const source = { id: "immutable-current-message", text: "Draft a reply for Noor. Scope: project Cedar, until 31 January 2027." };
const intent = { draftFormat: "reply" as ReviewWorkKind | null, knowledgeAssertion: "Cedar changes need owner review. 😀" };
const work = { title: "Reply to Noor", body: "  Dear Noor,\nPlease review the proposed changes.\n  ", lane: "product" };
const knowledge = { kind: "constraint", scope: { type: "project", label: "Cedar" }, duration: { type: "until_date", date: "2027-01-31" } };

describe("server-built proposal envelope", () => {
  it.each(Object.entries(REVIEW_WORK_ACTIONS))("attaches selected %s and its fixed later action", (kind, outwardAction) => {
    expect(reviewProposalEnvelope("propose_work", work, { ...intent, draftFormat: kind as ReviewWorkKind }, source)).toEqual({
      type: "work", ...work, kind, outwardAction, citations: [{ sourceId: source.id, quote: source.text }],
    });
  });
  it("preserves exact separate assertion, scope and duration without making it a chat quote", () => {
    expect(reviewProposalEnvelope("propose_knowledge", knowledge, intent, source)).toEqual({
      type: "knowledge", ...knowledge, statement: intent.knowledgeAssertion,
      citations: [{ sourceId: `${source.id}:assertion`, quote: intent.knowledgeAssertion }],
    });
  });
  it.each(["kind", "outwardAction", "citations", "source", "sourceId", "type", "approved", "actorId", "companyId", "status", "confirmedBy"])("rejects model Work metadata %s even if correct", (key) => {
    expect(reviewProposalEnvelope("propose_work", { ...work, [key]: key === "kind" ? intent.draftFormat : "forged" }, intent, source)).toBeNull();
  });
  it.each([intent.knowledgeAssertion, "Cedar değişiklikleri onay gerektirir.", "All projects require review."])("refuses any model-supplied statement: %s", (statement) => {
    expect(reviewProposalEnvelope("propose_knowledge", { ...knowledge, statement }, intent, source)).toBeNull();
  });
  it.each(["citations", "sourceId", "source", "type", "approved", "revision"])("rejects model knowledge authority field %s", (key) => {
    expect(reviewProposalEnvelope("propose_knowledge", { ...knowledge, [key]: "forged" }, intent, source)).toBeNull();
  });
  it.each([
    { kind: "constraint", duration: knowledge.duration },
    { kind: "constraint", scope: knowledge.scope },
    { ...knowledge, scope: { type: "company" } },
    { ...knowledge, scope: { ...knowledge.scope, approved: true } },
    { ...knowledge, duration: { type: "until_date", date: "2027-02-30" } },
    { ...knowledge, duration: { type: "until_changed", date: "2027-01-31" } },
  ])("does not invent or default knowledge scope/duration: %j", (input) => {
    expect(reviewProposalEnvelope("propose_knowledge", input, intent, source)).toBeNull();
  });
  it.each([null, undefined, {}, [], "payload"])("fails closed for invalid input %j", (input) => {
    expect(reviewProposalEnvelope("propose_work", input, intent, source)).toBeNull();
    expect(reviewProposalEnvelope("propose_knowledge", input, intent, source)).toBeNull();
  });
  it("does not infer missing permissions from content or unknown tool names", () => {
    expect(reviewProposalEnvelope("propose_work", work, { ...intent, draftFormat: null }, source)).toBeNull();
    expect(reviewProposalEnvelope("propose_knowledge", knowledge, { ...intent, knowledgeAssertion: null }, source)).toBeNull();
    expect(reviewProposalEnvelope("save_to_work", work, intent, source)).toBeNull();
  });
  it.each([undefined, null, {}, [], { id: "", text: "hello" }, { id: "x".repeat(191), text: "hello" },
    { id: "msg", text: " " }, { id: "msg", text: "x".repeat(8001) }])("requires a usable independently supplied current source %j", (value) => {
    expect(validReviewCurrentSource(value)).toBe(false);
  });
  it("does not ask the model to reproduce authoritative fields or IDs", () => {
    expect(PROPOSE_WORK_TOOL.input_schema.required).toEqual(["title", "body", "lane"]);
    expect(Object.keys(PROPOSE_WORK_TOOL.input_schema.properties)).toEqual(["title", "body", "lane"]);
    expect(PROPOSE_KNOWLEDGE_TOOL.input_schema.required).toEqual(["kind", "scope", "duration"]);
    const prompt = reviewedSystemFor("A fictional record.", "both", intent);
    expect(prompt).not.toContain(source.id);
    expect(prompt).toContain("The app supplies the selected format");
    expect(prompt).toContain("the conversation uses another language");
    expect(prompt).toContain("Save to Work does not send or publish");
  });
  it("narrow feedback asks only for permitted fields and does not echo private text", () => {
    const secret = "PRIVATE_TOOL_BODY";
    const draft = invalidDraftToolFeedback({ title: secret, body: secret });
    expect(draft).toContain("Correct these fields: lane");
    expect(draft).not.toContain(secret);
    for (const input of [null, { kind: secret, scope: secret, duration: secret }, { ...knowledge, statement: secret }]) {
      const feedback = invalidKnowledgeToolFeedback(input);
      expect(feedback).toContain("only kind, scope and duration");
      expect(feedback).not.toContain(secret);
      expect(feedback).not.toContain("Supply an object with statement");
    }
  });
});

describe("trusted inputs remain fixed across model awaits", () => {
  it("does not stage a card merely because both choices exist", async () => {
    const propose = vi.fn();
    const turn: ModelTurn = async function* () { yield { type: "done", stopReason: "end_turn", inputTokens: 0, outputTokens: 0 }; };
    for await (const event of runReviewedTurn({ mode: "both", intent, source, system: "Synthetic", history: [], turn, propose, priced: false })) void event;
    expect(propose).not.toHaveBeenCalled();
  });
  it("snapshots controls and source instead of reading caller mutations during generation", async () => {
    const mutableIntent = { ...intent };
    const mutableSource = { ...source };
    let call = 0;
    const turn: ModelTurn = async function* () {
      if (!call++) {
        mutableIntent.draftFormat = "note";
        mutableIntent.knowledgeAssertion = "Injected statement";
        mutableSource.id = "another-message";
        mutableSource.text = "Injected request";
        yield { type: "tool", id: "one", name: "propose_work", input: work };
        yield { type: "tool", id: "two", name: "propose_knowledge", input: knowledge };
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
    };
    const propose = vi.fn(async (p) => ({ id: p.type }));
    for await (const event of runReviewedTurn({ mode: "both", intent: mutableIntent, source: mutableSource, system: "Synthetic", history: [], turn, propose, priced: false })) void event;
    expect(propose.mock.calls.map(([p]) => p)).toEqual([
      reviewProposalEnvelope("propose_work", work, intent, source),
      reviewProposalEnvelope("propose_knowledge", knowledge, intent, source),
    ]);
  });
  it("fails before invoking the model when current source is missing", async () => {
    const turn = vi.fn(); const propose = vi.fn();
    await expect(async () => {
      for await (const event of runReviewedTurn({ mode: "both", intent, source: undefined as never, system: "Synthetic", history: [], turn, propose })) void event;
    }).rejects.toMatchObject({ reason: "source_required" });
    expect(turn).not.toHaveBeenCalled();
    expect(propose).not.toHaveBeenCalled();
  });
});
