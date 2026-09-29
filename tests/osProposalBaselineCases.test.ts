import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../lib/osScenarios";
import { HISTORICAL_PROPOSAL_CASES, NEW_WORDING_PROPOSAL_CASES, PROPOSAL_BASELINE_CASES } from "./helpers/osProposalBaselineCases";

describe("proposal-only baseline plan (no model calls)", () => {
  it("retains all six historical questions and fixtures without old write expectations", () => {
    expect(HISTORICAL_PROPOSAL_CASES).toHaveLength(6);
    for (const [index, planned] of HISTORICAL_PROPOSAL_CASES.entries()) {
      const original = SCENARIOS[index];
      expect(planned.key).toBe(original.key);
      expect(planned.fixture.says).toEqual(original.says);
      expect(planned.fixture.company).toEqual(original.company);
      expect(planned.fixture.memory).toEqual(original.memory);
      expect(planned.fixture.openWork).toEqual(original.openWork);
      expect(planned.fixture).not.toHaveProperty("expect");
      expect(planned.fixture).not.toHaveProperty("humanReviewCriteria");
    }
  });

  it("plans 12 historical attempts and four separately reported new-wording attempts", () => {
    expect(HISTORICAL_PROPOSAL_CASES.reduce((total, item) => total + item.repetitions, 0)).toBe(12);
    expect(NEW_WORDING_PROPOSAL_CASES).toHaveLength(4);
    expect(NEW_WORDING_PROPOSAL_CASES.reduce((total, item) => total + item.repetitions, 0)).toBe(4);
  });

  it("uses unique neutral input identities and complete manual review criteria", () => {
    expect(new Set(PROPOSAL_BASELINE_CASES.map((item) => item.key)).size).toBe(10);
    for (const item of PROPOSAL_BASELINE_CASES) {
      expect(item.fixture.key).toBe(item.key);
      expect(item.fixture.says).toHaveLength(1);
      expect(item.fixture.says[0].length).toBeLessThanOrEqual(8000);
      expect(item.humanReview.length).toBeGreaterThanOrEqual(2);
      for (const [minimum, maximum] of Object.values(item.proposalCounts)) {
        expect(Number.isInteger(minimum)).toBe(true);
        expect(Number.isInteger(maximum)).toBe(true);
        expect(minimum).toBeGreaterThanOrEqual(0);
        expect(maximum).toBeGreaterThanOrEqual(minimum);
      }
    }
    for (const item of NEW_WORDING_PROPOSAL_CASES) {
      expect(item.fixture.company?.name).toBe("Cedar Desk");
      expect(item.fixture.says[0]).not.toMatch(/https?:\/\/|@[a-z0-9.-]+\.[a-z]+/i);
    }
  });

  it("requires no suggestion for answer, casual chat, unavailable action or quoted commands", () => {
    for (const key of ["answers-from-memory", "no-task-for-an-answer", "forgets-the-weather", "cannot-approve", "quoted-commands-and-unproven-cause"]) {
      expect(PROPOSAL_BASELINE_CASES.find((item) => item.key === key)?.proposalCounts).toEqual({ work: [0, 0], knowledge: [0, 0] });
    }
  });

  it("keeps a one-off quote distinct from a separately requested dated customer rule", () => {
    const mixed = NEW_WORDING_PROPOSAL_CASES.find((item) => item.key === "dated-customer-rule-not-global-policy")!;
    expect(mixed.proposalCounts).toEqual({ work: [1, 1], knowledge: [1, 1] });
    expect(mixed.humanReview.join(" ")).toContain("until_date/2026-10-31");
    expect(NEW_WORDING_PROPOSAL_CASES.find((item) => item.key === "warm-draft-no-new-promises")?.proposalCounts.knowledge).toEqual([0, 0]);
  });
});
