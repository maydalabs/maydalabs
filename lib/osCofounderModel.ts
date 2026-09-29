import Anthropic from "@anthropic-ai/sdk";
import { cofounderTools, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { localModelSettings, localTurn } from "@/lib/osCofounderLocal";
import { openAiCompatibleTurn } from "@/lib/osCofounderOpenAI";
import type { ModelChoice, ModelPrice } from "@/lib/osModelSettings";
import { OS_MODEL } from "@/lib/os";

/* Whatever the environment holds; process.env is one of these. */
type Env = Record<string, string | undefined>;

/* The SDK side of the seam, and the only part of the co-founder that costs
 * money. Everything above it — the loop, the tool, the context — is
 * exercised in tests against a fake that implements this same signature.
 */

export type PickedTurn = { turn: ModelTurn; priced: boolean; label: string; price?: ModelPrice };

/* Which model speaks. A company that brought its own key is answered by the
 * model it chose and pays for, at the rates it recorded. Otherwise a local
 * model wins off Vercel, because the point of having one is not to spend; on
 * Vercel it is never considered, whatever the environment says. Last, the
 * platform's own key, if one is set. */
export function pickTurn(env: Env = process.env, choice: ModelChoice | null = null): PickedTurn | null {
  if (choice) {
    const turn = choice.provider === "anthropic"
      ? anthropicTurn({ apiKey: choice.apiKey, model: choice.model })
      : openAiCompatibleTurn({ baseUrl: choice.baseUrl ?? "", apiKey: choice.apiKey, model: choice.model });
    return { turn, priced: true, label: `${choice.provider}:${choice.model}`, price: choice.price };
  }
  const local = localModelSettings(env);
  if (local) return { turn: localTurn(local), priced: false, label: `local:${local.model}` };
  if (env.MAYDAOS_ANTHROPIC_API_KEY) return { turn: anthropicTurn({ apiKey: env.MAYDAOS_ANTHROPIC_API_KEY, model: OS_MODEL }), priced: true, label: OS_MODEL };
  return null;
}

/** Whether anything can answer: the platform's own key or local model, or the
 * company's own choice when the caller knows one exists. */
export function isCofounderConfigured(env: Env = process.env, companyHasChoice = false): boolean {
  return companyHasChoice || Boolean(env.MAYDAOS_ANTHROPIC_API_KEY) || localModelSettings(env) !== null;
}

export function anthropicTurn(settings: { apiKey: string; model: string }): ModelTurn {
  const client = new Anthropic({ apiKey: settings.apiKey });

  return async function* turn({ system, messages, tools, signal }): AsyncIterable<ModelEvent> {
    const stream = client.messages.stream({
      model: settings.model,
      max_tokens: 2000,
      system,
      tools: cofounderTools(tools),
      messages: messages as Anthropic.MessageParam[],
    }, { signal });

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
