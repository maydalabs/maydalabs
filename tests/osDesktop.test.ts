import { describe, expect, it } from "vitest";
import { hydrateWindows, sanitizeLayout } from "@/lib/osDesktop";

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

  /* A document window is keyed by the work item it shows. It must be
   * remembered like any window, and only a real uuid may follow the prefix:
   * a key nobody can look up is a window that renders nothing forever. */
  it("remembers a document window where it was left", () => {
    const [row] = sanitizeLayout([
      { app: "item:3f2a9c1e-4b7d-4e8a-9c2b-1d5e6f7a8b9c", x: 0.14, y: 0.1, w: 0.5, h: 0.74, z: 9, open: true },
    ]);
    expect(row.app).toBe("item:3f2a9c1e-4b7d-4e8a-9c2b-1d5e6f7a8b9c");
    expect(row.open).toBe(true);
    expect(row.w).toBe(0.5);
  });

  it("refuses a document key that is not a real item", () => {
    expect(
      sanitizeLayout([{ app: "item:not-an-id" }, { app: "item:../../etc" }, { app: "item:" }, { app: "item" }]),
    ).toEqual([]);
  });

  it("knows the work app, so its window is remembered like any other", () => {
    const [row] = sanitizeLayout([{ app: "work", x: 0.08, y: 0.1, w: 0.6, h: 0.7, open: true }]);
    expect(row.app).toBe("work");
    expect(row.open).toBe(true);
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

/* The same layout on its way back out: into windows the shell can show. */
describe("a desk on its way out of the database", () => {
  const apps = [
    { id: "cofounder", defaultRect: { x: 0.44, y: 0.03, w: 0.535, h: 0.9 }, openByDefault: true },
    { id: "needs-you", defaultRect: { x: 0.44, y: 0.03, w: 0.535, h: 0.56 }, openByDefault: false },
  ];

  it("gives a fresh desk the defaults, with nothing placed", () => {
    const windows = hydrateWindows(apps, [], null);
    expect(windows).toEqual([
      { app: "cofounder", x: 0.44, y: 0.03, w: 0.535, h: 0.9, z: 1, open: true, minimized: false, placed: false },
      { app: "needs-you", x: 0.44, y: 0.03, w: 0.535, h: 0.56, z: 2, open: false, minimized: false, placed: false },
    ]);
  });

  it("restores a window where a person left it", () => {
    const [win] = hydrateWindows(
      apps,
      [],
      [{ app: "cofounder", x: 120, y: 64, w: 500, h: 400, z: 7, open: true, minimized: true, placed: true }],
    );
    expect(win).toEqual({ app: "cofounder", x: 120, y: 64, w: 500, h: 400, z: 7, open: true, minimized: true, placed: true });
  });

  /* A window nobody has moved carried its old default in the saved layout.
   * The designer's arrangement can improve, and a person who never expressed
   * a preference should get the improvement — so the saved shares are
   * ignored and the app's current default wins. */
  it("moves an untouched window to the app's current default, not the default it was saved with", () => {
    const [win] = hydrateWindows(
      apps,
      [],
      [{ app: "cofounder", x: 0.025, y: 0.03, w: 0.45, h: 0.9, z: 3, open: false, minimized: false, placed: false }],
    );
    expect(win).toMatchObject({ x: 0.44, w: 0.535, placed: false, open: false, z: 3 });
  });

  it("recognises pixels saved before the flag existed as a placed window", () => {
    const [win] = hydrateWindows(apps, [], [{ app: "cofounder", x: 300, y: 40, w: 640, h: 480, open: true }]);
    expect(win).toMatchObject({ x: 300, w: 640, placed: true });
  });

  /* The co-founder without a model behind it. It loads closed whatever the
   * saved desk says, because a window that cannot answer should not be the
   * first thing on the desk — and it can still be opened from the dock. */
  it("loads a dormant app closed even when the saved desk had it open", () => {
    const [win] = hydrateWindows(
      [{ ...apps[0], dormant: true }],
      [],
      [{ app: "cofounder", x: 0.025, y: 0.03, w: 0.45, h: 0.9, open: true, placed: false }],
    );
    expect(win.open).toBe(false);
  });

  it("brings back a remembered document only while it is still open work", () => {
    const stored = [
      { app: "item:11111111-1111-4111-8111-111111111111", x: 0.2, y: 0.2, w: 0.5, h: 0.6, open: true, placed: false },
      { app: "item:22222222-2222-4222-8222-222222222222", x: 0.2, y: 0.2, w: 0.5, h: 0.6, open: true, placed: false },
    ];
    const windows = hydrateWindows(apps, [{ key: "item:11111111-1111-4111-8111-111111111111" }], stored);
    expect(windows.map((w) => w.app)).toEqual(["cofounder", "needs-you", "item:11111111-1111-4111-8111-111111111111"]);
    expect(windows[2]).toMatchObject({ open: true, placed: false, z: 3 });
  });

  it("ignores rows that are not windows at all", () => {
    expect(hydrateWindows(apps, [], [null, 42, "cofounder", { x: 1 }]).map((w) => w.app)).toEqual(["cofounder", "needs-you"]);
  });
});
