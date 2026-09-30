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
 *
 * Every fact appears once. A lead whose reply is overdue is one item with
 * two facts in it, not two lines; a draft a workflow left is carried by the
 * run's sentence, not also by the queue. The desk never says a thing was
 * sent, done or handled: the record holds none of those.
 */

export type BriefRoute = "decide" | "finish" | "blocked" | "other";

export type BriefNeed = {
  id: string; title: string; status: string; route: BriefRoute; requiredAction: string | null;
  waitingDays: number; updatedAt: string | null;
};

export type BriefChange = { title: string; event: string; byAPerson: boolean };

/* Open work with a date on it that is today, tomorrow, or gone. Any status:
 * a task nobody has to approve still needs a person when its day comes. */
export type BriefDue = { id: string; title: string; dueInDays: number };

export type BriefNext = { name: string; dueInHours: number | null; paused: boolean };

/* A lead that arrived from the site since the person last looked, and the
 * state of the reply the record filed for it. */
export type BriefLead = { name: string; company: string | null; itemId: string | null; dueInDays: number | null };

/* A workflow that ran since the person last looked: it left a draft, or it failed. */
export type BriefRun = { name: string; status: "drafted" | "failed"; at: string; daysAgo: number; itemId: string | null };

export type Brief = {
  /* The longest-waiting first, at most three, none already named elsewhere. */
  needs: BriefNeed[];
  needCount: number;
  /* How the waiting splits by what is asked; null when the rows read did not
   * cover the whole count, so the split cannot be stated. */
  routes: { decide: number; finish: number; blocked: number } | null;
  /* Overdue first, then today, then tomorrow; at most three. */
  due: BriefDue[];
  dueCount: number;
  /* Leads since the person last looked; at most three, count for the rest. */
  leads: BriefLead[];
  leadCount: number;
  /* Review cards the co-founder proposed to this person that nobody decided. */
  proposed: { count: number; oldestAt: string | null };
  /* Workflows that ran since the person last looked. */
  ran: BriefRun[];
  /* Since the person last marked the desk seen. Null when they never have:
   * "nothing changed since you last looked" is false on a first visit. */
  changes: number | null;
  lastChange: BriefChange | null;
  /* The soonest thing that runs on its own, or the fact that nothing does. */
  next: BriefNext | null;
  finishedThisFortnight: number;
  /* Live facts the record holds, counting "what you do" as one. */
  knows: number;
  /* Everything open, waiting on nobody or somebody; the honest empty state
   * under "nothing needs you" when work exists. */
  openCount: number;
  /* The desk's first day: nothing in it yet. Emptiness, not a calendar
   * date, because the page never reads its own clock. */
  firstDay: boolean;
};

/* Column shapes as the views hand them over: every field nullable to the
 * type generator, so each is checked here rather than trusted. */
export type NeedRow = {
  id: string | null; title: string | null; status: string | null; waiting_days: number | null;
  route?: string | null; required_action?: string | null; updated_at?: string | null;
};
export type ChangeRow = { title: string | null; event: string | null; by_a_person: boolean | null };
export type DueRow = { id: string; title: string; status: string; due_in_days: number | null };
export type WorkflowRow = {
  name: string | null; active: boolean | null; due_in_hours: number | null; paused_reason: string | null;
  last_run_at?: string | null; last_run_days?: number | null; last_run_status?: string | null; last_run_item_id?: string | null;
};
export type LeadRow = { item_id: string | null; payload: unknown; received_at: string | null };

const TOP = 3;

function leadName(payload: unknown): { name: string; company: string | null } | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) return null;
  const company = typeof record.company === "string" && record.company.trim() ? record.company.trim() : null;
  return { name, company };
}

function asRoute(value: string | null | undefined, status: string): BriefRoute {
  if (value === "decide" || value === "finish" || value === "blocked") return value;
  if (status === "blocked") return "blocked";
  if (status === "review") return "decide";
  return "other";
}

export function composeBrief(input: {
  needs: NeedRow[];
  needCount: number;
  due?: DueRow[];
  dueCount?: number;
  leads?: LeadRow[];
  leadCount?: number;
  proposed?: { count: number; oldestAt: string | null };
  changes: number | null;
  lastChange: ChangeRow | null;
  workflows: WorkflowRow[];
  seenAt?: string | null;
  finishedThisFortnight: number;
  knows?: number;
  openCount?: number;
  firstDay?: boolean;
}): Brief {
  /* Due soon means the day has come or is next: a date a week out is a plan,
   * not news. Finished work is not asked, whatever its date says. */
  const dueAll = (input.due ?? [])
    .filter(
      (row): row is DueRow & { due_in_days: number } =>
        row.due_in_days !== null && row.due_in_days <= 1 && row.status !== "completed" && row.status !== "canceled",
    )
    .sort((a, b) => a.due_in_days - b.due_in_days);
  const dueById = new Map(dueAll.map((row) => [row.id, row.due_in_days]));

  /* Leads since the person last looked. The reply's date rides in the lead's
   * own sentence, so the item leaves the due list. */
  const leads: BriefLead[] = (input.seenAt ? (input.leads ?? []) : [])
    .flatMap((row) => {
      const who = leadName(row.payload);
      return who ? [{ ...who, itemId: row.item_id, dueInDays: row.item_id ? dueById.get(row.item_id) ?? null : null }] : [];
    })
    .slice(0, TOP);
  const leadCount = input.seenAt ? Math.max(input.leadCount ?? 0, leads.length) : 0;
  const leadItems = new Set(leads.flatMap((lead) => (lead.itemId ? [lead.itemId] : [])));

  /* Workflows that ran since the person last looked. Their drafts sit in the
   * queue too; the run's sentence stands for them. */
  const ran: BriefRun[] = input.seenAt
    ? input.workflows
        .flatMap((w) =>
          w.name && w.last_run_at && w.last_run_at > input.seenAt! && (w.last_run_status === "drafted" || w.last_run_status === "failed")
            ? [{ name: w.name, status: w.last_run_status as "drafted" | "failed", at: w.last_run_at, daysAgo: Math.max(0, w.last_run_days ?? 0), itemId: w.last_run_item_id ?? null }]
            : [],
        )
        .sort((a, b) => (a.at < b.at ? 1 : -1))
        .slice(0, TOP)
    : [];
  const ranItems = new Set(ran.flatMap((run) => (run.itemId ? [run.itemId] : [])));

  const needRows = input.needs.flatMap((row) =>
    row.id && row.title && row.status
      ? [{
          id: row.id, title: row.title, status: row.status, route: asRoute(row.route, row.status),
          requiredAction: row.required_action ?? null, waitingDays: Math.max(0, row.waiting_days ?? 0), updatedAt: row.updated_at ?? null,
        }]
      : [],
  );
  const needCount = Math.max(input.needCount, needRows.length);
  /* The split is stated only when every waiting row was read. */
  const routes = needRows.length >= needCount
    ? needRows.reduce((acc, row) => ({ ...acc, [row.route === "other" ? "decide" : row.route]: acc[row.route === "other" ? "decide" : row.route] + 1 }),
        { decide: 0, finish: 0, blocked: 0 })
    : null;
  const needs = needRows
    .filter((row) => !dueById.has(row.id) && !leadItems.has(row.id) && !ranItems.has(row.id))
    .sort((a, b) => b.waitingDays - a.waitingDays)
    .slice(0, TOP);

  const due = dueAll
    .filter((row) => !leadItems.has(row.id))
    .slice(0, TOP)
    .map((row) => ({ id: row.id, title: row.title, dueInDays: row.due_in_days }));

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
      ? { title: input.lastChange.title, event: input.lastChange.event, byAPerson: input.lastChange.by_a_person === true }
      : null;

  const proposed = input.proposed && input.proposed.count > 0
    ? { count: input.proposed.count, oldestAt: input.proposed.oldestAt }
    : { count: 0, oldestAt: null };

  const knows = Math.max(0, input.knows ?? 0);
  const openCount = Math.max(0, input.openCount ?? 0, needCount, dueAll.length);
  const finishedThisFortnight = Math.max(0, input.finishedThisFortnight);
  /* A first day is a claim about emptiness: nothing open, nothing finished,
   * nothing known beyond what the company does, nothing scheduled. */
  const firstDay = input.firstDay !== false && openCount === 0 && finishedThisFortnight === 0 && knows <= 1 && input.workflows.length === 0 && leadCount === 0 && proposed.count === 0;

  return {
    needs, needCount, routes, due, dueCount: Math.max(input.dueCount ?? 0, dueAll.length),
    leads, leadCount, proposed, ran,
    changes: input.changes === null ? null : Math.max(0, input.changes),
    lastChange: input.changes ? lastChange : null,
    next, finishedThisFortnight, knows, openCount, firstDay,
  };
}

/* A count into a sentence. Three forms, because "0 things need you" is a
 * counter and "Nothing needs you" is a sentence. */
export function countSentence(count: number, forms: { none: string; one: string; many: string }): string {
  if (count === 0) return forms.none;
  if (count === 1) return forms.one;
  return forms.many.replace("{n}", String(count));
}

/* How long something has waited, said so that it stops climbing at the
 * person: relative under a week, the calendar date from then on, so an old
 * item's sentence is the same each morning. */
export function waitedPhrase(
  waitingDays: number, updatedAt: string | null, locale: string, forms: { since: string },
): string {
  if (waitingDays >= 7 && updatedAt) {
    const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(new Date(updatedAt));
    return forms.since.replace("{date}", date);
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-waitingDays, "day");
}
