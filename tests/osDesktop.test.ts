import { describe, expect, it } from "vitest";
import { sanitizeLayout } from "@/lib/osDesktop";

/* A window a person has dragged is stored in pixels; one they have never
 * touched is stored as a share of the surface, so that a fresh desk fits the
 * screen it opens on rather than the one it was designed on. The two cannot
 * share a set of bounds — rounding a 0.45 share to the nearest integer stores
 * a zero — so both are exercised here. */
const placed = (extra: Record<string, unknown> = {}) => ({ placed: true, ...extra });

describe("a desk on its way into the database", () => {
  /* The positive case first. Everything below is a rejection, and a suite of
   * rejections passes just as well when nothing is ever stored — which would
   * mean a desk that silently forgets every window you moved. */
  it("keeps a layout a person actually arranged", () => {
    expect(
      sanitizeLayout([
        { app: "running", x: 120, y: 64, w: 500, h: 400, z: 3, open: true, minimized: false, placed: true },
      ]),
    ).toEqual([
      { app: "running", x: 120, y: 64, w: 500, h: 400, z: 3, open: true, minimized: false, placed: true },
    ]);
  });

  it("keeps a default nobody has moved as a share of the surface", () => {
    const [row] = sanitizeLayout([{ app: "cofounder", x: 0.025, y: 0.03, w: 0.45, h: 0.9, open: true }]);
    expect(row.placed).toBe(false);
    expect(row.x).toBe(0.025);
    expect(row.w).toBe(0.45);
    // Not rounded to an integer, which would store a window of zero width.
    expect(row.h).toBe(0.9);
  });

  /* Desks saved before windows carried the flag hold pixels and say nothing
   * about it. Reading those as shares put every window at twice the width of
   * the screen, which is exactly what it looked like. */
  it("recognises a desk saved before shares existed", () => {
    const [row] = sanitizeLayout([{ app: "cofounder", x: 48, y: 40, w: 560, h: 520, open: true }]);
    expect(row.placed).toBe(true);
    expect(row.w).toBe(560);
  });

  it("does not mistake a share for a forgotten pixel value", () => {
    const [row] = sanitizeLayout([{ app: "cofounder", x: 0.025, y: 0.03, w: 0.45, h: 0.9 }]);
    expect(row.placed).toBe(false);
  });

  it("drops apps that do not exist", () => {
    expect(sanitizeLayout([{ app: "../etc/passwd" }, { app: "billing" }, { app: 7 }])).toEqual([]);
  });

  it("keeps one window per app, not the second claim on it", () => {
    const out = sanitizeLayout([
      placed({ app: "company", x: 10, y: 10 }),
      placed({ app: "company", x: 999, y: 999 }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].x).toBe(10);
  });

  it("refuses a window that could not be seen or could not be escaped", () => {
    const [tiny] = sanitizeLayout([placed({ app: "company", w: 1, h: 1 })]);
    expect(tiny.w).toBe(200);
    expect(tiny.h).toBe(120);

    const [huge] = sanitizeLayout([placed({ app: "company", w: 1e9, h: 1e9, x: 1e9 })]);
    expect(huge.w).toBe(8000);
    expect(huge.x).toBe(8000);

    /* And a share cannot be used to escape either. Said explicitly, because
     * an unflagged 9e9 is read as pixels by the compatibility rule above —
     * both readings are bounded, and this one names which is being tested. */
    const [wild] = sanitizeLayout([{ app: "company", x: 9e9, w: 9e9, placed: false }]);
    expect(wild.x).toBe(2);
    expect(wild.w).toBe(2);
  });

  it("treats nonsense numbers as absent rather than storing them", () => {
    const [row] = sanitizeLayout([placed({ app: "needs-you", x: Number.NaN, y: Infinity, z: "3" })]);
    expect(row.x).toBe(40);
    expect(row.y).toBe(40);
    expect(row.z).toBe(1);
  });

  it("stores only real booleans, so a truthy string cannot open or place a window", () => {
    const [row] = sanitizeLayout([{ app: "needs-you", open: "yes", minimized: 1, placed: "true" }]);
    expect(row.open).toBe(false);
    expect(row.minimized).toBe(false);
    expect(row.placed).toBe(false);
  });

  it("survives anything that is not a layout at all", () => {
    for (const junk of [null, undefined, "[]", 42, {}, [null], [undefined]]) {
      expect(sanitizeLayout(junk)).toEqual([]);
    }
  });

  it("will not accept more windows than there are apps to fill", () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ app: `app-${i}` }));
    expect(sanitizeLayout(many)).toEqual([]);
  });
});
