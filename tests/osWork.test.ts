import { describe, expect, it } from "vitest";
import { groupWork } from "@/lib/osWork";

const row = (id: string, lane: string, status: string, updated_at = "2026-09-17T10:00:00Z") => ({
  id,
  title: id,
  lane,
  kind: "task",
  status,
  updated_at,
});

describe("everything open, arranged", () => {
  it("groups by lane, in the order a business is thought about", () => {
    const { open } = groupWork([row("a", "finance", "drafted"), row("b", "sales", "drafted"), row("c", "content", "drafted")]);
    expect(open.map((g) => g.lane)).toEqual(["sales", "content", "finance"]);
  });

  it("keeps a lane nobody planned for, after the known ones", () => {
    const { open } = groupWork([row("a", "legal", "drafted"), row("b", "ops", "drafted"), row("c", "hiring", "drafted")]);
    expect(open.map((g) => g.lane)).toEqual(["ops", "hiring", "legal"]);
  });

  it("leads each lane with what wants a person", () => {
    const { open } = groupWork([
      row("note", "sales", "drafted"),
      row("stuck", "sales", "blocked"),
      row("decide", "sales", "review"),
      row("todo", "sales", "approved"),
      row("new", "sales", "pending"),
    ]);
    expect(open[0].items.map((i) => i.id)).toEqual(["decide", "todo", "stuck", "note", "new"]);
    expect(open[0].needsYou).toBe(3);
  });

  it("puts the newest first among equals", () => {
    const { open } = groupWork([
      row("older", "ops", "drafted", "2026-09-10T10:00:00Z"),
      row("newer", "ops", "drafted", "2026-09-16T10:00:00Z"),
    ]);
    expect(open[0].items.map((i) => i.id)).toEqual(["newer", "older"]);
  });

  it("gives finished work its own place and drops dismissed work entirely", () => {
    const { open, finished } = groupWork([
      row("live", "ops", "drafted"),
      row("done", "ops", "completed"),
      row("gone", "ops", "canceled"),
    ]);
    expect(open[0].items.map((i) => i.id)).toEqual(["live"]);
    expect(finished.map((i) => i.id)).toEqual(["done"]);
  });

  it("treats a blank or oddly-cased lane as the lane it means", () => {
    const { open } = groupWork([row("a", " Sales ", "drafted"), row("b", "sales", "drafted"), row("c", "", "drafted")]);
    expect(open.map((g) => [g.lane, g.items.length])).toEqual([
      ["sales", 2],
      ["other", 1],
    ]);
  });

  it("is empty when there is nothing, rather than a list of empty lanes", () => {
    expect(groupWork([])).toEqual({ open: [], finished: [] });
  });
});
