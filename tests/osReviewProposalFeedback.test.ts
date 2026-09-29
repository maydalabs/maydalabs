import { describe, expect, it } from "vitest";
import { parseReviewProposal } from "@/lib/osReviewBoundary";
import { invalidKnowledgeProposalFeedback, invalidWorkProposalFeedback } from "@/lib/osReviewProposalFeedback";

const valid = () => ({
  statement: "Replacement-parts quotes need a manual stock check.",
  kind: "constraint",
  scope: { type: "customer", label: "Example customer" },
  duration: { type: "until_date", date: "2026-11-30" },
  citations: [{ sourceId: "founder-message", quote: "manual stock check" }],
});

describe("invalid Work proposal feedback", () => {
  it("names missing required fields without repeating model-supplied text", () => {
    const feedback = invalidWorkProposalFeedback({ title: "Customer reply", body: "PRIVATE_MODEL_CONTENT" });
    expect(feedback).toContain("One proposal attempt");
    expect(feedback).toContain("lane, kind, outwardAction, citations");
    expect(feedback).not.toContain("PRIVATE_MODEL_CONTENT");
  });

  it("keeps extra model-owned fields refused, without trying to repair them", () => {
    const feedback = invalidWorkProposalFeedback({
      title: "Customer reply", body: "Hello.", lane: "sales", kind: "reply", outwardAction: "send",
      citations: [{ sourceId: "source", quote: "source" }], approved: true,
    });
    expect(feedback).toContain("unsupported extra fields");
  });
});

describe("strict Knowledge proposal feedback", () => {
  it("identifies an invalid duration without accepting or converting it", () => {
    for (const duration of [{ until: "2026-11-30" }, { from: "2026-09-23", until: "2026-11-30" },
      { type: "until_date", date: "2026-02-30" }, { type: "until_changed", date: "2026-11-30" }]) {
      const input = { ...valid(), duration };
      expect(parseReviewProposal({ type: "knowledge", ...input })).toBeNull();
      const message = invalidKnowledgeProposalFeedback(input);
      expect(message).toContain("One knowledge proposal attempt was not staged");
      expect(message).toContain('duration to exactly {type: "until_changed"} or {type: "until_date", date: "YYYY-MM-DD"}');
      expect(message).not.toContain("Set kind");
      expect(message).not.toContain("Set scope");
    }
  });

  it("reports all independently malformed fields in a single bounded response", () => {
    const input = { ...valid(), kind: undefined, scope: { label: "Example customer" }, duration: { until: "2026-11-30" } };
    expect(parseReviewProposal({ type: "knowledge", ...input })).toBeNull();
    const message = invalidKnowledgeProposalFeedback(input);
    expect(message).toContain("Set kind");
    expect(message).toContain("Set scope");
    expect(message).toContain("Set duration");
    expect(message.length).toBeLessThan(500);
  });

  it("does not echo private or model-controlled text", () => {
    const secret = "DO_NOT_REPEAT_THIS_PRIVATE_VALUE";
    const input = { ...valid(), statement: secret, kind: secret, scope: { type: secret, label: secret }, duration: { until: secret }, citations: [{ sourceId: secret, quote: secret }] };
    expect(invalidKnowledgeProposalFeedback(input)).not.toContain(secret);
    expect(invalidKnowledgeProposalFeedback(secret)).not.toContain(secret);
  });

  it("falls back to other review details when kind, scope, and duration are valid", () => {
    expect(invalidKnowledgeProposalFeedback({ ...valid(), citations: [] })).toContain("Check statement, citations, and unsupported extra fields");
    expect(invalidKnowledgeProposalFeedback({ ...valid(), approved: true })).toContain("Check statement, citations, and unsupported extra fields");
    expect(invalidKnowledgeProposalFeedback(valid())).toContain("Check statement, citations, and unsupported extra fields");
  });
});
