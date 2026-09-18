import { describe, expect, it } from "vitest";
import { composeBrief, countSentence } from "@/lib/osBrief";

/* What the desk says before anyone clicks. Pure, so a given morning can be
 * asserted without a browser or a database. */

const forms = { none: "Nothing needs you.", one: "One thing needs you.", many: "{n} things need you." };

describe("the brief", () => {
  it("leads with the longest-waiting, three at most, and counts the rest", () => {
    const brief = composeBrief({
      needs: [
        { id: "a", title: "A", status: "review", waiting_days: 1 },
        { id: "b", title: "B", status: "blocked", waiting_days: 9 },
        { id: "c", title: "C", status: "approved", waiting_days: 4 },
        { id: "d", title: "D", status: "review", waiting_days: 0 },
      ],
      needCount: 7,
      changes: 2,
      lastChange: { title: "B", event: "added", by_a_person: true },
      workflows: [],
      finishedThisFortnight: 1,
    });

    expect(brief.needs.map((n) => n.id)).toEqual(["b", "c", "a"]);
    expect(brief.needCount).toBe(7);
    expect(brief.changes).toBe(2);
    expect(brief.lastChange).toEqual({ title: "B", event: "added", byAPerson: true });
    expect(brief.next).toBeNull();
    expect(brief.finishedThisFortnight).toBe(1);
  });

  it("drops rows the view could not fill in, and never counts fewer than it shows", () => {
    const brief = composeBrief({
      needs: [
        { id: "a", title: "A", status: "review", waiting_days: null },
        { id: null, title: "ghost", status: "review", waiting_days: 3 },
      ],
      needCount: 0,
      changes: null,
      lastChange: null,
      workflows: [],
      finishedThisFortnight: -3,
    });

    expect(brief.needs).toEqual([{ id: "a", title: "A", status: "review", waitingDays: 0 }]);
    expect(brief.needCount).toBe(1);
    expect(brief.finishedThisFortnight).toBe(0);
  });

  /* "Nothing has changed since you last looked" is false on a first visit:
   * the person has never looked. Null means the sentence is not said. */
  it("says nothing about changes when the desk has never been marked seen", () => {
    const brief = composeBrief({
      needs: [],
      needCount: 0,
      changes: null,
      lastChange: { title: "X", event: "added", by_a_person: true },
      workflows: [],
      finishedThisFortnight: 0,
    });
    expect(brief.changes).toBeNull();
    expect(brief.lastChange).toBeNull();
  });

  it("names the soonest running workflow, and a paused one only when nothing runs", () => {
    const soonest = composeBrief({
      needs: [],
      needCount: 0,
      changes: 0,
      lastChange: null,
      workflows: [
        { name: "Weekly brief", active: true, due_in_hours: 70, paused_reason: null },
        { name: "Daily scan", active: true, due_in_hours: 5, paused_reason: null },
        { name: "Old one", active: false, due_in_hours: 1, paused_reason: null },
        { name: "Stuck one", active: true, due_in_hours: 2, paused_reason: "No standing sources." },
      ],
      finishedThisFortnight: 0,
    });
    expect(soonest.next).toEqual({ name: "Daily scan", dueInHours: 5, paused: false });

    const onlyPaused = composeBrief({
      needs: [],
      needCount: 0,
      changes: 0,
      lastChange: null,
      workflows: [{ name: "Stuck one", active: true, due_in_hours: 2, paused_reason: "No standing sources." }],
      finishedThisFortnight: 0,
    });
    expect(onlyPaused.next).toEqual({ name: "Stuck one", dueInHours: null, paused: true });
  });

  it("turns a count into a sentence rather than a counter", () => {
    expect(countSentence(0, forms)).toBe("Nothing needs you.");
    expect(countSentence(1, forms)).toBe("One thing needs you.");
    expect(countSentence(4, forms)).toBe("4 things need you.");
  });
});
