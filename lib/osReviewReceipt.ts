/** A receipt describes trusted proposal state, not model claims. The caller
 * supplies distinct, confirmed staged counts and keeps exact refusal/failure
 * diagnostics in its events/tool history. This helper neither changes model
 * prose nor performs storage, execution or retries. */
export type ReviewReceiptKind = "work" | "knowledge" | "action";
export type ReviewReceiptRefusal = {
  kind: ReviewReceiptKind;
  /** Retained by the caller for diagnostics; never repeated in final prose. */
  message: string;
};
export type ReviewReceiptInput = {
  /** Count distinct confirmed suggestion IDs, not successful tool calls. */
  staged: { work: number; knowledge: number };
  /** One entry per refused attempt; do not deduplicate equivalent messages. */
  historicalRefusals?: readonly ReviewReceiptRefusal[];
  /** Entire tool-call batches rejected before any call in the batch ran. */
  rejectedBatches?: number;
  /** A proposal may exist even when its persistence response was lost. */
  uncertain?: boolean;
  /** Trusted failure diagnostics, retained outside the user-facing receipt. */
  fatalWarnings?: readonly string[];
};
export type ReviewReceipt = { text: string; stagingBlocked: boolean };

export const REVIEW_RECEIPT_NO_SAVE = "No review suggestion was prepared. No Work or company knowledge was saved by this turn. Nothing was approved or sent.";
export const REVIEW_RECEIPT_READY = "Ready for review; not saved to Work/company knowledge, approved or sent.";
const NO_EXECUTION = "No Work or company knowledge was saved by this turn. Nothing was approved, sent or published.";
const RECONCILE = "Refresh to check the current state before trying again. Further staging and retries are blocked until that check; nothing is retried automatically.";

/** Returns an append-only receipt. stagingBlocked is a fail-closed signal for
 * the caller, not an implementation of a storage/retry lock. A type-level
 * success does not prove that another same-type refused attempt was repaired. */
export function buildReviewReceipt(input: ReviewReceiptInput): ReviewReceipt {
  const { work, knowledge } = input.staged;
  const validCounts = [work, knowledge].every((count) => Number.isSafeInteger(count) && count >= 0);
  const rejectedBatches = input.rejectedBatches === undefined ? 0 : input.rejectedBatches;
  const validBatches = Number.isSafeInteger(rejectedBatches) && rejectedBatches >= 0;
  const uncertain = input.uncertain === true || !validCounts || !validBatches;
  const fatal = (input.fatalWarnings?.length ?? 0) > 0;
  const stagingBlocked = uncertain || fatal;
  const lines: string[] = [];

  if (uncertain) {
    lines.push("Some review results are unconfirmed. This is not proof that no suggestion was prepared.");
  }
  lines.push(validCounts
    ? `Confirmed review suggestions — Work: ${work}; company knowledge: ${knowledge}.`
    : "Confirmed review suggestion counts are unavailable.");

  if (uncertain) lines.push(NO_EXECUTION);
  else {
    lines.push(work + knowledge > 0 ? REVIEW_RECEIPT_READY : REVIEW_RECEIPT_NO_SAVE);
    lines.push("Nothing was published.");
  }

  const refused = { work: 0, knowledge: 0, action: 0 };
  for (const refusal of input.historicalRefusals ?? []) {
    // Unknown classifications fail visibly as an invalid action rather than
    // being dropped; only fixed labels and counts reach user-facing prose.
    if (refusal.kind === "work" || refusal.kind === "knowledge") refused[refusal.kind]++;
    else refused.action++;
  }
  const history = [
    ...(refused.work ? [`Work: ${refused.work}`] : []),
    ...(refused.knowledge ? [`company knowledge: ${refused.knowledge}`] : []),
    ...(refused.action ? [`unavailable or invalid actions: ${refused.action}`] : []),
  ];
  if (history.length) {
    lines.push(`Earlier rejected attempts — ${history.join("; ")}.`);
    lines.push("These are historical attempt counts, not the current status of any card. Ready cards do not mean every attempt succeeded.");
  }
  if (refused.action) lines.push("No unavailable or invalid action was performed.");
  if (!validBatches) lines.push("Rejected tool-call batch count is unavailable.");
  else if (rejectedBatches) lines.push(`Earlier rejected tool-call batches: ${rejectedBatches}. No calls from those batches were staged.`);
  if (fatal) lines.push("The reply did not finish reliably. Its explanation may be incomplete.");
  if (stagingBlocked) lines.push(RECONCILE);

  return { text: lines.join("\n"), stagingBlocked };
}
