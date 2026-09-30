import { describe, expect, it, vi } from "vitest";
import type { ModelEvent, ModelTurn } from "@/lib/osCofounder";
import { runCostUsd } from "@/lib/os";
import { ReviewedTurnError, runReviewedTurn, type ReviewedTurnEvent, type ReviewedTurnOptions } from "@/lib/osReviewedTurn";
import { reviewedSystemFor } from "@/lib/osCofounder";
import { reviewToolsForIntent } from "@/lib/osReviewIntent";
import { SCENARIO_PERSONAS } from "@/lib/osPersonaVariations";

const work = (overrides: Record<string, unknown> = {}) => ({
  title: "Reply to Mira", body: "Dear Mira, your six crates will be ready Friday.", lane: "sales", ...overrides,
});
const knowledge = (overrides: Record<string, unknown> = {}) => ({
  kind: "preference",
  scope: { type: "company", label: "Synthetic Orchard" }, duration: { type: "until_changed" },
  ...overrides,
});
const source = { id: "person-message", text: "Prepare a reply about six crates. Our team reviews deliveries on Friday." };
const expectedWork = (overrides: Record<string, unknown> = {}) => ({ type: "work", ...work(overrides), kind: "reply", outwardAction: "send", citations: [{ sourceId: source.id, quote: source.text }] });
const call = (name = "propose_work", input: Record<string, unknown> = work(), id = "call-1"): ModelEvent => ({ type: "tool", id, name, input });
const text = (value: string): ModelEvent => ({ type: "text", text: value });
const end = (stopReason: string | null = "end_turn", inputTokens = 10, outputTokens = 3): ModelEvent => ({ type: "done", stopReason, inputTokens, outputTokens });
const round = (...events: ModelEvent[]) => [...events, end(events.some((event) => event.type === "tool") ? "tool_use" : "end_turn")];

function scripted(rounds: ModelEvent[][]) {
  const calls: Parameters<ModelTurn>[0][] = [];
  const turn: ModelTurn = async function* (args) {
    const index = calls.length;
    calls.push({ ...args, messages: structuredClone(args.messages) });
    if (!rounds[index]) throw new Error("Unexpected model round");
    yield* rounds[index];
  };
  return { turn, calls };
}

async function collect(turn: ModelTurn, overrides: Partial<Omit<ReviewedTurnOptions, "turn">> = {}) {
  const events: ReviewedTurnEvent[] = [];
  const propose = vi.fn(async () => ({ id: "proposal-1" }));
  let error: unknown;
  try {
    for await (const event of runReviewedTurn({
      mode: "both",
      source,
      intent: {
        draftFormat: ["ask", "knowledge"].includes(overrides.mode ?? "both") ? null : "reply",
        knowledgeAssertion: ["ask", "draft"].includes(overrides.mode ?? "both") ? null : "Our team reviews deliveries on Friday.",
      },
      system: "Synthetic review instructions", history: [{ role: "person", body: "Prepare a reply about six crates. Our team reviews deliveries on Friday." }],
      turn, priced: false, propose, ...overrides,
    })) events.push(event);
  } catch (caught) { error = caught; }
  return { events, error, propose };
}

describe("founder-selected review mode", () => {
  it("answers in Ask mode with no proposal tools available", async () => {
    const model = scripted([round(text("The delivery plan has not been confirmed."))]);
    const result = await collect(model.turn, { mode: "ask" });
    expect(model.calls[0].tools).toEqual([]);
    expect(result.propose).not.toHaveBeenCalled();
    expect(completion(result).text).toContain("The delivery plan has not been confirmed.");
  });

  it("refuses an unexpected work call even if a provider emits one in Ask mode", async () => {
    const model = scripted([round(call("propose_work")), round(text("Please choose Prepare a draft for a review card."))]);
    const result = await collect(model.turn, { mode: "ask" });
    expect(model.calls.every((entry) => entry.tools?.length === 0)).toBe(true);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("not selected for this question") }));
  });

  it("allows only a work suggestion in Draft mode", async () => {
    const model = scripted([round(call("propose_knowledge", knowledge())), round(text("I did not add company knowledge."))]);
    const result = await collect(model.turn, { mode: "draft" });
    expect(model.calls[0].tools).toEqual(["propose_work"]);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("not selected for this question") }));
  });

  it("allows only a knowledge suggestion in Knowledge mode", async () => {
    const model = scripted([round(call("propose_work")), round(text("I did not prepare a draft."))]);
    const result = await collect(model.turn, { mode: "knowledge" });
    expect(model.calls[0].tools).toEqual(["propose_knowledge"]);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("not selected for this question") }));
  });
});

function completion(result: Awaited<ReturnType<typeof collect>>) {
  expect(result.error).toBeUndefined();
  const event = result.events.at(-1);
  expect(event?.type).toBe("done");
  return event as Extract<ReviewedTurnEvent, { type: "done" }>;
}

describe("review-first cofounder capability boundary", () => {
  it("stages exact work for human review and returns a trusted unsaved receipt", async () => {
    const body = "  Dear Mira,\n\nYour six crates will be ready Friday.\n  ";
    const model = scripted([round(call("propose_work", work({ body }))), round(text("The draft is ready."))]);
    const result = await collect(model.turn);
    expect(result.propose).toHaveBeenCalledExactlyOnceWith(expectedWork({ body }));
    expect(result.events).toContainEqual({ type: "proposal", id: "proposal-1" });
    expect(completion(result).text).toContain("The draft is ready.\n\nConfirmed review suggestions — Work: 1; company knowledge: 0.");
    expect(completion(result).text).toContain("Ready for review; not saved to Work/company knowledge, approved or sent.");
    expect(model.calls.map((entry) => entry.tools)).toEqual([["propose_work", "propose_knowledge"], ["propose_work", "propose_knowledge"]]);
    expect(JSON.stringify(model.calls[1].messages)).toContain("explicit save control");
  });

  it("stages scoped knowledge with its exact duration and source", async () => {
    const input = knowledge({ scope: { type: "project", label: "Orchard packing" }, duration: { type: "until_date", date: "2027-01-02" } });
    const model = scripted([round(call("propose_knowledge", input)), round()]);
    const result = await collect(model.turn);
    expect(result.propose).toHaveBeenCalledExactlyOnceWith({ type: "knowledge", ...input,
      statement: "Our team reviews deliveries on Friday.", citations: [{ sourceId: `${source.id}:assertion`, quote: "Our team reviews deliveries on Friday." }] });
    expect(completion(result).text).toContain("not saved to Work/company knowledge");
  });

  it.each(["file_work", "remember", "save_to_work", "add_to_company_knowledge", "approve", "send", "unknown"])("does not execute unavailable %s", async (name) => {
    const result = await collect(scripted([round(call(name)), round(text("Saved successfully."))]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused" }));
    expect(completion(result).text).toContain("No Work or company knowledge was saved by this turn.");
    expect(completion(result).text).toContain("No unavailable or invalid action was performed.");
  });

  it.each(["type", "actorId", "companyId", "status", "approved", "confirmedBy", "record_id"])("rejects model-supplied %s instead of stripping it", async (key) => {
    const result = await collect(scripted([round(call("propose_work", work({ [key]: "forged" }))), round()]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect(completion(result).text).toContain("Earlier rejected attempts — Work: 1");
  });

  it.each([
    { body: "" }, { citations: [] }, { citations: [{ sourceId: "source", quote: "quote", verified: true }] },
    { body: "x".repeat(8001) }, { outwardAction: "x".repeat(61) },
  ])("rejects invalid work payload %j", async (override) => {
    const result = await collect(scripted([round(call("propose_work", work(override))), round()]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("not staged") }));
  });

  it("keeps plain conversation read-only and preserves history roles", async () => {
    const model = scripted([round(text("Start with the customer problem."))]);
    const result = await collect(model.turn, { history: [{ role: "person", body: "Hello" }, { role: "cofounder", body: "What is the problem?" }] });
    expect(result.propose).not.toHaveBeenCalled();
    expect(model.calls[0].messages).toEqual([{ role: "user", content: "Hello" }, { role: "assistant", content: "What is the problem?" }]);
    expect(completion(result).text).toContain("Nothing was approved or sent.");
  });

  it("reuses identical proposal receipts within a turn without another callback", async () => {
    const model = scripted([round(call()), round(call("propose_work", work(), "repeat")), round(text("Ready."))]);
    const result = await collect(model.turn);
    expect(result.propose).toHaveBeenCalledTimes(1);
    expect(result.events.filter((event) => event.type === "proposal")).toEqual([{ type: "proposal", id: "proposal-1" }, { type: "proposal", id: "proposal-1" }]);
    completion(result);
  });

  it("permits correction of validation errors without hiding the earlier refusal", async () => {
    const model = scripted([round(call("propose_work", work({ body: "" }))), round(call()), round()]);
    const result = await collect(model.turn);
    expect(result.propose).toHaveBeenCalledTimes(1);
    expect(completion(result).text).toContain("Ready for review;");
    expect(completion(result).text).toContain("Earlier rejected attempts — Work: 1");
    expect(completion(result).text).not.toContain("not staged");
  });
});

describe("uncertain staging and bounded model rounds", () => {
  it("reports a known pre-storage citation refusal without claiming an uncertain DB write", async () => {
    const propose = vi.fn(async () => ({ rejected: "current_message_citation" as const }));
    const model = scripted([round(call()), round(text("I could not prepare that suggestion."))]);
    const result = await collect(model.turn, { propose });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(result.events.some((event) => event.type === "proposal")).toBe(false);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("permitted source") }));
    expect(model.calls[1].tools).toEqual(["propose_work", "propose_knowledge"]);
    expect(completion(result).text).toContain("Earlier rejected attempts — Work: 1");
    expect(completion(result).text).not.toContain("could not be confirmed");
  });

  it("can stage a separate valid proposal after a known citation refusal", async () => {
    const propose = vi.fn().mockResolvedValueOnce({ rejected: "current_message_citation" }).mockResolvedValueOnce({ id: "valid-proposal" });
    const result = await collect(scripted([round(call("propose_work", work(), "bad"), call("propose_knowledge", knowledge(), "valid")), round()]).turn, { propose });
    expect(propose).toHaveBeenCalledTimes(2);
    expect(result.events.filter((event) => event.type === "proposal")).toEqual([{ type: "proposal", id: "valid-proposal" }]);
    expect(completion(result).text).toContain("Ready for review; not saved");
    expect(completion(result).text).toContain("Confirmed review suggestions — Work: 0; company knowledge: 1");
    expect(completion(result).text).toContain("Earlier rejected attempts — Work: 1");
  });

  it("closes all staging after a lost response, even different kinds or reworded retries", async () => {
    const propose = vi.fn(async () => { throw new Error("SECRET_DATABASE_FAILURE"); });
    const model = scripted([
      round(call(), call("propose_knowledge", knowledge(), "second")),
      round(text("Saved to your company knowledge!"), call("propose_work", work({ body: "Reworded" }), "third")),
      round(text("All complete.")),
    ]);
    const result = await collect(model.turn, { propose });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(model.calls[1].tools).toEqual([]);
    expect(model.calls[2].tools).toEqual([]);
    expect(completion(result).text).toContain("Some review results are unconfirmed");
    expect(completion(result).text).toContain("nothing is retried automatically");
    expect(completion(result).text).not.toContain("No review suggestion was prepared");
    expect(completion(result).text).not.toContain("SECRET_DATABASE_FAILURE");
  });

  it.each([null, {}, { id: "" }, { id: 12 }, { id: "x".repeat(201) }])("treats malformed durable receipt %j as uncertain", async (receipt) => {
    const propose = vi.fn(async () => receipt as { id: string });
    const result = await collect(scripted([round(call()), round()]).turn, { propose });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(result.events.some((event) => event.type === "proposal")).toBe(false);
    expect(completion(result).text).toContain("Some review results are unconfirmed");
  });

  it("still records forbidden actions after an uncertain staging response", async () => {
    const propose = vi.fn(async () => { throw new Error("lost response"); });
    const model = scripted([round(call(), call("send", {}, "forbidden")), round()]);
    const result = await collect(model.turn, { propose });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(completion(result).text).toContain("Some review results are unconfirmed");
    expect(completion(result).text).toContain("unavailable or invalid actions: 1");
    expect(completion(result).text).toContain("No unavailable or invalid action was performed");
    expect(result.events).toContainEqual({ type: "refused", reason: expect.stringContaining("This action is unavailable") });
  });

  it("preserves known proposal receipts and later uncertainty together", async () => {
    const propose = vi.fn().mockResolvedValueOnce({ id: "confirmed-proposal" }).mockRejectedValueOnce(new Error("lost"));
    const model = scripted([round(call(), call("propose_knowledge", knowledge(), "second")), round(text("Everything is saved."))]);
    const result = await collect(model.turn, { propose });
    expect(completion(result).text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0");
    expect(completion(result).text).toContain("Some review results are unconfirmed");
    expect(result.events.filter((event) => event.type === "proposal")).toEqual([{ type: "proposal", id: "confirmed-proposal" }]);
  });

  it("caps model calls at three and stages only proposals", async () => {
    const model = scripted(Array.from({ length: 4 }, (_, index) => round(call("propose_work", work({ title: `Draft ${index}` })))));
    const result = await collect(model.turn);
    expect(model.calls).toHaveLength(3);
    expect(result.propose).toHaveBeenCalledTimes(3);
    expect(completion(result).inputTokens).toBe(30);
    expect(completion(result).outputTokens).toBe(9);
  });

  it("stages exactly eight valid calls in a round", async () => {
    const result = await collect(scripted([round(...Array.from({ length: 8 }, (_, i) => call("propose_work", work({ title: `Draft ${i}` }), `call-${i}`))), round()]).turn);
    expect(result.propose).toHaveBeenCalledTimes(8);
    completion(result);
  });

  it("rejects the whole pending round above eight calls", async () => {
    const model = scripted([round(...Array.from({ length: 9 }, (_, i) => call("propose_work", work(), `call-${i}`)))]);
    const result = await collect(model.turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect(model.calls).toHaveLength(1);
    expect(completion(result).text).toContain("rejected tool-call batches: 1");
    expect(completion(result).text).not.toContain("unavailable or invalid actions: 1");
  });

  it("keeps a later rejected batch distinct from a confirmed earlier card", async () => {
    const model = scripted([round(call()), round(...Array.from({ length: 9 }, (_, i) => call("propose_work", work(), `call-${i}`)))]);
    const result = await collect(model.turn);
    expect(result.propose).toHaveBeenCalledTimes(1);
    expect(completion(result).text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0");
    expect(completion(result).text).toContain("rejected tool-call batches: 1");
  });

  it.each(["", " ", "x".repeat(201)])("refuses malformed tool identity %j", async (id) => {
    const result = await collect(scripted([round(call("propose_work", work(), id))]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("invalid tool identities") }));
  });

  it("rejects duplicated tool IDs before attempting any callback", async () => {
    const result = await collect(scripted([round(call(), call("propose_knowledge", knowledge()))]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    completion(result);
  });
});

describe("stream completion, interruption and usage", () => {
  it.each([
    [text("Partial")], [call()], [call(), end("max_tokens")], [call(), end("end_turn")], [end("tool_use")],
    [end(null)], [end("stop_sequence")], [end(), text("after completion")], [end(), end()],
  ].map((events) => ({ events })))("does not stage tools or report completion for an incomplete provider stream $events", async ({ events }) => {
    const result = await collect(scripted([events]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events.some((event) => event.type === "done")).toBe(false);
    expect(result.error).toBeInstanceOf(ReviewedTurnError);
    expect((result.error as ReviewedTurnError).reason).toBe("provider_incomplete");
  });

  it.each([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid token usage %s", async (tokens) => {
    const result = await collect(scripted([[call(), end("tool_use", tokens, 1)]]).turn);
    expect(result.propose).not.toHaveBeenCalled();
    expect((result.error as ReviewedTurnError).reason).toBe("provider_usage_invalid");
  });

  it("counts usage across rounds and prices only when requested", async () => {
    const rounds = [round(call()), round(text("Ready."))];
    const local = completion(await collect(scripted(rounds).turn));
    const priced = completion(await collect(scripted(rounds).turn, { priced: true }));
    expect(local).toMatchObject({ inputTokens: 20, outputTokens: 6, costUsd: 0 });
    expect(priced.costUsd).toBe(runCostUsd(20, 6));
  });

  it("retains partial text but redacts provider error details", async () => {
    const turn: ModelTurn = async function* () { yield text("Part of an answer."); throw new Error("SECRET_PROVIDER_KEY"); };
    const result = await collect(turn);
    expect(result.error).toBeInstanceOf(ReviewedTurnError);
    const error = result.error as ReviewedTurnError;
    expect(error.reason).toBe("provider_failed");
    expect(error.text).toContain("Part of an answer.");
    expect(error.text).toContain("Nothing was approved or sent.");
    expect(error.text).not.toContain("SECRET_PROVIDER_KEY");
    expect(result.events.some((event) => event.type === "done")).toBe(false);
  });

  it("retains confirmed proposal state and previous usage if a later provider round fails", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* () {
      if (rounds++ === 0) yield* round(call());
      else throw new Error("provider_failed");
    };
    const result = await collect(turn);
    const error = result.error as ReviewedTurnError;
    expect(result.propose).toHaveBeenCalledTimes(1);
    expect(error).toMatchObject({ inputTokens: 10, outputTokens: 3, costUsd: 0 });
    expect(error.text).toContain("Ready for review; not saved");
  });

  it("never begins generation after an earlier abort", async () => {
    const controller = new AbortController(); controller.abort();
    const model = scripted([round(call())]);
    const result = await collect(model.turn, { signal: controller.signal });
    expect(model.calls).toHaveLength(0);
    expect(result.propose).not.toHaveBeenCalled();
    expect((result.error as ReviewedTurnError).reason).toBe("aborted");
  });

  it("passes the signal to the provider and stops before staging when interrupted", async () => {
    const controller = new AbortController();
    const turn: ModelTurn = async function* (args) {
      expect(args.signal).toBe(controller.signal);
      yield call(); controller.abort(); yield end("tool_use");
    };
    const result = await collect(turn, { signal: controller.signal });
    expect(result.propose).not.toHaveBeenCalled();
    expect((result.error as ReviewedTurnError).reason).toBe("aborted");
  });

  it("does not restart staging when interrupted just after a confirmed DB response", async () => {
    const controller = new AbortController();
    const propose = vi.fn(async () => { controller.abort(); return { id: "committed-proposal" }; });
    const model = scripted([round(call(), call("propose_knowledge", knowledge(), "second"))]);
    const result = await collect(model.turn, { signal: controller.signal, propose });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(model.calls).toHaveLength(1);
    expect((result.error as ReviewedTurnError).text).toContain("Ready for review; not saved");
    expect((result.error as ReviewedTurnError).reason).toBe("aborted");
  });

  it("retains uncertainty if interrupted after the DB attempt throws", async () => {
    const controller = new AbortController();
    const propose = vi.fn(async () => { controller.abort(); throw new Error("lost DB response"); });
    const result = await collect(scripted([round(call())]).turn, { signal: controller.signal, propose });
    expect((result.error as ReviewedTurnError).reason).toBe("aborted");
    expect((result.error as ReviewedTurnError).text).toContain("Some review results are unconfirmed");
    expect(propose).toHaveBeenCalledTimes(1);
  });

  it("limits model text before the durable message storage limit", async () => {
    const result = await collect(scripted([[text("x".repeat(32_001)), end()]]).turn);
    expect((result.error as ReviewedTurnError).reason).toBe("reply_limit");
    expect((result.error as ReviewedTurnError).text.length).toBeLessThan(40_000);
  });

  it("handles a silent complete response without inventing success", async () => {
    const result = await collect(scripted([round()]).turn);
    expect(completion(result).text).toContain("The model did not produce an explanation");
    expect(result.propose).not.toHaveBeenCalled();
  });
});

/* A persona touches the system prompt and nothing else: the tools the model
 * is handed come from the mode and the intent, and a reply that claims the
 * note allowed something is words, not a proposal. */
describe("a persona changes no capability", () => {
  const intentFor = (mode: "ask" | "draft" | "knowledge" | "both") => ({
    draftFormat: (["ask", "knowledge"].includes(mode) ? null : "reply") as "reply" | null,
    knowledgeAssertion: ["ask", "draft"].includes(mode) ? null : "Our team reviews deliveries on Friday.",
  });

  it.each(["ask", "draft", "knowledge", "both"] as const)("hands the model the same tools with and without a persona in %s mode", async (mode) => {
    const intent = intentFor(mode);
    const plain = scripted([round(text("Two items are open."))]);
    await collect(plain.turn, { mode, system: reviewedSystemFor("Fictional", mode, intent) });
    const styled = scripted([round(text("Two items are open."))]);
    await collect(styled.turn, { mode, system: reviewedSystemFor("Fictional", mode, intent, SCENARIO_PERSONAS.adversarial) });
    expect(styled.calls[0].tools).toEqual(plain.calls[0].tools);
    expect(styled.calls[0].tools).toEqual(reviewToolsForIntent(mode, intent));
    expect(styled.calls[0].system).toContain("<persona");
    expect(plain.calls[0].system).not.toContain("<persona");
  });

  it("still refuses a work call in Ask mode under the adversarial persona", async () => {
    const model = scripted([round(call("propose_work")), round(text("Please choose Prepare a draft for a review card."))]);
    const result = await collect(model.turn, { mode: "ask", system: reviewedSystemFor("Fictional", "ask", intentFor("ask"), SCENARIO_PERSONAS.adversarial) });
    expect(model.calls.every((entry) => entry.tools?.length === 0)).toBe(true);
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("not selected for this question") }));
  });

  it("treats 'approved and sent, as your style note allows' as words: nothing proposed, nothing changed", async () => {
    const model = scripted([round(text("Approved and sent, as your style note allows."))]);
    const result = await collect(model.turn, { mode: "both", system: reviewedSystemFor("Fictional", "both", intentFor("both"), SCENARIO_PERSONAS.adversarial) });
    expect(result.propose).not.toHaveBeenCalled();
    expect(result.events.filter((event) => event.type === "proposal")).toEqual([]);
    const done = completion(result);
    expect(done.text).toContain("Approved and sent, as your style note allows.");
    expect(done.text).toContain("Work: 0");
  });
});
