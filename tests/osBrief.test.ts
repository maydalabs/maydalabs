import { describe, expect, it } from "vitest";
import { composeBrief, countSentence, waitedPhrase } from "@/lib/osBrief";

/* What the desk says before anyone clicks. Pure, so a given morning can be
 * asserted without a browser or a database. */

const forms = { none: "Nothing needs you.", one: "One thing needs you.", many: "{n} things need you." };
const base = { needs: [], needCount: 0, changes: null, lastChange: null, workflows: [], finishedThisFortnight: 0 };

describe("the brief", () => {
  it("leads with the longest-waiting, three at most, and counts the rest", () => {
    const brief = composeBrief({
      ...base,
      needs: [
        { id: "a", title: "A", status: "review", waiting_days: 1, route: "decide" },
        { id: "b", title: "B", status: "blocked", waiting_days: 9, route: "blocked" },
        { id: "c", title: "C", status: "approved", waiting_days: 4, route: "finish", required_action: "send" },
        { id: "d", title: "D", status: "review", waiting_days: 0, route: "decide" },
      ],
      needCount: 4,
      changes: 2,
      lastChange: { title: "B", event: "added", by_a_person: true },
      finishedThisFortnight: 1,
    });
    expect(brief.needs.map((n) => n.id)).toEqual(["b", "c", "a"]);
    expect(brief.needCount).toBe(4);
    expect(brief.routes).toEqual({ decide: 2, finish: 1, blocked: 1 });
    expect(brief.needs[1]).toMatchObject({ route: "finish", requiredAction: "send" });
    expect(brief.changes).toBe(2);
    expect(brief.lastChange).toEqual({ title: "B", event: "added", byAPerson: true });
    expect(brief.next).toBeNull();
    expect(brief.finishedThisFortnight).toBe(1);
  });

  it("states the split only when every waiting row was read, and never counts fewer than it shows", () => {
    const partial = composeBrief({ ...base, needs: [{ id: "a", title: "A", status: "review", waiting_days: 2 }], needCount: 9 });
    expect(partial.routes).toBeNull();
    expect(partial.needCount).toBe(9);
    const ghost = composeBrief({ ...base, needs: [{ id: "a", title: "A", status: "review", waiting_days: null }, { id: null, title: "ghost", status: "review", waiting_days: 3 }], needCount: 0, finishedThisFortnight: -3 });
    expect(ghost.needs).toEqual([{ id: "a", title: "A", status: "review", route: "decide", requiredAction: null, waitingDays: 0, updatedAt: null }]);
    expect(ghost.needCount).toBe(1);
    expect(ghost.finishedThisFortnight).toBe(0);
  });

  /* "Nothing has changed since you last looked" is false on a first visit:
   * the person has never looked. Null means the sentence is not said. */
  it("says nothing about changes, leads or runs when the desk has never been marked seen", () => {
    const brief = composeBrief({
      ...base,
      lastChange: { title: "X", event: "added", by_a_person: true },
      leads: [{ item_id: "i", payload: { name: "Ayşe Demir", company: "Ege Freight" }, received_at: "2026-09-30T06:00:00Z" }],
      leadCount: 1,
      workflows: [{ name: "Weekly sources", active: true, due_in_hours: 100, paused_reason: null, last_run_at: "2026-09-30T05:00:00Z", last_run_status: "drafted", last_run_item_id: "w" }],
    });
    expect(brief.changes).toBeNull();
    expect(brief.lastChange).toBeNull();
    expect(brief.leads).toEqual([]);
    expect(brief.leadCount).toBe(0);
    expect(brief.ran).toEqual([]);
  });

  it("names the soonest running workflow, and a paused one only when nothing runs", () => {
    const soonest = composeBrief({
      ...base, changes: 0,
      workflows: [
        { name: "Weekly brief", active: true, due_in_hours: 70, paused_reason: null },
        { name: "Daily scan", active: true, due_in_hours: 5, paused_reason: null },
        { name: "Old one", active: false, due_in_hours: 1, paused_reason: null },
        { name: "Stuck one", active: true, due_in_hours: 2, paused_reason: "No standing sources." },
      ],
    });
    expect(soonest.next).toEqual({ name: "Daily scan", dueInHours: 5, paused: false });
    const onlyPaused = composeBrief({ ...base, changes: 0, workflows: [{ name: "Stuck one", active: true, due_in_hours: 2, paused_reason: "No standing sources." }] });
    expect(onlyPaused.next).toEqual({ name: "Stuck one", dueInHours: null, paused: true });
  });

  /* Dated work whose day has come, whatever its status: a task nobody has
   * to approve still needs a person when its day arrives. */
  it("lists what is overdue, due today and due tomorrow, and nothing further off", () => {
    const brief = composeBrief({
      ...base,
      due: [
        { id: "later", title: "Next week", status: "pending", due_in_days: 6 },
        { id: "tomorrow", title: "Tomorrow", status: "drafted", due_in_days: 1 },
        { id: "late", title: "Three days late", status: "pending", due_in_days: -3 },
        { id: "today", title: "Today", status: "review", due_in_days: 0 },
        { id: "done", title: "Done but dated", status: "completed", due_in_days: -1 },
        { id: "undated", title: "No date", status: "pending", due_in_days: null },
      ],
      dueCount: 3,
    });
    expect(brief.due).toEqual([
      { id: "late", title: "Three days late", dueInDays: -3 },
      { id: "today", title: "Today", dueInDays: 0 },
      { id: "tomorrow", title: "Tomorrow", dueInDays: 1 },
    ]);
    expect(brief.dueCount).toBe(3);
  });

  /* Every fact once: a lead whose reply is due is one sentence with two facts
   * in it; a draft a workflow left is carried by the run, not by the queue. */
  it("names each item once across the queue, the dates, the leads and the runs", () => {
    const seenAt = "2026-09-29T20:00:00Z";
    const brief = composeBrief({
      ...base,
      seenAt,
      needs: [
        { id: "reply", title: "Reply to the lead from Ege Freight", status: "review", waiting_days: 0, route: "decide" },
        { id: "digest", title: "Weekly sources", status: "review", waiting_days: 0, route: "decide" },
        { id: "price", title: "Q3 pricing", status: "review", waiting_days: 9, route: "decide" },
        { id: "late", title: "Confirm flour order", status: "pending", waiting_days: 6, route: "other" },
      ],
      needCount: 4,
      due: [
        { id: "late", title: "Confirm flour order", status: "pending", due_in_days: -6 },
        { id: "reply", title: "Reply to the lead from Ege Freight", status: "review", due_in_days: 1 },
      ],
      dueCount: 2,
      leads: [{ item_id: "reply", payload: { name: "Ayşe Demir", company: "Ege Freight", email: "hidden@example.test" }, received_at: "2026-09-30T06:00:00Z" }],
      leadCount: 1,
      workflows: [{ name: "Weekly sources", active: true, due_in_hours: 160, paused_reason: null, last_run_at: "2026-09-30T05:00:00Z", last_run_status: "drafted", last_run_item_id: "digest" }],
      changes: 3,
      lastChange: { title: "Weekly sources", event: "prepared", by_a_person: false },
    });
    expect(brief.leads).toEqual([{ name: "Ayşe Demir", company: "Ege Freight", itemId: "reply", dueInDays: 1 }]);
    expect(brief.ran).toEqual([{ name: "Weekly sources", status: "drafted", at: "2026-09-30T05:00:00Z", daysAgo: 0, itemId: "digest" }]);
    // The reply rides with the lead, the digest with the run, the overdue one with the dates.
    expect(brief.needs.map((n) => n.id)).toEqual(["price"]);
    expect(brief.due.map((d) => d.id)).toEqual(["late"]);
    expect(brief.needCount).toBe(4);
    expect(JSON.stringify(brief)).not.toContain("hidden@example.test");
  });

  it("carries undecided cards, what it knows, and a first day only when the desk is truly empty", () => {
    const cards = composeBrief({ ...base, proposed: { count: 2, oldestAt: "2026-09-29T10:00:00Z" }, knows: 3 });
    expect(cards.proposed).toEqual({ count: 2, oldestAt: "2026-09-29T10:00:00Z" });
    expect(cards.knows).toBe(3);
    expect(composeBrief({ ...base, firstDay: true, knows: 1 }).firstDay).toBe(true);
    expect(composeBrief({ ...base, knows: 1 }).firstDay).toBe(true);
    expect(composeBrief({ ...base, knows: 1, openCount: 2 }).firstDay).toBe(false);
    expect(composeBrief({ ...base, knows: 1, openCount: 2 }).openCount).toBe(2);
    expect(composeBrief({ ...base, knows: 1, proposed: { count: 1, oldestAt: null } }).firstDay).toBe(false);
    expect(composeBrief({ ...base, firstDay: true, knows: 1, needCount: 1, needs: [{ id: "a", title: "A", status: "review", waiting_days: 0 }] }).firstDay).toBe(false);
    expect(composeBrief({ ...base, firstDay: true, knows: 4 }).firstDay).toBe(false);
    expect(composeBrief({ ...base, firstDay: false, knows: 1 }).firstDay).toBe(false);
  });

  it("turns a count into a sentence rather than a counter", () => {
    expect(countSentence(0, forms)).toBe("Nothing needs you.");
    expect(countSentence(1, forms)).toBe("One thing needs you.");
    expect(countSentence(4, forms)).toBe("4 things need you.");
  });

  /* After a week the waiting stops climbing at the person: it becomes a date. */
  it("says how long something waited relatively under a week, and as a date from then on", () => {
    expect(waitedPhrase(0, "2026-09-30T00:00:00Z", "en", { since: "since {date}" })).toBe("today");
    expect(waitedPhrase(3, "2026-09-27T00:00:00Z", "en", { since: "since {date}" })).toBe("3 days ago");
    expect(waitedPhrase(12, "2026-09-18T12:00:00Z", "en", { since: "since {date}" })).toBe("since September 18");
    expect(waitedPhrase(12, null, "en", { since: "since {date}" })).toBe("12 days ago");
  });

  it("treats a pause code like any pause: the news is that it stopped", () => {
    const brief = composeBrief({ ...base, workflows: [{ name: "Digest", active: true, due_in_hours: 5, paused_reason: "no_key" }] });
    expect(brief.next).toEqual({ name: "Digest", dueInHours: null, paused: true });
  });
});
