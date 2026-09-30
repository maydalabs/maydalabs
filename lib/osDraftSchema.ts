/* The one JSON shape a draft comes back in.
 *
 * Every provider that can be asked for a schema gets this one: Ollama's
 * `format`, an OpenAI-compatible `response_format`, and the Anthropic SDK's
 * structured output (which takes the zod form in lib/osDraft.ts). A claim
 * carries its source or null; a body that does not fit is not a draft. No
 * imports, so any adapter may use it without a cycle.
 */

/* How long one draft may take. Hosted providers get a minute: the daily tick
 * makes five calls in sequence inside a 300-second function, and one company
 * whose endpoint hangs must not take the day from every other company. A
 * model on this machine gets ten, because it is slow and never on Vercel. */
export const DRAFT_TIMEOUT_MS = 60_000;
export const LOCAL_DRAFT_TIMEOUT_MS = 600_000;

export const DRAFT_JSON_SCHEMA = {
  type: "object",
  properties: {
    draft: { type: "string" },
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, source_url: { type: ["string", "null"] } },
        required: ["text", "source_url"],
        additionalProperties: false,
      },
    },
  },
  required: ["draft", "claims"],
  additionalProperties: false,
};

export type DraftJson = { draft: string; claims: { text: string; source_url: string | null }[] };

/* Narrow a body to a draft, or to nothing. A claim without text is dropped;
 * a source that is not a string is null, never a guess. */
export function parseDraftJson(text: string | null | undefined): DraftJson | null {
  if (!text) return null;
  let candidate: unknown;
  try {
    candidate = JSON.parse(text);
  } catch {
    return null;
  }
  if (!candidate || typeof candidate !== "object") return null;
  const record = candidate as { draft?: unknown; claims?: unknown };
  if (typeof record.draft !== "string" || !Array.isArray(record.claims)) return null;
  return {
    draft: record.draft,
    claims: record.claims
      .filter((c): c is { text: string; source_url?: unknown } => Boolean(c) && typeof (c as { text?: unknown }).text === "string")
      .map((c) => ({ text: c.text, source_url: typeof c.source_url === "string" ? c.source_url : null })),
  };
}
