import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/* Which model speaks for a company, and who pays.
 *
 * A company may bring its own key. This module is the shape of that choice:
 * the providers we can talk to, the prices we know, what a form may say, and
 * how the setting is read back — with the key only on the server-side path.
 */

export const MODEL_PROVIDERS = ["anthropic", "openai_compatible"] as const;
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];

export type ModelPrice = { inputUsdPerMillion: number; outputUsdPerMillion: number };

/** What the route needs to speak: the key is here, so this never leaves the server. */
export type ModelChoice = { provider: ModelProvider; model: string; baseUrl: string | null; apiKey: string; price: ModelPrice };

/** What a member may see: everything but the key. */
export type ModelSettingsSummary = {
  provider: ModelProvider; model: string; baseUrl: string | null; keyLast4: string; price: ModelPrice; updatedAt: string; setBy: string | null;
};

/* Anthropic's first-party rates, per million tokens (cached 2026-06). Anything
 * not listed is priced by the owner when they save it; a wrong price costs
 * them accuracy in the ledger, never money we spend. */
export const KNOWN_MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-opus-5": { inputUsdPerMillion: 5, outputUsdPerMillion: 25 },
  "claude-sonnet-5": { inputUsdPerMillion: 2, outputUsdPerMillion: 10 },
  "claude-haiku-4-5": { inputUsdPerMillion: 1, outputUsdPerMillion: 5 },
  "claude-fable-5-1": { inputUsdPerMillion: 10, outputUsdPerMillion: 50 },
};

/* Presets are sugar for the form: a name, a base URL, a starting model. The
 * stored provider is still one of the two dialects. */
export const PROVIDER_PRESETS = [
  { id: "anthropic", provider: "anthropic", label: "Anthropic (Claude)", baseUrl: null, model: "claude-opus-5" },
  { id: "openai", provider: "openai_compatible", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "" },
  { id: "xai", provider: "openai_compatible", label: "xAI (Grok)", baseUrl: "https://api.x.ai/v1", model: "" },
  { id: "groq", provider: "openai_compatible", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "" },
  { id: "compatible", provider: "openai_compatible", label: "Any OpenAI-compatible endpoint", baseUrl: "", model: "" },
] as const satisfies readonly { id: string; provider: ModelProvider; label: string; baseUrl: string | null; model: string }[];

export function knownPrice(model: string): ModelPrice | null {
  return KNOWN_MODEL_PRICES[model.trim()] ?? null;
}

export function isModelProvider(value: unknown): value is ModelProvider {
  return typeof value === "string" && (MODEL_PROVIDERS as readonly string[]).includes(value);
}

const MODEL_NAME = /^[A-Za-z0-9._:\/-]{1,120}$/;

export type ParsedModelSettings =
  | { ok: true; provider: ModelProvider; model: string; baseUrl: string | null; price: ModelPrice }
  | { ok: false; error: "provider" | "model" | "base_url" | "price" };

/** Empty means "use the known rate"; anything else must be a sane number. */
function parsePrice(raw: unknown): { kind: "empty" } | { kind: "invalid" } | { kind: "value"; value: number } {
  const text = typeof raw === "string" ? raw.trim().replace(",", ".") : "";
  if (!text) return { kind: "empty" };
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 && value <= 1000 ? { kind: "value", value: Math.round(value * 10_000) / 10_000 } : { kind: "invalid" };
}

/** Everything a form says except the key, which the vault handles. */
export function parseModelSettings(input: { provider: unknown; model: unknown; baseUrl: unknown; inputPrice: unknown; outputPrice: unknown }): ParsedModelSettings {
  if (!isModelProvider(input.provider)) return { ok: false, error: "provider" };
  const model = typeof input.model === "string" ? input.model.trim() : "";
  if (!MODEL_NAME.test(model)) return { ok: false, error: "model" };
  let baseUrl: string | null = null;
  if (input.provider === "openai_compatible") {
    baseUrl = typeof input.baseUrl === "string" ? input.baseUrl.trim().replace(/\/+$/, "") : "";
    if (!/^https:\/\/[^\s?#@]+$/.test(baseUrl) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/[^\s?#@]*)?$/.test(baseUrl)) return { ok: false, error: "base_url" };
  }
  const known = knownPrice(model);
  const given = [parsePrice(input.inputPrice), parsePrice(input.outputPrice)];
  if (given.some((p) => p.kind === "invalid")) return { ok: false, error: "price" };
  const inputUsdPerMillion = given[0].kind === "value" ? given[0].value : known?.inputUsdPerMillion ?? null;
  const outputUsdPerMillion = given[1].kind === "value" ? given[1].value : known?.outputUsdPerMillion ?? null;
  if (inputUsdPerMillion === null || outputUsdPerMillion === null) return { ok: false, error: "price" };
  return { ok: true, provider: input.provider, model, baseUrl, price: { inputUsdPerMillion, outputUsdPerMillion } };
}

export function costUsdAt(price: ModelPrice, inputTokens: number, outputTokens: number): number {
  const input = (Math.max(0, inputTokens) / 1_000_000) * price.inputUsdPerMillion;
  const output = (Math.max(0, outputTokens) / 1_000_000) * price.outputUsdPerMillion;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}

type Db = SupabaseClient<Database>;
const SUMMARY_COLUMNS = "provider, model, base_url, key_last4, input_usd_per_million, output_usd_per_million, updated_at, set_by";

/** Read through the signed-in client: RLS and the column grant keep the key out. */
export async function readModelSettingsSummary(db: Db, companyId: string): Promise<ModelSettingsSummary | null> {
  const { data, error } = await db.from("os_model_settings").select(SUMMARY_COLUMNS).eq("company_id", companyId).maybeSingle();
  if (error || !data || !isModelProvider(data.provider)) return null;
  return {
    provider: data.provider, model: data.model, baseUrl: data.base_url, keyLast4: data.key_last4,
    price: { inputUsdPerMillion: Number(data.input_usd_per_million), outputUsdPerMillion: Number(data.output_usd_per_million) },
    updatedAt: data.updated_at, setBy: data.set_by,
  };
}

/** Whether the company has a choice at all, through the signed-in client.
 * A failed read throws: silently falling back to the platform's model would
 * spend the wrong money. */
export async function companyHasModelSettings(db: Db, companyId: string): Promise<boolean> {
  const { data, error } = await db.from("os_model_settings").select("company_id").eq("company_id", companyId).maybeSingle();
  if (error) throw new Error("model_settings_unavailable");
  return data !== null;
}

/** The sealed row, for the server-side path that will open it. */
export async function readSealedModelSettings(admin: Db, companyId: string) {
  const { data, error } = await admin.from("os_model_settings")
    .select(`${SUMMARY_COLUMNS}, key_ciphertext`).eq("company_id", companyId).maybeSingle();
  if (error) throw new Error("model_settings_unavailable");
  if (!data || !isModelProvider(data.provider)) return null;
  return {
    provider: data.provider, model: data.model, baseUrl: data.base_url, keyCiphertext: data.key_ciphertext,
    price: { inputUsdPerMillion: Number(data.input_usd_per_million), outputUsdPerMillion: Number(data.output_usd_per_million) },
  };
}
