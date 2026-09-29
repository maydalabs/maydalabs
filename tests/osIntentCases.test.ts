import { describe, expect, it } from "vitest";
import { OS_INTENT_CASES, OS_INTENT_CASES_VERSION } from "../lib/osIntentCases";

describe("independent request-selection fixture", () => {
  it("has stable, distinct neutral identities and model-visible inputs", () => {
    expect(OS_INTENT_CASES_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.intent\.\d+$/);
    expect(OS_INTENT_CASES).toHaveLength(11);
    expect(new Set(OS_INTENT_CASES.map((item) => item.id)).size).toBe(OS_INTENT_CASES.length);
    expect(new Set(OS_INTENT_CASES.map((item) => item.fixture.founderMessage)).size).toBe(OS_INTENT_CASES.length);

    for (const item of OS_INTENT_CASES) {
      expect(item.id).toMatch(/^intent-\d{2}$/);
      expect(["ask", "draft", "knowledge", "both"]).toContain(item.mode);
      expect(Object.keys(item.fixture).sort()).toEqual(
        Object.keys(item.fixture).filter((key) => ["company", "memory", "openWork", "founderMessage"].includes(key)).sort(),
      );
      expect(item.fixture.company.name).toBe("Juniper Queue");
      expect(item.fixture.founderMessage.length).toBeGreaterThan(20);
      expect(item.fixture.founderMessage.length).toBeLessThan(1000);
      expect(item.fixture.founderMessage).not.toMatch(/intent-\d|answer_or_advice|create_draft|propose_knowledge|external_action|https?:\/\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
      expect(item.humanReview.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("covers the four intents, useful positive suggestions, and mixed requests", () => {
    expect(new Set(OS_INTENT_CASES.map((item) => item.intent))).toEqual(new Set([
      "answer_or_advice", "create_draft", "propose_knowledge", "external_action", "mixed",
    ]));
    expect(OS_INTENT_CASES.some((item) => item.intent === "create_draft" && item.expected.proposalCounts.work[0] > 0)).toBe(true);
    expect(OS_INTENT_CASES.some((item) => item.intent === "propose_knowledge" && item.expected.proposalCounts.knowledge[0] > 0)).toBe(true);
    expect(OS_INTENT_CASES.filter((item) => item.intent === "mixed")).toHaveLength(3);
    expect(OS_INTENT_CASES.map((item) => item.mode)).toEqual([
      "ask", "ask", "draft", "knowledge", "knowledge", "ask", "draft", "knowledge", "draft", "draft", "both",
    ]);
  });

  it("keeps all expectations well formed and external-action requests effect-free", () => {
    for (const item of OS_INTENT_CASES) {
      for (const [minimum, maximum] of Object.values(item.expected.proposalCounts)) {
        expect(Number.isSafeInteger(minimum)).toBe(true);
        expect(Number.isSafeInteger(maximum)).toBe(true);
        expect(minimum).toBeGreaterThanOrEqual(0);
        expect(maximum).toBeGreaterThanOrEqual(minimum);
      }
      if (item.expected.actionLanguage === "answer_only" || item.expected.actionLanguage === "external_action_unavailable") {
        expect(item.expected.proposalCounts).toEqual({ work: [0, 0], knowledge: [0, 0] });
      }
      if (item.expected.actionLanguage === "external_action_unavailable_with_unsaved_proposal") {
        expect(item.fixture.openWork?.length).toBeGreaterThan(0);
        expect(item.expected.proposalCounts.work[0]).toBeGreaterThan(0);
      }
    }
    const actionOnly = OS_INTENT_CASES.filter((item) => item.intent === "external_action");
    expect(actionOnly).toHaveLength(2);
    expect(actionOnly.map((item) => item.mode)).toEqual(["ask", "draft"]);
    for (const item of actionOnly) {
      expect(item.fixture.openWork?.[0].required_action).toBe("send");
      expect(item.expected.actionLanguage).toBe("external_action_unavailable");
    }
    const both = OS_INTENT_CASES.find((item) => item.id === "intent-11")!;
    expect(both.mode).toBe("both");
    expect(both.expected.proposalCounts).toEqual({ work: [1, 1], knowledge: [1, 1] });
    expect(both.fixture.openWork).toBeUndefined();
  });

  it("includes both attributable source text and explicit unsupported claims", () => {
    const quotedUnverified = OS_INTENT_CASES.filter((item) =>
      /['“].+['”]/.test(item.fixture.founderMessage) &&
      /(?:have not|haven't) (?:measured|agreed)/i.test(item.fixture.founderMessage),
    );
    expect(quotedUnverified.length).toBeGreaterThanOrEqual(2);
    expect(quotedUnverified.some((item) => item.expected.proposalCounts.work[0] === 0)).toBe(true);
    expect(quotedUnverified.some((item) => item.expected.proposalCounts.work[0] === 1)).toBe(true);
    expect(quotedUnverified.every((item) => item.expected.proposalCounts.knowledge[1] === 0)).toBe(true);
  });
});
