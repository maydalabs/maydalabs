/* Where a person's windows are, on the way into the database.
 *
 * This is the only place in MaydaOS where a browser writes into a jsonb
 * column, so whatever arrives is rebuilt here rather than stored. A layout is
 * low-stakes right up until "low-stakes" is the reason a column became a
 * place to put arbitrary things.
 */

export const OS_APP_IDS = ["cofounder", "needs-you", "running", "record", "memory", "company"] as const;
export type OsKnownAppId = (typeof OS_APP_IDS)[number];

const KNOWN = new Set<string>(OS_APP_IDS);
const MAX_WINDOWS = 40;

/* A document window is keyed by the work item it shows. Only a real uuid is
 * accepted after the prefix: the key is later used to look the item up, and
 * a key nobody can look up is a window that renders nothing forever. */
const DOCUMENT_KEY = /^item:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function knownWindow(app: string): boolean {
  return KNOWN.has(app) || DOCUMENT_KEY.test(app);
}

export type StoredWindow = {
  app: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  open: boolean;
  minimized: boolean;
  placed: boolean;
};

/* Desks saved before windows had a `placed` flag hold pixels and say nothing
 * about it. A share is never more than 2, and a window is never 3px wide, so
 * the values identify themselves — which beats a one-off migration that would
 * have to run against every stored desk and then be kept forever. */
function looksLikePixels(item: Record<string, unknown>): boolean {
  if ("placed" in item) return false;
  return (["x", "y", "w", "h"] as const).some(
    (key) => typeof item[key] === "number" && Math.abs(item[key] as number) > 2,
  );
}

/* A share of the surface, kept inside sane bounds and to three decimals —
 * more precision than that is noise in a jsonb column. */
function share(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.round(Math.min(Math.max(value, -2), 2) * 1000) / 1000;
}

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
    if (typeof app !== "string" || !knownWindow(app) || seen.has(app)) continue;
    seen.add(app);

    /* Until a window is placed, x/y/w/h are shares of the surface rather than
     * pixels, so the two cases cannot share one set of bounds — rounding a
     * 0.45 share to the nearest integer would store zero. */
    const placed = item.placed === true || looksLikePixels(item);

    out.push({
      app,
      x: placed ? bounded(item.x, -4000, 8000, 40) : share(item.x, 0.02),
      y: placed ? bounded(item.y, -4000, 8000, 40) : share(item.y, 0.03),
      // A window narrower than this cannot show its own title bar, and one
      // larger than any screen is how a desk becomes unusable from a value
      // nobody typed on purpose.
      w: placed ? bounded(item.w, 200, 8000, 520) : share(item.w, 0.45),
      h: placed ? bounded(item.h, 120, 8000, 420) : share(item.h, 0.6),
      z: bounded(item.z, 0, 1000, 1),
      open: item.open === true,
      minimized: item.minimized === true,
      placed,
    });
  }

  return out;
}
