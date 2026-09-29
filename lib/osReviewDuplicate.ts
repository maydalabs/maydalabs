import type { Db } from "@/lib/osCofounder";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import type { ReviewProposalRefusal } from "@/lib/osReviewGuard";

/** Read-only preflight. The SQL save guard repeats this under the company
 * lock for concurrent review saves. Exact bytes only: this is not semantic
 * deduplication, and a read alone never proves a later transaction is safe. */
export async function rejectExistingOpenWork(db: Db, companyId: string, payload: ProposalPayload): Promise<ReviewProposalRefusal | null> {
  if (payload.type !== "work") return null;
  const { data, error } = await db.from("os_work_items").select("id")
    .eq("company_id", companyId).eq("notes", payload.body)
    .not("status", "in", "(completed,canceled)").limit(1);
  if (error || !Array.isArray(data)) throw new Error("review_duplicate_check_unavailable");
  return data.length ? { rejected: "duplicate_work" } : null;
}
