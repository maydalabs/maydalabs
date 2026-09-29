import type { Db } from "@/lib/osCofounder";
import type { Scenario } from "@/lib/osScenarios";

type Row = Record<string, unknown>;
type Result = { data: Row[] | Row | null; error: { message: string } | null; count: number | null };
const FIXTURE_TIME = "2026-09-22T09:00:00.000Z";
// Deliberate generation-context change paired with judge 2026-09-22.3. The
// runner hashes this source; old reports retain their key-derived company name.
export const FIXTURE_CONTEXT_VERSION = "2026-09-22.3";
const DEFAULT_COMPANY = { name: "Northwind Logistics", whatWeDo: "We move freight for small manufacturers in Izmir." };

/* Narrow in-memory adapter for behavioral model runs, NOT a PostgreSQL/RLS
 * substitute. It executes the filters/order/count/limit used by the real
 * context builder and stores the real tools' writes. Unknown tables/query
 * operations fail, so a changed production query cannot silently pass.
 * No Supabase URL/key, user row, trigger or database is touched. */
export function scenarioFixture(scenario: Scenario) {
  const companyId = `fixture-${scenario.key}`;
  const company = scenario.company ?? DEFAULT_COMPANY;
  let sequence = 0;
  const tables: Record<string, Row[]> = {
    os_companies: [{ id: companyId, name: company.name, what_we_do: company.whatWeDo, created_at: FIXTURE_TIME }],
    os_work_items: (scenario.openWork ?? []).map((item, index) => ({
      id: `work-${index}`, company_id: companyId, required_action: null, notes: "", metadata: { by: "person" },
      artifacts: [], created_at: FIXTURE_TIME, updated_at: FIXTURE_TIME, ...item,
    })),
    os_company_memory: (scenario.memory ?? []).map((memory, index) => ({
      id: `memory-${index}`, company_id: companyId, source: "person", retired_at: null, created_at: FIXTURE_TIME, ...memory,
    })),
    os_approvals: [], os_workflows: [], os_work_item_events: [], os_finished_lately: [],
  };
  const valueAt = (row: Row, column: string): unknown => column.split(".").reduce<unknown>((value, key) =>
    value && typeof value === "object" ? (value as Row)[key] : undefined, row);

  const from = (table: string) => {
    if (!(table in tables)) throw new Error(`Unsupported fixture table: ${table}`);
    const predicates: ((row: Row) => boolean)[] = [];
    const ordering: { column: string; ascending: boolean }[] = [];
    let maximum = Infinity;
    let single = false;
    let count = false;
    let head = false;
    let selection = "*";
    let inserted: Row[] | null = null;
    let execution: Promise<Result> | undefined;
    const query = {
      select(columns = "*", options?: { count?: string; head?: boolean }) { selection = columns; count = options?.count === "exact"; head = options?.head === true; return query; },
      eq(column: string, value: unknown) { predicates.push((row) => valueAt(row, column) === value); return query; },
      is(column: string, value: unknown) { predicates.push((row) => valueAt(row, column) === value); return query; },
      or(filter: string) {
        // Only the real memory candidate query is supported. Match its SQL
        // semantics before count/LIMIT; accepting arbitrary OR as a no-op
        // would conceal expired-memory leaks in behavioral measurements.
        const match = /^review_duration\.is\.null,review_duration->>type\.eq\.until_changed,and\(review_duration->>type\.eq\.until_date,review_duration->>date\.gte\.(\d{4}-\d{2}-\d{2})\)$/.exec(filter);
        if (table !== "os_company_memory" || !match) throw new Error("Unsupported fixture or filter");
        const today = match[1];
        const parsed = new Date(`${today}T00:00:00Z`);
        if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== today) throw new Error("Unsupported fixture or date");
        predicates.push((row) => {
          const duration = row.review_duration;
          if (duration === null || duration === undefined) return true;
          if (typeof duration !== "object" || Array.isArray(duration)) return false;
          const value = duration as Row;
          return value.type === "until_changed" || (value.type === "until_date" && typeof value.date === "string" && value.date >= today);
        });
        return query;
      },
      not(column: string, operator: string, list: string) {
        if (operator !== "in" || !/^\([^()]+\)$/.test(list)) throw new Error("Unsupported fixture not filter");
        const values = list.slice(1, -1).split(",");
        predicates.push((row) => !values.includes(String(valueAt(row, column)))); return query;
      },
      order(column: string, options?: { ascending?: boolean }) { ordering.push({ column, ascending: options?.ascending !== false }); return query; },
      limit(value: number) { maximum = value; return query; },
      maybeSingle() { single = true; return query; },
      single() { single = true; return query; },
      insert(input: Row | Row[]) {
        if (!["os_work_items", "os_company_memory"].includes(table)) throw new Error(`Unsupported fixture write: ${table}`);
        inserted = Array.isArray(input) ? input : [input]; return query;
      },
      then<TResult1 = Result, TResult2 = never>(resolve?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
        execution ??= Promise.resolve().then(() => {
          if (inserted) {
            for (const input of inserted) {
              if (input.company_id !== companyId) throw new Error("Fixture write addressed another company");
              const row = { id: `new-${++sequence}`, created_at: FIXTURE_TIME, updated_at: FIXTURE_TIME, retired_at: null, ...structuredClone(input) };
              tables[table].push(row);
              if (table === "os_work_items") tables.os_work_item_events.push({ id: `event-${sequence}`, item_id: row.id, event: "created", detail: {}, at: FIXTURE_TIME });
            }
            return { data: null, error: null, count: null };
          }
          let rows = tables[table].map((row) => {
            if (!selection.includes("os_work_items(" ) && !selection.includes("os_work_items!inner(")) return row;
            return { ...row, os_work_items: tables.os_work_items.find((item) => item.id === row.item_id) ?? null };
          });
          if (selection.includes("os_work_items!inner(")) rows = rows.filter((row) => row.os_work_items !== null);
          rows = rows.filter((row) => predicates.every((predicate) => predicate(row)));
          const total = rows.length;
          rows.sort((a, b) => {
            for (const order of ordering) {
              const left = String(valueAt(a, order.column) ?? "");
              const right = String(valueAt(b, order.column) ?? "");
              const comparison = left.localeCompare(right) * (order.ascending ? 1 : -1);
              if (comparison) return comparison;
            }
            return 0;
          });
          rows = rows.slice(0, maximum);
          if (single && rows.length > 1) return { data: null, error: { message: "Fixture query returned multiple rows" }, count: count ? total : null };
          return { data: head ? null : structuredClone(single ? rows[0] ?? null : rows), error: null, count: count ? total : null };
        });
        return execution.then(resolve, reject);
      },
    };
    return query;
  };
  return {
    companyId,
    db: { from } as unknown as Db,
    snapshot: () => structuredClone(tables),
    dispose: () => { for (const rows of Object.values(tables)) rows.length = 0; },
    isDisposed: () => Object.values(tables).every((rows) => rows.length === 0),
  };
}
