import Anthropic from "@anthropic-ai/sdk";
import { FILE_WORK_TOOL, REMEMBER_TOOL, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { localModelSettings, localTurn } from "@/lib/osCofounderLocal";
import { OS_MODEL } from "@/lib/os";

/* Whatever the environment holds; process.env is one of these. */
type Env = Record<string, string | undefined>;

/* The SDK side of the seam, and the only part of the co-founder that costs
 * money. Everything above it — the loop, the tool, the context — is
 * exercised in tests against a fake that implements this same signature.
 */

export type PickedTurn = { turn: ModelTurn; priced: boolean; label: string };

/* Which model speaks. A local model wins off Vercel, because the point of
 * having one is not to spend; on Vercel it is never considered, whatever
 * the environment says. */
export function pickTurn(env: Env = process.env): PickedTurn | null {
  const local = localModelSettings(env);
  if (local) return { turn: localTurn(local), priced: false, label: `local:${local.model}` };
  if (env.MAYDAOS_ANTHROPIC_API_KEY) return { turn: anthropicTurn(), priced: true, label: OS_MODEL };
  return null;
}

export function isCofounderConfigured(env: Env = process.env): boolean {
  return Boolean(env.MAYDAOS_ANTHROPIC_API_KEY) || localModelSettings(env) !== null;
}

export function anthropicTurn(): ModelTurn {
  const client = new Anthropic({ apiKey: process.env.MAYDAOS_ANTHROPIC_API_KEY });

  return async function* turn({ system, messages }): AsyncIterable<ModelEvent> {
    const stream = client.messages.stream({
      model: OS_MODEL,
      max_tokens: 2000,
      system,
      tools: [FILE_WORK_TOOL, REMEMBER_TOOL],
      messages: messages as Anthropic.MessageParam[],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "text", text: event.delta.text };
      }
    }

    /* Tool inputs arrive in fragments across the stream and are only whole
     * once it ends, so they are read from the assembled message rather than
     * stitched back together here. */
    const final = await stream.finalMessage();
    for (const block of final.content) {
      if (block.type === "tool_use") {
        yield {
          type: "tool",
          id: block.id,
          name: block.name,
          input: (block.input ?? {}) as Record<string, unknown>,
        };
      }
    }

    yield {
      type: "done",
      stopReason: final.stop_reason,
      inputTokens: final.usage.input_tokens,
      outputTokens: final.usage.output_tokens,
    };
  };
}
