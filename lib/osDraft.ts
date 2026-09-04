/* The model call behind one MaydaOS run.
 *
 * Structured output, so every claim comes back attached to the source it
 * came from, or explicitly attached to nothing. That pairing is the whole
 * product: a person approving work can see what is supported before they
 * put their name on it.
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { OS_EFFORT, OS_MODEL } from "@/lib/os";
import type { FetchedSource } from "@/lib/osSources";

const DraftSchema = z.object({
  draft: z.string(),
  claims: z.array(
    z.object({
      text: z.string(),
      source_url: z.string().nullable(),
    }),
  ),
});

export type OsDraft = {
  draft: string;
  claims: { text: string; source_url: string | null }[];
  inputTokens: number;
  outputTokens: number;
};

const SYSTEM = `You draft short pieces from sources a person supplies, for MaydaOS.

Binding rules:
- Every factual claim must come from the supplied sources. Attach the exact source URL to each claim.
- A claim you cannot support from the sources gets source_url null. Prefer writing fewer claims to inventing one.
- Never invent a number, a name, a quote, or a date. If the sources disagree, say so.
- Plain sentences, specific nouns. No hype, no slogans, no emoji, no hashtags.
- Write in the language of the topic the person gave you.
- You do not publish anything. A person reads this and decides. Do not add calls to click, follow, or subscribe.

The claims array is what the reader checks before approving, so it must cover the substantive statements in the draft, in the order they appear.`;

function buildUserMessage(topic: string, brief: string, sources: FetchedSource[]): string {
  const rendered = sources
    .map((source, index) => `<source index="${index + 1}" url="${source.url}" title="${source.title}">\n${source.text}\n</source>`)
    .join("\n\n");
  return `Topic: ${topic}

Write ${brief}

Sources:

${rendered}`;
}

export function isOsConfigured(): boolean {
  return Boolean(process.env.MAYDAOS_ANTHROPIC_API_KEY);
}

/* The one call the tests need to stand in for. */
export type DraftClient = {
  messages: {
    parse: (params: Record<string, unknown>) => Promise<{
      parsed_output: { draft: string; claims: { text: string; source_url: string | null }[] } | null;
      stop_reason: string | null;
      usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null };
    }>;
  };
};

export async function draftFromSources(
  topic: string,
  /* The workflow's own instruction. This is what makes one workflow
   * different from another, and it lives in a row rather than in here. */
  brief: string,
  sources: FetchedSource[],
  injected?: DraftClient,
): Promise<OsDraft | { error: string }> {
  const apiKey = process.env.MAYDAOS_ANTHROPIC_API_KEY;
  if (!injected && !apiKey) return { error: "MaydaOS is not configured." };

  const client: DraftClient = injected ?? (new Anthropic({ apiKey }) as unknown as DraftClient);
  try {
    const response = await client.messages.parse({
      model: OS_MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: OS_EFFORT, format: zodOutputFormat(DraftSchema) },
      messages: [{ role: "user", content: buildUserMessage(topic, brief, sources) }],
    });

    // A refusal or a schema miss leaves parsed_output null; never pretend.
    const parsed = response.parsed_output;
    if (!parsed || !parsed.draft.trim()) {
      return { error: response.stop_reason === "refusal" ? "The model declined this request." : "The model returned nothing usable." };
    }

    const known = new Set(sources.map((source) => source.url));
    return {
      draft: parsed.draft.trim(),
      // A URL the model did not receive is not evidence, whatever it says.
      claims: parsed.claims.map((claim) => ({
        text: claim.text,
        source_url: claim.source_url && known.has(claim.source_url) ? claim.source_url : null,
      })),
      inputTokens: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0),
      outputTokens: response.usage.output_tokens,
    };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { error: "The model is rate limited. Try again in a moment." };
    if (error instanceof Anthropic.AuthenticationError) return { error: "MaydaOS is not configured correctly." };
    if (error instanceof Anthropic.APIError) return { error: `The model call failed (${error.status}).` };
    return { error: "The model call failed." };
  }
}
