import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { isWorkerConfigured, pickDraft } from "@/lib/osDraftModel";
import type { ModelChoice } from "@/lib/osModelSettings";

/* Which model drafts while you are gone: the same precedence the co-founder
 * uses, returning a DraftClient with the model, effort and price to record. */

const price = { inputUsdPerMillion: 2, outputUsdPerMillion: 10 };
const claude: ModelChoice = { provider: "anthropic", model: "claude-sonnet-5", baseUrl: null, apiKey: "sk-ant-0123456789abcdefghij", price };
const grok: ModelChoice = { provider: "openai_compatible", model: "grok-4", baseUrl: "https://api.x.ai/v1", apiKey: "xai-0123456789abcdefghij", price };

describe("which model drafts", () => {
  it("lets the company's own choice win over the local model and the platform key, priced at its rates", () => {
    const env = { MAYDAOS_LOCAL_MODEL: "qwen3:14b", MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" };
    expect(pickDraft(env, claude)).toMatchObject({ model: "claude-sonnet-5", effort: "low", priced: true, label: "anthropic:claude-sonnet-5", price });
    expect(pickDraft(env, grok)).toMatchObject({ model: "grok-4", effort: null, priced: true, label: "openai_compatible:grok-4", price });
    expect(pickDraft(env, null)).toMatchObject({ model: "qwen3:14b", effort: null, priced: false, label: "local:qwen3:14b" });
    expect(pickDraft({ MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" }, null)).toMatchObject({ model: "claude-opus-5", effort: "low", priced: true, label: "claude-opus-5" });
    expect(pickDraft({}, null)).toBeNull();
  });

  it("refuses a compatible choice whose base URL is not https", () => {
    expect(() => pickDraft({}, { ...grok, baseUrl: "http://api.x.ai/v1" })).toThrow("https");
  });

  it("never lets the key into anything but the client", () => {
    for (const choice of [claude, grok]) {
      const picked = pickDraft({}, choice)!;
      expect(JSON.stringify({ ...picked, client: undefined })).not.toContain(choice.apiKey);
    }
  });

  it("counts the vault secret as enough for the worker to run", () => {
    expect(isWorkerConfigured({})).toBe(false);
    expect(isWorkerConfigured({ MAYDAOS_KEY_SECRET: "short" })).toBe(false);
    expect(isWorkerConfigured({ MAYDAOS_KEY_SECRET: "x".repeat(32) })).toBe(true);
    expect(isWorkerConfigured({ MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" })).toBe(true);
  });
});
