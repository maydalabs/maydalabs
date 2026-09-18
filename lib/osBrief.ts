/* The brief: what the desk says before you click anything.
 *
 * Property two, "it tells you what needs you", was only true of a person who
 * had already opened the queue. This is the same facts, arranged as the first
 * thing on the desk — and arranged here, in a pure function, so that what the
 * desk says on a given morning can be asserted without a browser.
 *
 * Everything in it is computed from the record. No model is involved, which
 * is the point: the desk speaks whether or not the co-founder can, and when
 * the co-founder can, this is the slot its own words go into.
 */

export type BriefNeed = { id: string; title: string; status: string; waitingDays: number };

export type BriefChange = { title: string; event: string; byAPerson: boolean };

export type BriefNext = { name: string; dueInHours: number | null; paused: boolean };

export type Brief = {
  /* The longest-waiting first, at most three. */
  needs: BriefNeed[];
  needCount: number;
  /* Since the person last marked the desk seen. Null when they never have:
   * "nothing changed since you last looked" is false on a first visit. */
  changes: number | null;
  lastChange: BriefChange | null;
  /* The soonest thing that runs on its own, or the fact that nothing does. */
  next: BriefNext | null;
  finishedThisFortnight: number;
};

/* Column shapes as the views hand them over: every field nullable to the
 * type generator, so each is checked here rather than trusted. */
export type NeedRow = { id: string | null; title: string | null; status: string | null; waiting_days: number | null };
export type ChangeRow = { title: string | null; event: string | null; by_a_person: boolean | null };
export type WorkflowRow = {
  name: string | null;
  active: boolean | null;
  due_in_hours: number | null;
  paused_reason: string | null;
};

const TOP = 3;

export function composeBrief(input: {
  needs: NeedRow[];
  needCount: number;
  changes: number | null;
  lastChange: ChangeRow | null;
  workflows: WorkflowRow[];
  finishedThisFortnight: number;
}): Brief {
  const needs = input.needs
    .flatMap((row) =>
      row.id && row.title && row.status
        ? [{ id: row.id, title: row.title, status: row.status, waitingDays: Math.max(0, row.waiting_days ?? 0) }]
        : [],
    )
    .sort((a, b) => b.waitingDays - a.waitingDays)
    .slice(0, TOP);

  /* Running workflows come first, soonest first; a paused one is mentioned
   * only when nothing is running, because "X is paused" is the news then and
   * noise otherwise. */
  const running = input.workflows
    .filter((w) => w.active !== false && w.name && !w.paused_reason)
    .sort((a, b) => (a.due_in_hours ?? Number.MAX_SAFE_INTEGER) - (b.due_in_hours ?? Number.MAX_SAFE_INTEGER));
  const paused = input.workflows.filter((w) => w.active !== false && w.name && w.paused_reason);

  const next: BriefNext | null = running[0]
    ? { name: running[0].name!, dueInHours: running[0].due_in_hours, paused: false }
    : paused[0]
      ? { name: paused[0].name!, dueInHours: null, paused: true }
      : null;

  const lastChange =
    input.lastChange && input.lastChange.title && input.lastChange.event
      ? {
          title: input.lastChange.title,
          event: input.lastChange.event,
          byAPerson: input.lastChange.by_a_person === true,
        }
      : null;

  return {
    needs,
    needCount: Math.max(input.needCount, needs.length),
    changes: input.changes === null ? null : Math.max(0, input.changes),
    lastChange: input.changes ? lastChange : null,
    next,
    finishedThisFortnight: Math.max(0, input.finishedThisFortnight),
  };
}

/* A count into a sentence. Three forms, because "0 things need you" is a
 * counter and "Nothing needs you" is a sentence. */
export function countSentence(count: number, forms: { none: string; one: string; many: string }): string {
  if (count === 0) return forms.none;
  if (count === 1) return forms.one;
  return forms.many.replace("{n}", String(count));
}
