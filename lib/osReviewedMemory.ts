import type { KnowledgeDuration, KnowledgeScope, ReviewSource, Citation } from "@/lib/osReviewBoundary";

// Explicit JSON decoding keeps untyped/older database responses from turning
// partial review metadata into a global, permanent company rule.
export type MemoryRecord = {
  id: string; fact: string; kind: string; source: string; company_id?: string;
  created_at?: string; retired_reason?: string | null;
  review_scope?: unknown; review_duration?: unknown; review_provenance?: unknown;
  review_proposal_id?: unknown; confirmed_by?: unknown; confirmed_at?: unknown;
};
export type MemoryReview =
  | { state: "legacy" }
  | { state: "invalid" }
  | { state: "reviewed"; expired: boolean; scope: KnowledgeScope; duration: KnowledgeDuration; confirmedBy: string; confirmedAt: string; proposalId: string; sources: ReviewSource[]; citations: Citation[] };

export const MEMORY_REVIEW_COLUMNS = "id, company_id, fact, kind, source, created_at, review_scope, review_duration, review_provenance, review_proposal_id, confirmed_by, confirmed_at";
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function nonempty(value: unknown): value is string { return typeof value === "string" && !!value.trim(); }
function calendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Database-side expiry reduction happens before LIMIT/count. Decode again
 * after reading: JSON filtering is not a substitute for validating metadata. */
export function memoryCandidateFilter(today: string): string {
  if (!calendarDate(today)) throw new Error("Invalid memory read date");
  return `review_duration.is.null,review_duration->>type.eq.until_changed,and(review_duration->>type.eq.until_date,review_duration->>date.gte.${today})`;
}

export function memoryRows(input: unknown): MemoryRecord[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((row): MemoryRecord[] => {
    if (!object(row) || !nonempty(row.id) || typeof row.fact !== "string" || typeof row.kind !== "string" || typeof row.source !== "string") return [];
    return [{ id: row.id, fact: row.fact, kind: row.kind, source: row.source,
      ...(typeof row.company_id === "string" ? { company_id: row.company_id } : {}),
      ...(typeof row.created_at === "string" ? { created_at: row.created_at } : {}),
      ...(typeof row.retired_reason === "string" ? { retired_reason: row.retired_reason } : {}),
      review_scope: row.review_scope, review_duration: row.review_duration, review_provenance: row.review_provenance,
      review_proposal_id: row.review_proposal_id, confirmed_by: row.confirmed_by, confirmed_at: row.confirmed_at,
    }];
  });
}

export function inspectMemoryReview(row: MemoryRecord, today: string): MemoryReview {
  const values = [row.review_scope, row.review_duration, row.review_provenance, row.review_proposal_id, row.confirmed_by, row.confirmed_at];
  if (values.every((value) => value === null || value === undefined)) return { state: "legacy" };
  const invalid = { state: "invalid" as const };
  const scope = row.review_scope;
  const duration = row.review_duration;
  const provenance = row.review_provenance;
  if (!calendarDate(today) || row.source !== "cofounder" || !object(scope) || !object(duration) || !object(provenance) ||
    !["company", "project", "customer"].includes(String(scope.type)) || !nonempty(scope.label) || scope.label.length > 200 ||
    !nonempty(row.review_proposal_id) || !nonempty(row.confirmed_by) || !nonempty(row.confirmed_at) || !Number.isFinite(Date.parse(row.confirmed_at)) ||
    provenance.authorship !== "model" || provenance.externallyVerified !== false || provenance.confirmedBy !== row.confirmed_by || provenance.proposalId !== row.review_proposal_id ||
    !Array.isArray(provenance.sources) || !provenance.sources.length || !Array.isArray(provenance.citations) || !provenance.citations.length || provenance.citations.length > 8) return invalid;
  let validity: KnowledgeDuration;
  if (duration.type === "until_changed" && Object.keys(duration).length === 1) validity = { type: "until_changed" };
  else if (duration.type === "until_date" && Object.keys(duration).length === 2 && calendarDate(duration.date)) validity = { type: "until_date", date: duration.date };
  else return invalid;
  const sources: ReviewSource[] = [];
  for (const source of provenance.sources) {
    if (!object(source) || !nonempty(source.id) || !nonempty(source.companyId) || !nonempty(source.revision) || typeof source.text !== "string" ||
      !["founder", "record", "quoted", "model"].includes(String(source.origin)) || (row.company_id && source.companyId !== row.company_id)) return invalid;
    sources.push({ id: source.id, companyId: source.companyId, revision: source.revision, text: source.text, origin: source.origin as ReviewSource["origin"] });
  }
  if (new Set(sources.map((source) => source.id)).size !== sources.length) return invalid;
  const citations: Citation[] = [];
  for (const citation of provenance.citations) {
    if (!object(citation) || !nonempty(citation.sourceId) || !nonempty(citation.quote) || !sources.some((source) => source.id === citation.sourceId && source.text.includes(citation.quote as string))) return invalid;
    citations.push({ sourceId: citation.sourceId, quote: citation.quote });
  }
  return { state: "reviewed", expired: validity.type === "until_date" && validity.date < today,
    scope: { type: scope.type as KnowledgeScope["type"], label: scope.label }, duration: validity,
    confirmedBy: row.confirmed_by, confirmedAt: row.confirmed_at, proposalId: row.review_proposal_id, sources, citations };
}

export function memoryIsCurrent(row: MemoryRecord, today: string): boolean {
  const review = inspectMemoryReview(row, today);
  return review.state === "legacy" || (review.state === "reviewed" && !review.expired);
}
