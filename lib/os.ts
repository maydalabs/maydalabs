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

/* Ten for life, not ten a week. A refill costs money forever and never asks
 * anyone to decide anything; a wall is where the conversation starts. */
export const OS_STARTING_CREDITS = 10;

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

export function creditsLeft(granted: number, used: number): number {
  return Math.max(0, granted - used);
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
