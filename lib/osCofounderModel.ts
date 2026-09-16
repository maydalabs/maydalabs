import Anthropic from "@anthropic-ai/sdk";
import { FILE_WORK_TOOL, REMEMBER_TOOL, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { OS_MODEL } from "@/lib/os";

/* The SDK side of the seam, and the only part of the co-founder that costs
 * money. Everything above it — the loop, the tool, the context — is
 * exercised in tests against a fake that implements this same signature.
 */

export function isCofounderConfigured(): boolean {
  return Boolean(process.env.MAYDAOS_ANTHROPIC_API_KEY);
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
