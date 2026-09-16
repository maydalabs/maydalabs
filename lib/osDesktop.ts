/* Where a person's windows are, on the way into the database.
 *
 * This is the only place in MaydaOS where a browser writes into a jsonb
 * column, so whatever arrives is rebuilt here rather than stored. A layout is
 * low-stakes right up until "low-stakes" is the reason a column became a
 * place to put arbitrary things.
 */

export const OS_APP_IDS = ["cofounder", "needs-you", "running", "memory", "company"] as const;
export type OsKnownAppId = (typeof OS_APP_IDS)[number];

const KNOWN = new Set<string>(OS_APP_IDS);
const MAX_WINDOWS = 40;

export type StoredWindow = {
  app: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  open: boolean;
  minimized: boolean;
};

function bounded(value: unknown, low: number, high: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.round(Math.min(Math.max(value, low), high));
}

export function sanitizeLayout(rows: unknown): StoredWindow[] {
  if (!Array.isArray(rows)) return [];

  const seen = new Set<string>();
  const out: StoredWindow[] = [];

  for (const row of rows.slice(0, MAX_WINDOWS)) {
    const item = (row ?? {}) as Record<string, unknown>;
    const app = item.app;
    // An app we do not have is an app we will not store: a layout should not
    // outlive the thing it arranges.
    if (typeof app !== "string" || !KNOWN.has(app) || seen.has(app)) continue;
    seen.add(app);

    out.push({
      app,
      x: bounded(item.x, -4000, 8000, 40),
      y: bounded(item.y, -4000, 8000, 40),
      // A window narrower than this cannot show its own title bar, and one
      // larger than any screen is how a desk becomes unusable from a value
      // nobody typed on purpose.
      w: bounded(item.w, 200, 8000, 520),
      h: bounded(item.h, 120, 8000, 420),
      z: bounded(item.z, 0, 1000, 1),
      open: item.open === true,
      minimized: item.minimized === true,
    });
  }

  return out;
}
