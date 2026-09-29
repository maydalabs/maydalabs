import { describe, expect, it } from "vitest";
import { isReviewRequestMode, reviewToolsForMode } from "@/lib/osReviewIntent";
import { reviewedSystemFor } from "@/lib/osCofounder";

describe("founder-selected review intent", () => {
  it("accepts only the four named modes", () => {
    expect(["ask", "draft", "knowledge", "both"].every(isReviewRequestMode)).toBe(true);
    for (const value of [undefined, null, "", "send", "approve", [], {}, "ASK"]) {
      expect(isReviewRequestMode(value)).toBe(false);
    }
  });

  it("maps each mode to the least available proposal capability", () => {
    expect(reviewToolsForMode("ask")).toEqual([]);
    expect(reviewToolsForMode("draft")).toEqual(["propose_work"]);
    expect(reviewToolsForMode("knowledge")).toEqual(["propose_knowledge"]);
    expect(reviewToolsForMode("both")).toEqual(["propose_work", "propose_knowledge"]);
  });

  it("makes the selected scope visible to the model without granting execution", () => {
    const ask = reviewedSystemFor("Empty fictional context", "ask");
    const draft = reviewedSystemFor("Empty fictional context", "draft");
    const knowledge = reviewedSystemFor("Empty fictional context", "knowledge");
    const both = reviewedSystemFor("Empty fictional context", "both");
    expect(ask).toContain("selected ASK");
    expect(draft).toContain("selected PREPARE A DRAFT");
    expect(knowledge).toContain("selected SUGGEST COMPANY KNOWLEDGE");
    expect(both).toContain("selected DRAFT AND KNOWLEDGE REVIEW");
    expect(ask).not.toContain("Use propose_work");
    expect(ask).not.toContain("Use propose_knowledge");
    expect(draft).toContain("Use propose_work");
    expect(draft).not.toContain("Use propose_knowledge");
    expect(knowledge).not.toContain("Use propose_work");
    expect(knowledge).toContain("Use propose_knowledge");
    for (const prompt of [ask, draft, knowledge, both]) {
      expect(prompt).toContain("cannot save Work or company knowledge, approve, send, publish or execute");
    }
  });
});
