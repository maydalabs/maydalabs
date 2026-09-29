import { describe, expect, it } from "vitest";
import { buildReviewReceipt, REVIEW_RECEIPT_NO_SAVE, REVIEW_RECEIPT_READY, type ReviewReceiptInput, type ReviewReceiptKind } from "@/lib/osReviewReceipt";

const noStaged = { work: 0, knowledge: 0 };
const refusal = (kind: ReviewReceiptKind, message = "This attempt was not staged.") => ({ kind, message });

describe("trusted current-state review receipt", () => {
  it("reports no suggestions and preserves the no-save/no-send boundary", () => {
    const result = buildReviewReceipt({ staged: noStaged });
    expect(result.text).toContain("Confirmed review suggestions — Work: 0; company knowledge: 0.");
    expect(result.text).toContain(REVIEW_RECEIPT_NO_SAVE);
    expect(result.text).toContain("Nothing was published.");
    expect(result.text).not.toContain("rejected");
    expect(result.stagingBlocked).toBe(false);
  });

  it.each([
    [{ work: 1, knowledge: 0 }, "Work: 1; company knowledge: 0"],
    [{ work: 0, knowledge: 1 }, "Work: 0; company knowledge: 1"],
    [{ work: 2, knowledge: 3 }, "Work: 2; company knowledge: 3"],
  ])("reports distinct confirmed per-type counts %j", (staged, text) => {
    const result = buildReviewReceipt({ staged });
    expect(result.text).toContain(text);
    expect(result.text).toContain(REVIEW_RECEIPT_READY);
    expect(result.text).not.toContain("No review suggestion was prepared");
    expect(result.stagingBlocked).toBe(false);
  });

  it("keeps earlier same-type rejection historical after a success", () => {
    const result = buildReviewReceipt({ staged: { work: 1, knowledge: 0 }, historicalRefusals: [refusal("work", "Nothing was staged. Use kind=email and outwardAction=send.")] });
    expect(result.text).toContain(REVIEW_RECEIPT_READY);
    expect(result.text).toContain("Earlier rejected attempts — Work: 1.");
    expect(result.text).toContain("historical attempt counts, not the current status of any card");
    expect(result.text).not.toContain("Nothing was staged");
    expect(result.text).not.toContain("outwardAction");
    expect(result.stagingBlocked).toBe(false);
  });

  it("does not describe partial Work success as knowledge success", () => {
    const result = buildReviewReceipt({ staged: { work: 1, knowledge: 0 }, historicalRefusals: [refusal("knowledge", "No founder assertion was supplied.")] });
    expect(result.text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0.");
    expect(result.text).toContain("Earlier rejected attempts — company knowledge: 1.");
    expect(result.text).not.toContain("No founder assertion was supplied");
    expect(result.text).not.toContain("all suggestions");
  });

  it("does not erase a distinct failed same-type attempt when another succeeded", () => {
    const result = buildReviewReceipt({ staged: { work: 1, knowledge: 1 }, historicalRefusals: [refusal("work"), refusal("work"), refusal("knowledge")] });
    expect(result.text).toContain("Earlier rejected attempts — Work: 2; company knowledge: 1.");
    expect(result.text).toContain("Ready cards do not mean every attempt succeeded.");
    expect(result.text).not.toMatch(/all (?:attempts|suggestions) (?:succeeded|ready|recovered)/i);
  });

  it("counts repeated rejected attempts instead of deduplicating messages", () => {
    const result = buildReviewReceipt({ staged: noStaged, historicalRefusals: [refusal("knowledge"), refusal("knowledge"), refusal("knowledge")] });
    expect(result.text).toContain("Earlier rejected attempts — company knowledge: 3.");
    expect(result.text).toContain(REVIEW_RECEIPT_NO_SAVE);
  });

  it("keeps unavailable and invalid actions visible without implying execution", () => {
    const result = buildReviewReceipt({ staged: { work: 1, knowledge: 0 }, historicalRefusals: [refusal("action", "Execute transfer for model-id-123"), refusal("action", "Approve work-id-456")] });
    expect(result.text).toContain("unavailable or invalid actions: 2");
    expect(result.text).toContain("No unavailable or invalid action was performed.");
    expect(result.text).not.toContain("model-id");
    expect(result.text).not.toContain("work-id");
    expect(result.stagingBlocked).toBe(false);
  });

  it("does not drop a malformed refusal classification", () => {
    const input = { staged: noStaged, historicalRefusals: [{ kind: "execute", message: "invalid action" }] } as unknown as ReviewReceiptInput;
    expect(buildReviewReceipt(input).text).toContain("unavailable or invalid actions: 1");
  });

  it("reports rejected whole batches separately from individual refused actions", () => {
    const result = buildReviewReceipt({ staged: { work: 1, knowledge: 0 }, rejectedBatches: 2,
      historicalRefusals: [refusal("work"), refusal("action")] });
    expect(result.text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0.");
    expect(result.text).toContain("Earlier rejected attempts — Work: 1; unavailable or invalid actions: 1.");
    expect(result.text).toContain("Earlier rejected tool-call batches: 2. No calls from those batches were staged.");
    expect(result.text).toContain(REVIEW_RECEIPT_READY);
    expect(result.stagingBlocked).toBe(false);
  });

  it("does not manufacture action counts from an entirely rejected batch", () => {
    const result = buildReviewReceipt({ staged: noStaged, rejectedBatches: 1 });
    expect(result.text).toContain("Earlier rejected tool-call batches: 1. No calls from those batches were staged.");
    expect(result.text).toContain(REVIEW_RECEIPT_NO_SAVE);
    expect(result.text).not.toContain("unavailable or invalid actions");
    expect(result.text).not.toContain("Earlier rejected attempts");
  });

  it("omits absent or zero rejected batch counts", () => {
    expect(buildReviewReceipt({ staged: noStaged, rejectedBatches: 0 })).toEqual(buildReviewReceipt({ staged: noStaged }));
  });

  it("keeps rejected batches distinct from another unconfirmed write", () => {
    const result = buildReviewReceipt({ staged: { work: 1, knowledge: 0 }, rejectedBatches: 1, uncertain: true });
    expect(result.text).toContain("Some review results are unconfirmed.");
    expect(result.text).toContain("No calls from those batches were staged.");
    expect(result.text).not.toContain(REVIEW_RECEIPT_NO_SAVE);
    expect(result.text).not.toContain(REVIEW_RECEIPT_READY);
    expect(result.stagingBlocked).toBe(true);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1", null])("fails closed on invalid rejected batch count %j", (invalid) => {
    const input = { staged: { work: 1, knowledge: 0 }, rejectedBatches: invalid } as unknown as ReviewReceiptInput;
    const result = buildReviewReceipt(input);
    expect(result.text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0.");
    expect(result.text).toContain("Rejected tool-call batch count is unavailable.");
    expect(result.text).not.toContain(REVIEW_RECEIPT_NO_SAVE);
    expect(result.text).not.toContain(REVIEW_RECEIPT_READY);
    expect(result.stagingBlocked).toBe(true);
  });

  it.each([noStaged, { work: 1, knowledge: 0 }, { work: 1, knowledge: 2 }])("preserves uncertain persistence with confirmed counts %j", (staged) => {
    const result = buildReviewReceipt({ staged, uncertain: true });
    expect(result.stagingBlocked).toBe(true);
    expect(result.text).toContain(`Confirmed review suggestions — Work: ${staged.work}; company knowledge: ${staged.knowledge}.`);
    expect(result.text).toContain("not proof that no suggestion was prepared");
    expect(result.text).toContain("Refresh to check the current state before trying again");
    expect(result.text).toContain("Further staging and retries are blocked");
    expect(result.text).toContain("nothing is retried automatically");
    expect(result.text).toContain("Nothing was approved, sent or published");
    expect(result.text).not.toContain(REVIEW_RECEIPT_NO_SAVE);
    expect(result.text).not.toContain(REVIEW_RECEIPT_READY);
  });

  it("never lets success or historical refusal erase unresolved uncertainty", () => {
    const result = buildReviewReceipt({ staged: { work: 2, knowledge: 1 }, uncertain: true, historicalRefusals: [refusal("work"), refusal("knowledge")] });
    expect(result.stagingBlocked).toBe(true);
    expect(result.text).toContain("Some review results are unconfirmed.");
    expect(result.text).toContain("Earlier rejected attempts — Work: 1; company knowledge: 1.");
    expect(result.text).not.toContain("all results");
  });

  it.each([noStaged, { work: 1, knowledge: 0 }])("reports fatal reply failure independently from confirmed state %j", (staged) => {
    const result = buildReviewReceipt({ staged, fatalWarnings: ["Provider failed for private-model-id"] });
    expect(result.stagingBlocked).toBe(true);
    expect(result.text).toContain("The reply did not finish reliably. Its explanation may be incomplete.");
    expect(result.text).toContain("Refresh to check");
    expect(result.text).not.toContain("private-model-id");
    expect(result.text).toContain(staged.work ? REVIEW_RECEIPT_READY : REVIEW_RECEIPT_NO_SAVE);
  });

  it("does not treat an empty warning list as fatal", () => {
    expect(buildReviewReceipt({ staged: noStaged, fatalWarnings: [], uncertain: false }).stagingBlocked).toBe(false);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("fails closed on invalid confirmed counts %s", (invalid) => {
    const result = buildReviewReceipt({ staged: { work: invalid, knowledge: 0 } });
    expect(result.stagingBlocked).toBe(true);
    expect(result.text).toContain("Confirmed review suggestion counts are unavailable.");
    expect(result.text).not.toContain(REVIEW_RECEIPT_NO_SAVE);
    expect(result.text).not.toContain(REVIEW_RECEIPT_READY);
  });

  it("also validates knowledge counts rather than coercing invalid values", () => {
    const input = { staged: { work: 0, knowledge: "1" } } as unknown as ReviewReceiptInput;
    expect(buildReviewReceipt(input).stagingBlocked).toBe(true);
    expect(buildReviewReceipt(input).text).toContain("counts are unavailable");
  });

  it("has stable output and does not mutate the caller's facts or diagnostics", () => {
    const input: ReviewReceiptInput = {
      staged: { work: 1, knowledge: 0 }, historicalRefusals: [refusal("work", "An old rejection with proposal-123")],
      fatalWarnings: ["Reply interrupted with turn-456"], uncertain: true,
    };
    const snapshot = structuredClone(input);
    Object.freeze(input.staged); Object.freeze(input.historicalRefusals); Object.freeze(input.fatalWarnings); Object.freeze(input);
    expect(buildReviewReceipt(input)).toEqual(buildReviewReceipt(input));
    expect(input).toEqual(snapshot);
    expect(buildReviewReceipt(input).text).not.toContain("proposal-123");
    expect(buildReviewReceipt(input).text).not.toContain("turn-456");
  });
});
