import { describe, expect, it } from "vitest";
import { KNOWN_MODEL_PRICES, PROVIDER_PRESETS, costUsdAt, knownPrice, parseModelSettings } from "@/lib/osModelSettings";

describe("a company's model choice", () => {
  it("knows Anthropic's rates and nothing else", () => {
    expect(knownPrice("claude-opus-5")).toEqual({ inputUsdPerMillion: 5, outputUsdPerMillion: 25 });
    expect(knownPrice(" claude-sonnet-5 ")).toEqual(KNOWN_MODEL_PRICES["claude-sonnet-5"]);
    expect(knownPrice("grok-4")).toBeNull();
  });

  it("accepts Anthropic without a base URL and fills the price from the table", () => {
    expect(parseModelSettings({ provider: "anthropic", model: "claude-opus-5", baseUrl: "", inputPrice: "", outputPrice: "" }))
      .toEqual({ ok: true, provider: "anthropic", model: "claude-opus-5", baseUrl: null, price: { inputUsdPerMillion: 5, outputUsdPerMillion: 25 } });
  });

  it("requires an https base URL and an explicit price for a compatible provider", () => {
    expect(parseModelSettings({ provider: "openai_compatible", model: "grok-4", baseUrl: "https://api.x.ai/v1/", inputPrice: "3", outputPrice: "15" }))
      .toEqual({ ok: true, provider: "openai_compatible", model: "grok-4", baseUrl: "https://api.x.ai/v1", price: { inputUsdPerMillion: 3, outputUsdPerMillion: 15 } });
    expect(parseModelSettings({ provider: "openai_compatible", model: "grok-4", baseUrl: "http://api.x.ai/v1", inputPrice: "3", outputPrice: "15" })).toEqual({ ok: false, error: "base_url" });
    expect(parseModelSettings({ provider: "openai_compatible", model: "grok-4", baseUrl: "https://api.x.ai/v1", inputPrice: "", outputPrice: "15" })).toEqual({ ok: false, error: "price" });
    expect(parseModelSettings({ provider: "openai_compatible", model: "grok-4", baseUrl: "http://127.0.0.1:11434/v1", inputPrice: "0", outputPrice: "0" })).toMatchObject({ ok: true, baseUrl: "http://127.0.0.1:11434/v1" });
  });

  it("refuses an unknown provider, a malformed model name and an absurd price", () => {
    expect(parseModelSettings({ provider: "google", model: "gemini", baseUrl: "", inputPrice: "", outputPrice: "" })).toEqual({ ok: false, error: "provider" });
    expect(parseModelSettings({ provider: "anthropic", model: "claude opus", baseUrl: "", inputPrice: "", outputPrice: "" })).toEqual({ ok: false, error: "model" });
    expect(parseModelSettings({ provider: "anthropic", model: "claude-opus-5", baseUrl: "", inputPrice: "5000", outputPrice: "25" })).toEqual({ ok: false, error: "price" });
    expect(parseModelSettings({ provider: "anthropic", model: "claude-opus-5", baseUrl: "", inputPrice: "-1", outputPrice: "25" })).toEqual({ ok: false, error: "price" });
  });

  it("prices a turn from the stored rates, rounded to a millionth of a dollar", () => {
    expect(costUsdAt({ inputUsdPerMillion: 5, outputUsdPerMillion: 25 }, 1_000_000, 100_000)).toBe(7.5);
    expect(costUsdAt({ inputUsdPerMillion: 3, outputUsdPerMillion: 15 }, 1_374, 327)).toBe(0.009027);
    expect(costUsdAt({ inputUsdPerMillion: 0, outputUsdPerMillion: 0 }, 99, 99)).toBe(0);
  });

  it("offers presets that all resolve to one of the two dialects", () => {
    for (const preset of PROVIDER_PRESETS) expect(["anthropic", "openai_compatible"]).toContain(preset.provider);
    expect(PROVIDER_PRESETS.find((p) => p.id === "xai")?.baseUrl).toBe("https://api.x.ai/v1");
  });
});
