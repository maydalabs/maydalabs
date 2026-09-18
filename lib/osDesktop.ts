/* Where a person's windows are, on the way into the database.
 *
 * This is the only place in MaydaOS where a browser writes into a jsonb
 * column, so whatever arrives is rebuilt here rather than stored. A layout is
 * low-stakes right up until "low-stakes" is the reason a column became a
 * place to put arbitrary things.
 */

export const OS_APP_IDS = ["cofounder", "needs-you", "work", "running", "record", "memory", "company", "settings"] as const;
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

/* A stored layout on the way back out of the database, into windows.
 *
 * Whatever was saved may be from an older version of the product. Anything
 * unrecognised is dropped and anything missing gets the app's default — a
 * desk that half-restores is better than a desk that throws.
 */
export type HydratableApp<K extends string> = {
  id: K;
  defaultRect: { x: number; y: number; w: number; h: number };
  openByDefault?: boolean;
  dormant?: boolean;
};

export type HydratedWindow<K extends string> = Omit<StoredWindow, "app"> & { app: K };

const DOCUMENT_DEFAULT = { x: 0.12, y: 0.1, w: 0.5, h: 0.72 };

function readNumber(saved: Record<string, unknown> | undefined, key: string): number | null {
  const value = saved?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function wasPlaced(saved: Record<string, unknown> | undefined): boolean {
  if (!saved) return false;
  if (typeof saved.placed === "boolean") return saved.placed;
  // A desk saved before windows had the flag holds pixels and says so only
  // by their size: a share is never more than 2.
  return looksLikePixels(saved);
}

export function hydrateWindows<K extends string>(
  apps: HydratableApp<K>[],
  documents: { key: K }[],
  stored: unknown,
): HydratedWindow<K>[] {
  const rows = Array.isArray(stored) ? stored : [];
  const byApp = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (row && typeof row === "object" && typeof (row as { app?: unknown }).app === "string") {
      byApp.set((row as { app: string }).app, row as Record<string, unknown>);
    }
  }

  const windows: HydratedWindow<K>[] = apps.map((app, index) => {
    const saved = byApp.get(app.id);
    const placed = wasPlaced(saved);

    /* `placed` is the whole responsive story. A window nobody has moved is
     * positioned as a share of the surface, so a fresh desk is laid out for
     * the screen in front of you rather than for the one it was built on.
     * The moment someone drags it, it becomes pixels — because at that point
     * they mean *there*, not "44% of the way across".
     *
     * And a window nobody has moved takes the app's *current* default rather
     * than the default that was saved with it: the designer's arrangement may
     * improve, and a person who never expressed a preference should get the
     * improvement. */
    const rect = placed
      ? {
          x: readNumber(saved, "x") ?? app.defaultRect.x,
          y: readNumber(saved, "y") ?? app.defaultRect.y,
          w: readNumber(saved, "w") ?? app.defaultRect.w,
          h: readNumber(saved, "h") ?? app.defaultRect.h,
        }
      : app.defaultRect;

    const savedOpen = typeof saved?.open === "boolean" ? saved.open : null;
    return {
      app: app.id,
      ...rect,
      z: readNumber(saved, "z") ?? index + 1,
      open: app.dormant ? false : (savedOpen ?? Boolean(app.openByDefault)),
      minimized: saved?.minimized === true,
      placed,
    };
  });

  /* A remembered document window comes back only if its item is still open
   * work. A window onto finished work would be a window onto nothing, so it
   * is dropped rather than restored empty. */
  documents.forEach((doc, index) => {
    const saved = byApp.get(doc.key);
    if (!saved || saved.open !== true) return;
    const placed = wasPlaced(saved);
    windows.push({
      app: doc.key,
      ...(placed
        ? {
            x: readNumber(saved, "x") ?? DOCUMENT_DEFAULT.x,
            y: readNumber(saved, "y") ?? DOCUMENT_DEFAULT.y,
            w: readNumber(saved, "w") ?? DOCUMENT_DEFAULT.w,
            h: readNumber(saved, "h") ?? DOCUMENT_DEFAULT.h,
          }
        : DOCUMENT_DEFAULT),
      z: readNumber(saved, "z") ?? apps.length + index + 1,
      open: true,
      minimized: saved.minimized === true,
      placed,
    });
  });

  return windows;
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

/* A person's preferences, on the way into the database.
 *
 * Allowlists, not schemas: a preference is one of a few named choices, and
 * anything else — a colour typed by hand, a key nobody defined — is dropped
 * rather than stored. The defaults are the desk as it ships.
 */
export const OS_ACCENTS = ["periwinkle", "amber", "mint", "rose"] as const;
export const OS_MOODS = ["lamp", "ember", "sea", "plain"] as const;

export type OsAccent = (typeof OS_ACCENTS)[number];
export type OsMood = (typeof OS_MOODS)[number];
export type OsPrefs = { accent: OsAccent; mood: OsMood };

export const DEFAULT_PREFS: OsPrefs = { accent: "periwinkle", mood: "lamp" };

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function sanitizePrefs(value: unknown): OsPrefs {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    accent: oneOf(item.accent, OS_ACCENTS, DEFAULT_PREFS.accent),
    mood: oneOf(item.mood, OS_MOODS, DEFAULT_PREFS.mood),
  };
}
