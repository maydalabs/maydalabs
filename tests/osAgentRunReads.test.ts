import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/osCofounder";
import { MEMORY_REVIEW_COLUMNS } from "@/lib/osReviewedMemory";
import { AGENT_RUN_PUBLIC_COLUMNS } from "@/lib/osAgentRunTypes";

vi.mock("server-only", () => ({}));
import { CAPTURE_ITEM_COLUMNS, EVENT_COLUMNS, OPEN_CARD_COLUMNS, SEARCH_COLUMNS, listMemory, openCardItems, readEvents, searchRecord } from "@/lib/osAgentRunReads";

/* A column that does not exist fails every read with 42703, and mocked
 * clients never notice. So every column these reads select is checked
 * against the schema generated from the migrations (lib/supabase/database.types.ts),
 * and the queries' filters are checked against the columns each table has. */

const types = readFileSync("lib/supabase/database.types.ts", "utf8");
function rowColumns(table: string): string[] {
  const block = new RegExp(`\\n      ${table}: \\{\\n        Row: \\{\\n([\\s\\S]*?)\\n        \\}`).exec(types)?.[1];
  if (!block) throw new Error(`no generated Row for ${table}`);
  return [...block.matchAll(/^ {10}(\w+)\??:/gm)].map((m) => m[1]);
}
const list = (columns: string) => columns.split(",").map((column) => column.trim());
const store = readFileSync("lib/osAgentRunStore.ts", "utf8");

type Call = { table: string; ops: [string, unknown[]][] };
function fakeAdmin(data: Record<string, unknown[]>, counts: Record<string, number> = {}) {
  const calls: Call[] = [];
  const from = vi.fn((table: string) => {
    const call: Call = { table, ops: [] };
    calls.push(call);
    const query: Record<string, unknown> = {};
    for (const name of ["select", "eq", "not", "order", "limit", "is", "or", "in", "abortSignal"]) {
      query[name] = (...args: unknown[]) => { call.ops.push([name, args]); return query; };
    }
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: data[table] ?? [], error: null, count: counts[table] ?? null }).then(resolve);
    return query;
  });
  return { admin: { from } as unknown as Db, calls };
}

describe("every selected column exists", () => {
  it.each([
    ["os_work_items", SEARCH_COLUMNS],
    ["os_work_item_events", EVENT_COLUMNS],
    ["os_review_proposals", OPEN_CARD_COLUMNS],
    ["os_agent_run_reads", CAPTURE_ITEM_COLUMNS],
    ["os_company_memory", MEMORY_REVIEW_COLUMNS],
    ["os_agent_runs", AGENT_RUN_PUBLIC_COLUMNS],
  ])("in %s", (table, columns) => {
    const known = rowColumns(table);
    for (const column of list(columns)) expect(known, `${table}.${column}`).toContain(column);
  });

  it("in the store's own selects", () => {
    expect(rowColumns("os_agent_runs")).toEqual(expect.arrayContaining(["lease_id", "checkpoint", "status"]));
    const turnSelects = [...store.matchAll(/from\("os_review_turns"\)\.select\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(turnSelects.length).toBeGreaterThanOrEqual(2);
    for (const select of turnSelects) for (const column of list(select)) expect(rowColumns("os_review_turns")).toContain(column);
    const readSelects = [...store.matchAll(/from\("os_agent_run_reads"\)\.select\("([^"]+)"\)/g)].map((m) => m[1]);
    for (const select of readSelects) for (const column of list(select)) expect(rowColumns("os_agent_run_reads")).toContain(column);
  });

  it("events have no company column, so their read cannot be scoped by one", () => {
    expect(rowColumns("os_work_item_events")).not.toContain("company_id");
    expect(rowColumns("os_work_item_events")).toContain("item_id");
  });
});

describe("the reads", () => {
  it("scan open Work of the run's company, longest-waiting first, at most 200", async () => {
    const { admin, calls } = fakeAdmin({ os_work_items: [{ id: "a" }] }, { os_work_items: 1 });
    expect(await searchRecord(admin, "company-1", 10_000)).toEqual({ rows: [{ id: "a" }], openTotal: 1 });
    expect(calls[0].ops.filter(([name]) => name !== "abortSignal")).toEqual([
      ["select", [SEARCH_COLUMNS, { count: "exact" }]], ["eq", ["company_id", "company-1"]], ["not", ["status", "in", "(completed,canceled)"]],
      ["order", ["updated_at", { ascending: true }]], ["limit", [200]],
    ]);
    expect(calls[0].ops.some(([name]) => name === "abortSignal")).toBe(true);
  });

  it("scope events by the captured item only", async () => {
    const { admin, calls } = fakeAdmin({ os_work_item_events: [{ event: "edited", at: "2026-10-01T00:00:00Z", actor: null }] });
    await readEvents(admin, "item-1", 10_000);
    expect(calls[0].ops.filter(([name]) => name === "eq")).toEqual([["eq", ["item_id", "item-1"]]]);
    expect(calls[0].ops).toContainEqual(["limit", [5]]);
  });

  it("list current company knowledge, dropping expired and invalid reviewed entries", async () => {
    const { admin, calls } = fakeAdmin({ os_company_memory: [
      { id: "m1", fact: "Never offer Acme a discount.", kind: "constraint", source: "person", company_id: "company-1" },
      { id: "m2", fact: "Half-reviewed.", kind: "fact", source: "cofounder", review_scope: { type: "company", label: "Co" } },
    ] }, { os_company_memory: 2 });
    expect(await listMemory(admin, "company-1", "2026-10-17", 10_000)).toEqual({
      rows: [{ kind: "constraint", fact: "Never offer Acme a discount.", source: "person", reviewed: false, scope: null }], complete: true,
    });
    expect(calls[0].ops).toContainEqual(["eq", ["company_id", "company-1"]]);
    expect(calls[0].ops).toContainEqual(["is", ["retired_at", null]]);
  });

  it("map undecided run cards to the items their captures read, within the company", async () => {
    const capture = "11111111-1111-4111-8111-111111111111";
    const { admin, calls } = fakeAdmin({
      os_review_proposals: [
        { payload: { citations: [{ sourceId: "message", quote: "q" }, { sourceId: `read:${capture}`, quote: "t" }] } },
        { payload: { citations: [{ sourceId: "message", quote: "a chat card" }] } },
      ],
      os_agent_run_reads: [{ id: capture, item_id: "item-7" }],
    });
    expect([...await openCardItems(admin, "company-1", 10_000)]).toEqual(["item-7"]);
    expect(calls[0].ops).toContainEqual(["eq", ["status", "proposed"]]);
    expect(calls[1].ops).toContainEqual(["eq", ["company_id", "company-1"]]);
    expect(calls[1].ops).toContainEqual(["in", ["id", [capture]]]);
  });
});
