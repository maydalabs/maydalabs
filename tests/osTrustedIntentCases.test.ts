import { describe, expect, it } from "vitest";
import { OS_TRUSTED_INTENT_CASES, OS_TRUSTED_INTENT_VERSION } from "../lib/osTrustedIntentCases";
import { parseReviewRequestIntent } from "../lib/osReviewIntent";
import { plannedTrustedIntentCases } from "./helpers/osTrustedIntentHarness";

describe("separate trusted-intent candidate", () => {
  it("has six stable, fictional and distinct prompts with explicit typed choices", () => {
    expect(OS_TRUSTED_INTENT_VERSION).toMatch(/^2026-09-29\.trusted-intent\.2$/);
    expect(plannedTrustedIntentCases()).toBe(OS_TRUSTED_INTENT_CASES);
    expect(OS_TRUSTED_INTENT_CASES.map((item) => item.id)).toEqual(
      Array.from({ length: 6 }, (_, index) => `trusted-${String(index + 1).padStart(2, "0")}`),
    );
    expect(new Set(OS_TRUSTED_INTENT_CASES.map((item) => item.fixture.founderMessage)).size).toBe(6);
    for (const item of OS_TRUSTED_INTENT_CASES) {
      expect(parseReviewRequestIntent(item.typedIntent, item.mode)).toEqual(item.typedIntent);
      expect(item.fixture.company.name).toBe("Morrow Ledger");
      expect(item.fixture.founderMessage.length).toBeGreaterThan(50);
      expect(item.fixture.founderMessage).not.toContain(item.id);
      expect(item.fixture.founderMessage).not.toContain("expected");
      expect(item.humanReview.length).toBeGreaterThanOrEqual(2);
      for (const type of ["work", "knowledge"] as const) {
        const [minimum, maximum] = item.expected.proposalCounts[type];
        expect(minimum).toBeGreaterThanOrEqual(0);
        expect(maximum).toBeGreaterThanOrEqual(minimum);
        expect(maximum).toBeLessThanOrEqual(1);
      }
    }
  });

  it("covers discussion, typed draft, asserted knowledge, quoted non-assertion, existing Work, and mixed request", () => {
    const [ask, draft, asserted, unasserted, existing, mixed] = OS_TRUSTED_INTENT_CASES;
    expect([ask.mode, draft.mode, asserted.mode, unasserted.mode, existing.mode, mixed.mode])
      .toEqual(["ask", "draft", "knowledge", "knowledge", "draft", "both"]);
    expect(ask.expected.proposalCounts).toEqual({ work: [0, 0], knowledge: [0, 0] });
    expect(draft.typedIntent.draftFormat).toBe("email");
    expect(draft.expected.proposalCounts.work).toEqual([1, 1]);
    expect(asserted.typedIntent.knowledgeAssertion).toContain("Lantern Run project");
    expect(asserted.fixture.founderMessage).not.toContain(asserted.typedIntent.knowledgeAssertion);
    expect(asserted.expected.proposalCounts.knowledge).toEqual([1, 1]);
    expect(unasserted.typedIntent.knowledgeAssertion).toBeNull();
    expect(unasserted.expected.proposalCounts.knowledge).toEqual([0, 0]);
    expect(existing.fixture.openWork).toHaveLength(1);
    expect(existing.fixture.openWork?.[0].required_action).toBe("send");
    expect(existing.expected.proposalCounts.work).toEqual([0, 0]);
    expect(mixed.typedIntent.draftFormat).toBe("reply");
    expect(mixed.typedIntent.knowledgeAssertion).toContain("North Loft pilot");
    expect(mixed.fixture.founderMessage).not.toContain(mixed.typedIntent.knowledgeAssertion);
    expect(mixed.expected.proposalCounts).toEqual({ work: [1, 1], knowledge: [1, 1] });
  });
});
