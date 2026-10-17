import "server-only";
import type { Db } from "@/lib/osCofounder";
import { MEMORY_REVIEW_COLUMNS, inspectMemoryReview, memoryCandidateFilter, memoryRows } from "@/lib/osReviewedMemory";
import { RUN_LIMITS } from "@/lib/osAgentRunTypes";
import type { RunEvent, RunMemoryRow, WorkRow } from "@/lib/osAgentRunTools";

/* What a run reads, through the admin client.
 *
 * The admin client sees exactly what a member sees here only because the
 * read policies on os_work_items, os_company_memory and os_review_proposals
 * are pure os_is_member: scoped by the run row's company_id — never by model
 * input — these reads return the member's own view. A future read over a
 * table with a narrower policy must not use this client. Membership is also
 * re-checked under the company lock by every run RPC that writes.
 *
 * os_work_item_events has no company_id column. Its read is scoped by the
 * capture's item_id, which os_agent_run_read already checked belongs to the
 * company, inside its lock (tests/osAgentRunReads.test.ts pins every column
 * selected here to the generated schema).
 *
 * Filtering, refs and formatting are in lib/osAgentRunTools.ts, pure, so the
 * loop owns them and the twin exercises the same code.
 */

export const SEARCH_COLUMNS = "id, title, lane, kind, status, required_action, due_on, notes, updated_at";
export const EVENT_COLUMNS = "event, at, actor";
export const OPEN_CARD_COLUMNS = "payload";
export const CAPTURE_ITEM_COLUMNS = "id, item_id";

const READ = /^read:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export async function searchRecord(admin: Db, companyId: string, timeoutMs: number): Promise<{ rows: WorkRow[]; openTotal: number | null }> {
  const { data, error, count } = await admin.from("os_work_items").select(SEARCH_COLUMNS, { count: "exact" })
    .eq("company_id", companyId).not("status", "in", "(completed,canceled)")
    .order("updated_at", { ascending: true }).limit(RUN_LIMITS.searchScan)
    .abortSignal(AbortSignal.timeout(timeoutMs));
  if (error || !Array.isArray(data)) throw new Error("agent_run_read_unavailable");
  return { rows: data, openTotal: count };
}

export async function readEvents(admin: Db, itemId: string, timeoutMs: number): Promise<RunEvent[]> {
  const { data, error } = await admin.from("os_work_item_events").select(EVENT_COLUMNS)
    .eq("item_id", itemId).order("at", { ascending: false }).limit(5)
    .abortSignal(AbortSignal.timeout(timeoutMs));
  if (error || !Array.isArray(data)) throw new Error("agent_run_read_unavailable");
  return data;
}

/** Current company knowledge as the co-founder's context reads it: unretired,
 * legacy or reviewed and not expired. Not citable by a run card in v1. */
export async function listMemory(admin: Db, companyId: string, today: string, timeoutMs: number): Promise<{ rows: RunMemoryRow[]; complete: boolean }> {
  const { data, error, count } = await admin.from("os_company_memory").select(MEMORY_REVIEW_COLUMNS, { count: "exact" })
    .eq("company_id", companyId).is("retired_at", null).or(memoryCandidateFilter(today))
    .order("created_at", { ascending: false }).limit(RUN_LIMITS.memoryScan)
    .abortSignal(AbortSignal.timeout(timeoutMs));
  if (error || !Array.isArray(data)) throw new Error("agent_run_read_unavailable");
  const rows = memoryRows(data).flatMap((row): RunMemoryRow[] => {
    const review = inspectMemoryReview(row, today);
    if (review.state === "invalid" || (review.state === "reviewed" && review.expired)) return [];
    return [{ kind: row.kind, fact: row.fact, source: row.source, reviewed: review.state === "reviewed", scope: review.state === "reviewed" ? review.scope.label : null }];
  });
  return { rows, complete: count !== null && count <= data.length };
}

/** Items with an undecided run card: proposals still 'proposed', mapped
 * through their record citation to the capture's item. Bounded scans. */
export async function openCardItems(admin: Db, companyId: string, timeoutMs: number): Promise<ReadonlySet<string>> {
  const { data, error } = await admin.from("os_review_proposals").select(OPEN_CARD_COLUMNS)
    .eq("company_id", companyId).eq("status", "proposed").order("created_at", { ascending: false }).limit(RUN_LIMITS.openCardScan)
    .abortSignal(AbortSignal.timeout(timeoutMs));
  if (error || !Array.isArray(data)) throw new Error("agent_run_read_unavailable");
  const captureIds = data.flatMap((row) => {
    const citations = (row.payload as { citations?: { sourceId?: unknown }[] } | null)?.citations;
    const match = Array.isArray(citations) && typeof citations[1]?.sourceId === "string" ? READ.exec(citations[1].sourceId) : null;
    return match ? [match[1]] : [];
  });
  if (!captureIds.length) return new Set();
  const captures = await admin.from("os_agent_run_reads").select(CAPTURE_ITEM_COLUMNS)
    .eq("company_id", companyId).in("id", captureIds).abortSignal(AbortSignal.timeout(timeoutMs));
  if (captures.error || !Array.isArray(captures.data)) throw new Error("agent_run_read_unavailable");
  return new Set(captures.data.map((capture) => capture.item_id));
}
