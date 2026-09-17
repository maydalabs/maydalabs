/* Everything open, arranged the way a founder thinks about a business.
 *
 * The queue answers "what needs me". This answers "what is in flight", which
 * is a different question: a note the co-founder filed needs nobody, so it
 * appeared in no queue and was reachable only by knowing its name. Pure, so
 * the arrangement can be tested without a database.
 */

/* The parts of a business, in the order work tends to matter. The co-founder
 * is told this same list in its file_work tool, and a lane outside it is
 * still shown — after these, alphabetically — rather than dropped. */
export const OS_LANES = ["sales", "content", "product", "ops", "finance"] as const;

/* Within a lane, what wants a person leads; what is merely in progress
 * follows. The numbers only order, they are never shown. */
const STATUS_RANK: Record<string, number> = {
  review: 0,
  approved: 1,
  blocked: 2,
  drafted: 3,
  triaged: 4,
  pending: 5,
};

const NEEDS_A_PERSON = new Set(["review", "approved", "blocked"]);

export type WorkRow = { id: string; title: string; lane: string; kind: string; status: string; updated_at: string };
export type WorkGroup<T> = { lane: string; items: T[]; needsYou: number };

export function needsAPerson(status: string): boolean {
  return NEEDS_A_PERSON.has(status);
}

export function groupWork<T extends WorkRow>(rows: T[]): { open: WorkGroup<T>[]; finished: T[] } {
  const newestFirst = (a: T, b: T) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0);

  const finished = rows.filter((row) => row.status === "completed").sort(newestFirst);

  const byLane = new Map<string, T[]>();
  for (const row of rows) {
    // Dismissed work is gone; finished work has its own place below.
    if (row.status === "completed" || row.status === "canceled") continue;
    const lane = row.lane.trim().toLowerCase() || "other";
    const list = byLane.get(lane) ?? [];
    list.push(row);
    byLane.set(lane, list);
  }

  const laneRank = (lane: string) => {
    const at = (OS_LANES as readonly string[]).indexOf(lane);
    return at === -1 ? OS_LANES.length : at;
  };

  const open = [...byLane.entries()]
    .sort(([a], [b]) => laneRank(a) - laneRank(b) || a.localeCompare(b))
    .map(([lane, items]) => ({
      lane,
      items: items.sort(
        (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || newestFirst(a, b),
      ),
      needsYou: items.filter((item) => needsAPerson(item.status)).length,
    }));

  return { open, finished };
}
