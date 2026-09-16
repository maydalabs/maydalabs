import { describe, expect, it } from "vitest";
import { sanitizeLayout } from "@/lib/osDesktop";

describe("a desk on its way into the database", () => {
  /* The positive case first. Everything below is a rejection, and a suite of
   * rejections passes just as well when nothing is ever stored — which would
   * mean a desk that silently forgets every window you moved. */
  it("keeps a layout a person actually arranged", () => {
    expect(
      sanitizeLayout([{ app: "running", x: 120, y: 64, w: 500, h: 400, z: 3, open: true, minimized: false }]),
    ).toEqual([{ app: "running", x: 120, y: 64, w: 500, h: 400, z: 3, open: true, minimized: false }]);
  });

  it("drops apps that do not exist", () => {
    expect(sanitizeLayout([{ app: "../etc/passwd" }, { app: "billing" }, { app: 7 }])).toEqual([]);
  });

  it("keeps one window per app, not the second claim on it", () => {
    const out = sanitizeLayout([
      { app: "company", x: 10, y: 10 },
      { app: "company", x: 999, y: 999 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].x).toBe(10);
  });

  it("refuses a window that could not be seen or could not be escaped", () => {
    const [tiny] = sanitizeLayout([{ app: "company", w: 1, h: 1 }]);
    expect(tiny.w).toBe(200);
    expect(tiny.h).toBe(120);

    const [huge] = sanitizeLayout([{ app: "company", w: 1e9, h: 1e9, x: 1e9 }]);
    expect(huge.w).toBe(8000);
    expect(huge.x).toBe(8000);
  });

  it("treats nonsense numbers as absent rather than storing them", () => {
    const [row] = sanitizeLayout([{ app: "needs-you", x: Number.NaN, y: Infinity, z: "3" }]);
    expect(row.x).toBe(40);
    expect(row.y).toBe(40);
    expect(row.z).toBe(1);
  });

  it("stores only real booleans, so a truthy string cannot open a window", () => {
    const [row] = sanitizeLayout([{ app: "needs-you", open: "yes", minimized: 1 }]);
    expect(row.open).toBe(false);
    expect(row.minimized).toBe(false);
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
