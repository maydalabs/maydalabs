import { describe, expect, it } from "vitest";
import { ReviewedTextGate } from "@/lib/osReviewTextGate";

describe("founder-facing reviewed text gate", () => {
  it("keeps plain prose streaming as chunks arrive", () => {
    const gate = new ReviewedTextGate();
    expect(gate.feed("A useful ")).toEqual(["A useful "]);
    expect(gate.feed("answer.")).toEqual(["answer."]);
    expect(gate.finish()).toEqual([]);
    expect(gate.suppressedToolEcho).toBe(false);
  });

  it("hides a split serialized tool call but preserves the following explanation", () => {
    const gate = new ReviewedTextGate();
    expect(gate.feed('{"name": "propose_')).toEqual([]);
    expect(gate.feed('work", "arguments": {"title": "x"}}\nI could not prepare it.')).toEqual(["I could not prepare it."]);
    expect(gate.finish()).toEqual([]);
    expect(gate.suppressedToolEcho).toBe(true);
  });

  it("hides a response-tagged tool receipt without hiding later prose", () => {
    const gate = new ReviewedTextGate();
    expect(gate.feed("<response>\nReady for review; Proposal ID: proposal-1\n</response>\nThe draft still needs your review.")).toEqual([
      "The draft still needs your review.",
    ]);
    expect(gate.suppressedToolEcho).toBe(true);
  });

  it("does not suppress ordinary JSON discussed as content", () => {
    const gate = new ReviewedTextGate();
    expect(gate.feed('{"sample": true}')).toEqual([]);
    expect(gate.finish()).toEqual(['{"sample": true}']);
    expect(gate.suppressedToolEcho).toBe(false);
  });
});
