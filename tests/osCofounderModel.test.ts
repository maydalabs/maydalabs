import { describe, expect, it, vi } from "vitest";
import { isCofounderConfigured, pickTurn } from "@/lib/osCofounderModel";
import type { ModelChoice } from "@/lib/osModelSettings";

type Env = Record<string, string | undefined>;
const price = { inputUsdPerMillion: 3, outputUsdPerMillion: 15 };
const grok: ModelChoice = { provider: "openai_compatible", model: "grok-4", baseUrl: "https://api.x.ai/v1", apiKey: "xai-0123456789abcdefghij", price };
const claude: ModelChoice = { provider: "anthropic", model: "claude-sonnet-5", baseUrl: null, apiKey: "sk-ant-0123456789abcdefghij", price: { inputUsdPerMillion: 2, outputUsdPerMillion: 10 } };

describe("which model speaks", () => {
  it("lets a company's own choice win over the local model and the platform key, priced at its rates", () => {
    const env: Env = { MAYDAOS_LOCAL_MODEL: "qwen3:14b", MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" };
    expect(pickTurn(env, grok)).toMatchObject({ priced: true, label: "openai_compatible:grok-4", price });
    expect(pickTurn(env, claude)).toMatchObject({ priced: true, label: "anthropic:claude-sonnet-5", price: claude.price });
    expect(pickTurn(env, null)).toMatchObject({ priced: false, label: "local:qwen3:14b" });
    expect(pickTurn({ MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" }, null)).toMatchObject({ priced: true, label: "claude-opus-5" });
    expect(pickTurn({}, null)).toBeNull();
  });

  it("refuses a compatible choice whose base URL is not https", () => {
    expect(() => pickTurn({}, { ...grok, baseUrl: "http://api.x.ai/v1" })).toThrow("https");
  });

  it("counts a company's choice as configured even when the platform has nothing", () => {
    expect(isCofounderConfigured({}, false)).toBe(false);
    expect(isCofounderConfigured({}, true)).toBe(true);
    expect(isCofounderConfigured({ MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" }, false)).toBe(true);
  });

  it("never lets the key into the label", () => {
    const picked = pickTurn({}, grok)!;
    expect(JSON.stringify({ label: picked.label, price: picked.price })).not.toContain(grok.apiKey);
    vi.restoreAllMocks();
  });
});
