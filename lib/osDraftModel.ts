import Anthropic from "@anthropic-ai/sdk";
import { localDraftClient, localModelSettings } from "@/lib/osCofounderLocal";
import { openAiCompatibleDraftClient } from "@/lib/osCofounderOpenAI";
import { isOsConfigured, type DraftClient } from "@/lib/osDraft";
import { vaultSecret } from "@/lib/osKeyVault";
import type { ModelChoice, ModelPrice } from "@/lib/osModelSettings";
import { OS_EFFORT, OS_MODEL } from "@/lib/os";
import { DRAFT_TIMEOUT_MS } from "@/lib/osDraftSchema";

/* Whatever the environment holds; process.env is one of these. */
type Env = Record<string, string | undefined>;

/* Which model drafts while you are gone. The same decision the co-founder
 * makes in lib/osCofounderModel.ts, one seam over: a company that brought its
 * own key is drafted for by the model it chose and pays for, at the rates it
 * recorded; otherwise a local model wins off Vercel because it costs nothing;
 * last, the platform's own key, if one is set. The label never holds the key.
 */

export type PickedDraft = {
  client: DraftClient;
  model: string;
  /* Anthropic-only; a compatible provider ignores the field and gets null. */
  effort: string | null;
  priced: boolean;
  label: string;
  price?: ModelPrice;
};

export function pickDraft(env: Env = process.env, choice: ModelChoice | null = null): PickedDraft | null {
  if (choice) {
    if (choice.provider === "anthropic") {
      return {
        client: new Anthropic({ apiKey: choice.apiKey, timeout: DRAFT_TIMEOUT_MS, maxRetries: 1 }) as unknown as DraftClient,
        model: choice.model, effort: OS_EFFORT, priced: true, label: `anthropic:${choice.model}`, price: choice.price,
      };
    }
    return {
      client: openAiCompatibleDraftClient({ baseUrl: choice.baseUrl ?? "", apiKey: choice.apiKey, model: choice.model }),
      model: choice.model, effort: null, priced: true, label: `openai_compatible:${choice.model}`, price: choice.price,
    };
  }
  const local = localModelSettings(env);
  if (local) return { client: localDraftClient(local), model: local.model, effort: null, priced: false, label: `local:${local.model}` };
  if (env.MAYDAOS_ANTHROPIC_API_KEY) {
    return {
      client: new Anthropic({ apiKey: env.MAYDAOS_ANTHROPIC_API_KEY, timeout: DRAFT_TIMEOUT_MS, maxRetries: 1 }) as unknown as DraftClient,
      model: OS_MODEL, effort: OS_EFFORT, priced: true, label: OS_MODEL,
    };
  }
  return null;
}

/** Whether a tick can draft for anyone: the platform's own model, or the
 * vault secret that opens a company's sealed key. A company without a key is
 * decided per company, inside the tick. */
export function isWorkerConfigured(env: Env = process.env): boolean {
  return isOsConfigured(env) || vaultSecret(env) !== null;
}
