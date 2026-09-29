import { describe, expect, it } from "vitest";
import { OS_INTENT_HELDOUT_CASES, OS_INTENT_HELDOUT_VERSION } from "../lib/osIntentHeldoutCases";
import { intentContextFixture, modeForIntentCase } from "./helpers/osIntentHarness";

describe("independent fictional intent holdout plan", () => {
  it("freezes nine distinct cases and two-pass coverage without case selection", () => {
    expect(OS_INTENT_HELDOUT_VERSION).toBe("2026-09-27.heldout.1");
    expect(OS_INTENT_HELDOUT_CASES.map((item) => item.id)).toEqual(
      Array.from({ length: 9 }, (_, index) => `heldout-${String(index + 1).padStart(2, "0")}`),
    );
    expect(OS_INTENT_HELDOUT_CASES.map(modeForIntentCase)).toEqual([
      "ask", "ask", "draft", "draft", "knowledge", "knowledge", "draft", "draft", "both",
    ]);
    expect(OS_INTENT_HELDOUT_CASES.map((item) => item.intent)).toEqual([
      "answer_or_advice", "answer_or_advice", "create_draft", "create_draft",
      "propose_knowledge", "propose_knowledge", "external_action", "mixed", "mixed",
    ]);
  });

  it("keeps evaluator expectations outside model-visible fictional context", () => {
    for (const [index, item] of OS_INTENT_HELDOUT_CASES.entries()) {
      expect(item.fixture.company.name).toBeTruthy();
      expect(item.fixture.founderMessage.trim().length).toBeGreaterThan(40);
      expect(item.humanReview.length).toBeGreaterThanOrEqual(3);
      const fixture = intentContextFixture(item, index + 100);
      try {
        const serialized = JSON.stringify({ company: item.fixture.company, question: item.fixture.founderMessage, rows: fixture.snapshot() });
        expect(serialized).not.toContain(item.id);
        expect(serialized).not.toContain(JSON.stringify(item.expected));
        expect(fixture.blockedWrites()).toBe(0);
      } finally {
        fixture.dispose();
        expect(fixture.isDisposed()).toBe(true);
      }
    }
  });

  it("sets explicit proposal count and human-review expectations", () => {
    expect(OS_INTENT_HELDOUT_CASES.map((item) => item.expected.proposalCounts)).toEqual([
      { work: [0, 0], knowledge: [0, 0] },
      { work: [0, 0], knowledge: [0, 0] },
      { work: [1, 1], knowledge: [0, 0] },
      { work: [1, 1], knowledge: [0, 0] },
      { work: [0, 0], knowledge: [1, 1] },
      { work: [0, 0], knowledge: [0, 0] },
      { work: [0, 0], knowledge: [0, 0] },
      { work: [1, 1], knowledge: [0, 0] },
      { work: [1, 1], knowledge: [1, 1] },
    ]);
    for (const item of OS_INTENT_HELDOUT_CASES) {
      expect(item.humanReview.join(" ")).toMatch(/not|no|without|refuse|distinguish/i);
    }
  });
});
