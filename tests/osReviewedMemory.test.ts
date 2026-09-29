import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCompanyContext } from "@/lib/osCofounder";
import { inspectMemoryReview, memoryCandidateFilter, memoryIsCurrent, memoryRows, type MemoryRecord } from "@/lib/osReviewedMemory";
import type { Database } from "@/lib/supabase/database.types";

const today = "2026-09-22";
const companyId = "00000000-0000-4000-8000-000000000001";
const source = { id: "synthetic-source", companyId, revision: "source-r1", text: "This customer uses a monthly invoice.", origin: "founder" };
const row: MemoryRecord = {
  id: "synthetic-memory", company_id: companyId, fact: "This customer uses a monthly invoice.", kind: "fact", source: "cofounder", created_at: "2026-09-21T12:00:00Z",
  review_scope: { type: "customer", label: "Synthetic customer" }, review_duration: { type: "until_date", date: "2026-09-22" },
  review_proposal_id: "synthetic-proposal", confirmed_by: "synthetic-reviewer", confirmed_at: "2026-09-21T12:00:00Z",
  review_provenance: { proposalId: "synthetic-proposal", revision: 1, fingerprint: "synthetic-digest", turnId: "synthetic-turn", threadId: "synthetic-thread", authorship: "model", lastEditedBy: null, confirmedBy: "synthetic-reviewer", externallyVerified: false, sources: [source], citations: [{ sourceId: source.id, quote: source.text }] },
};

describe("reviewed memory scope and validity", () => {
  it("retains a current scoped fact, its model authorship and a distinct human confirmation", () => {
    const review = inspectMemoryReview(row, today);
    expect(review).toMatchObject({ state: "reviewed", expired: false, scope: { type: "customer", label: "Synthetic customer" }, duration: { type: "until_date", date: today }, confirmedBy: "synthetic-reviewer", sources: [source] });
    expect(memoryIsCurrent(row, today)).toBe(true);
    expect(row.source).toBe("cofounder");
  });

  it("the last valid UTC day is inclusive, then the entry is no longer current", () => {
    expect(memoryIsCurrent(row, "2026-09-21")).toBe(true);
    expect(memoryIsCurrent(row, today)).toBe(true);
    expect(inspectMemoryReview(row, "2026-09-23")).toMatchObject({ state: "reviewed", expired: true });
    expect(memoryIsCurrent(row, "2026-09-23")).toBe(false);
  });

  it("until-changed does not acquire an invented expiration date", () => {
    expect(inspectMemoryReview({ ...row, review_duration: { type: "until_changed" } }, "2035-01-01")).toMatchObject({ state: "reviewed", expired: false, duration: { type: "until_changed" } });
  });

  for (const scope of ["company", "project", "customer"]) {
    it(`preserves explicit ${scope} scope instead of generalising it`, () => {
      expect(inspectMemoryReview({ ...row, review_scope: { type: scope, label: "Scoped name" } }, today)).toMatchObject({ state: "reviewed", scope: { type: scope, label: "Scoped name" } });
    });
  }

  it("keeps truly historical missing metadata distinguishable", () => {
    const legacy = { id: "historical", fact: "Old note", kind: "fact", source: "cofounder" };
    expect(inspectMemoryReview(legacy, today)).toEqual({ state: "legacy" });
    expect(memoryIsCurrent(legacy, today)).toBe(true);
    expect(inspectMemoryReview({ ...legacy, review_scope: null, review_duration: null, review_provenance: null, review_proposal_id: null, confirmed_by: null, confirmed_at: null }, today)).toEqual({ state: "legacy" });
  });

  for (const [name, patch] of [
    ["no scope", { review_scope: null }], ["blank scope label", { review_scope: { type: "customer", label: " " } }],
    ["unknown scope", { review_scope: { type: "universe", label: "All" } }],
    ["invalid date", { review_duration: { type: "until_date", date: "2026-02-31" } }],
    ["invented duration", { review_duration: { type: "forever" } }],
    ["contradictory duration", { review_duration: { type: "until_changed", date: today } }],
    ["no proposal", { review_proposal_id: null }], ["no confirmer", { confirmed_by: null }],
    ["no confirmation date", { confirmed_at: null }], ["invalid confirmation date", { confirmed_at: "not-a-date" }],
    ["wrong authorship", { source: "person" }], ["no provenance", { review_provenance: null }],
    ["claims verified", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), externallyVerified: true } }],
    ["different confirmer", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), confirmedBy: "different-reviewer" } }],
    ["different proposal", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), proposalId: "different-proposal" } }],
    ["missing sources", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), sources: [] } }],
    ["foreign source", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), sources: [{ ...source, companyId: "foreign-company" }] } }],
    ["duplicate source ids", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), sources: [source, source] } }],
    ["missing citations", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), citations: [] } }],
    ["unmatched quote", { review_provenance: { ...(row.review_provenance as Record<string, unknown>), citations: [{ sourceId: source.id, quote: "Not in the source" }] } }],
  ] as const) {
    it(`fails closed on ${name}, never treating it as a legacy global rule`, () => {
      expect(inspectMemoryReview({ ...row, ...patch }, today)).toEqual({ state: "invalid" });
      expect(memoryIsCurrent({ ...row, ...patch }, today)).toBe(false);
    });
  }

  it("invalid reader date does not make reviewed knowledge current", () => {
    expect(inspectMemoryReview(row, "not-a-date")).toEqual({ state: "invalid" });
    expect(() => memoryCandidateFilter("not-a-date")).toThrow("Invalid memory read date");
  });

  it("decodes only rows with the minimum typed record shape", () => {
    expect(memoryRows(null)).toEqual([]);
    expect(memoryRows({})).toEqual([]);
    expect(memoryRows([null, {}, { ...row, source: false }, row])).toHaveLength(1);
    expect(inspectMemoryReview(memoryRows([row])[0], today)).toMatchObject({ state: "reviewed" });
  });
});

function contextClient(memory: MemoryRecord[]) {
  const requests: URL[] = [];
  const fetcher = async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requests.push(url);
    const table = url.pathname.split("/").at(-1);
    const rows = table === "os_company_memory" ? memory : table === "os_companies" ? [{ id: companyId, name: "Synthetic company", what_we_do: "Synthetic testing only" }] : [];
    return new Response(JSON.stringify(rows), { headers: { "content-type": "application/json", "content-range": `0-${Math.max(0, rows.length - 1)}/${rows.length}` } });
  };
  return { requests, db: createClient<Database>("http://127.0.0.1:54321", "synthetic-test-key", { global: { fetch: fetcher }, auth: { persistSession: false } }) };
}

describe("context retrieves scoped current knowledge honestly", () => {
  afterEach(() => vi.useRealTimers());
  it("requests expiry filtering before its bounded window and retains selected-company filtering", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(`${today}T12:00:00Z`));
    const { db, requests } = contextClient([row]);
    const context = await buildCompanyContext(db, companyId);
    const request = requests.find((url) => url.pathname.endsWith("/os_company_memory"))!;
    expect(request.searchParams.get("company_id")).toBe(`eq.${companyId}`);
    expect(request.searchParams.get("or")).toBe(`(${memoryCandidateFilter(today)})`);
    expect(request.searchParams.get("limit")).toBe("80");
    expect(request.searchParams.get("select")).toContain("review_provenance");
    expect(context).toContain('applies_only_to: {"type":"customer","label":"Synthetic customer"}');
    expect(context).toContain('"externally_verified":false');
    expect(context).toContain("model-authored; human confirmed");
    expect(context).toContain("not independently verified");
    expect(context).toContain("scoped knowledge is not a company-wide rule");
  });

  it("also excludes expired and malformed records after read, with explicit omission counts", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(`${today}T12:00:00Z`));
    const { db } = contextClient([
      row,
      { ...row, id: "expired", fact: "EXPIRED_FACT_MUST_NOT_ENTER_CONTEXT", review_duration: { type: "until_date", date: "2026-09-21" } },
      { ...row, id: "invalid", fact: "INCOMPLETE_FACT_MUST_NOT_ENTER_CONTEXT", review_scope: null },
    ]);
    const context = await buildCompanyContext(db, companyId);
    expect(context).not.toContain("EXPIRED_FACT_MUST_NOT_ENTER_CONTEXT");
    expect(context).not.toContain("INCOMPLETE_FACT_MUST_NOT_ENTER_CONTEXT");
    expect(context).toContain('"expired_omitted":1');
    expect(context).toContain('"invalid_omitted":1');
    expect(context).toContain('"current":1');
  });

  it("empty current knowledge does not claim there has never been historical knowledge", async () => {
    const context = await buildCompanyContext(contextClient([]).db, companyId);
    expect(context).toContain("expired and retired historical records are not counted here");
    expect(context).not.toContain("you have not written anything down about this company");
  });

  it("historical model notes stay unconfirmed rather than acquiring new human confirmation", async () => {
    const context = await buildCompanyContext(contextClient([{ id: "legacy", fact: "Synthetic old note", kind: "fact", source: "cofounder" }]).db, companyId);
    expect(context).toContain("cofounder note; unconfirmed; historical scope/validity not recorded");
    expect(context).not.toContain("human confirmed");
  });
});
