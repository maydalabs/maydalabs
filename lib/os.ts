/* MaydaOS beta vocabulary and pure helpers.
 *
 * No node imports: client components render from this module. Anything that
 * touches the network or the model lives in lib/osSources.ts and
 * lib/osDraft.ts.
 */

export const OS_SHAPES = ["note", "post", "summary"] as const;
export type OsShape = (typeof OS_SHAPES)[number];

export const OS_DECISIONS = ["pending", "approved", "rejected"] as const;
export type OsDecision = (typeof OS_DECISIONS)[number];

/* What a newly installed workflow may spend per month until the operator
 * sets its real number. Small on purpose: an unset budget should be noticed
 * in the first week, not at the end of the month. */
export const OS_DEFAULT_MONTHLY_BUDGET_USD = 5;

/* Guards that keep one person from emptying the budget. */
export const OS_MAX_SOURCES = 5;
export const OS_MIN_SOURCES = 1;
export const OS_SOURCE_CHAR_LIMIT = 6000;
export const OS_TOPIC_LIMIT = 300;

/* Opus 5, because the draft quality is the entire demonstration. Effort is
 * the cost lever that matters: thinking bills as output, and writing a short
 * note from sources the reader supplied is not reasoning-heavy work. */
export const OS_MODEL = "claude-opus-5";
export const OS_EFFORT = "low";

/* Per million tokens, matching the model above. Used to record what each run
 * actually cost, so "what does a user cost" is a number and not a feeling. */
export const OS_INPUT_USD_PER_MTOK = 5;
export const OS_OUTPUT_USD_PER_MTOK = 25;

export function runCostUsd(inputTokens: number, outputTokens: number): number {
  const input = (Math.max(0, inputTokens) / 1_000_000) * OS_INPUT_USD_PER_MTOK;
  const output = (Math.max(0, outputTokens) / 1_000_000) * OS_OUTPUT_USD_PER_MTOK;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}

/* The first instant of the current calendar month, in UTC.
 *
 * Calendar month rather than a rolling window: a client reading "spent this
 * month" means the month on the calendar, and a rolling 30 days would make
 * the same workflow affordable or not depending on the day it is asked. */
export function monthStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/* Money as the client reads it. Two decimals always, so a budget of five
 * dollars is "$5.00" and never "$5". */
export function formatUsd(value: number): string {
  return `$${(Math.round(value * 100) / 100).toFixed(2)}`;
}

export type OsBudget = { spentUsd: number; budgetUsd: number; leftUsd: number; exhausted: boolean };

/* What a workflow has left this month. Rounded to the cent it is reported in,
 * so a balance of a thousandth of a cent does not read as money left. */
export function workflowBudget(spentUsd: number, budgetUsd: number): OsBudget {
  const spent = Math.max(0, Math.round(spentUsd * 100) / 100);
  const budget = Math.max(0, Math.round(budgetUsd * 100) / 100);
  const left = Math.round((budget - spent) * 100) / 100;
  return { spentUsd: spent, budgetUsd: budget, leftUsd: Math.max(0, left), exhausted: left <= 0 };
}

/* A workflow's instruction lives in the os_workflows row, not here: a
 * different workflow per client is the whole point. */
export type OsWorkflow = {
  id: string;
  key: string;
  name: string;
  purpose: string;
  brief: string;
  shape: OsShape;
  destination: string | null;
  max_sources: number;
  owner_user_id: string | null;
  /* Required on purpose: a page that forgets to select these silently made
   * the desk demand links from a workflow that already had its own. */
  standing_sources: unknown;
  window_days: number;
  /* Required for the same reason as the two above: a page that forgets to
   * select it would render a budget of zero and refuse to run. */
  monthly_budget_usd: number;
};

/* http(s) only, and no credentials or fragments smuggled in. Shape only;
 * whether the host is safe to fetch is decided in lib/osSources.ts. */
export function normalizeSourceUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname.includes(".")) return null;
  url.hash = "";
  return url.toString();
}

export function parseSourceUrls(raw: string): { urls: string[]; rejected: string[] } {
  const urls: string[] = [];
  const rejected: string[] = [];
  for (const line of raw.split(/[\s,]+/)) {
    if (!line.trim()) continue;
    const normalized = normalizeSourceUrl(line);
    if (!normalized) rejected.push(line.trim().slice(0, 80));
    else if (!urls.includes(normalized)) urls.push(normalized);
  }
  return { urls: urls.slice(0, OS_MAX_SOURCES), rejected };
}

/* A source the workflow reads on every run, before anything a person adds. */
export type StandingSource = { url: string; kind: "page" | "feed" };

export function parseStandingSources(raw: string): StandingSource[] {
  const out: StandingSource[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // "feed https://..." or just a URL; the fetcher confirms which it is.
    const explicitFeed = /^feed\s+/i.test(trimmed);
    const url = normalizeSourceUrl(trimmed.replace(/^feed\s+/i, ""));
    if (!url) continue;
    if (out.some((entry) => entry.url === url)) continue;
    out.push({ url, kind: explicitFeed ? "feed" : "page" });
    if (out.length >= 10) break;
  }
  return out;
}

export function asStandingSources(value: unknown): StandingSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    if (typeof entry.url !== "string") return [];
    return [{ url: entry.url, kind: entry.kind === "feed" ? "feed" : "page" }] as StandingSource[];
  });
}

export function standingSourcesToText(sources: StandingSource[]): string {
  return sources.map((source) => (source.kind === "feed" ? `feed ${source.url}` : source.url)).join("\n");
}

/* Narrowing database rows into workflows.
 *
 * The constraint is the point: a query that forgets a column will not
 * satisfy it and the build fails, rather than the desk quietly behaving as
 * though the workflow had no sources of its own. The shape is narrowed here
 * because the database column is a plain string.
 */
export function toOsWorkflows<T extends Omit<OsWorkflow, "shape"> & { shape: string }>(rows: T[]): OsWorkflow[] {
  return rows.map((row) => ({
    ...row,
    shape: (OS_SHAPES as readonly string[]).includes(row.shape) ? (row.shape as OsShape) : "note",
  }));
}
