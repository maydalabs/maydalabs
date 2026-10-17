import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/osCofounder";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ hasOwn: vi.fn(), sealed: vi.fn(), summary: vi.fn(), openKey: vi.fn(), admin: vi.fn(), pick: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osKeyVault", () => ({ openKey: mocks.openKey }));
vi.mock("@/lib/osModelSettings", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/osModelSettings")>(),
  companyHasModelSettings: mocks.hasOwn, readSealedModelSettings: mocks.sealed, readModelSettingsSummary: mocks.summary,
}));
vi.mock("@/lib/osCofounderModel", () => ({ pickTurn: mocks.pick }));
import { dailyCapUsd, resolveRunModel, runCapUsd, runQuote } from "@/lib/osAgentRunPayer";
import { runStartMinimumUsd } from "@/lib/osAgentRun";
import { agentRunSystemFor } from "@/lib/osAgentRunPrompt";
import { REVIEW_WORK_KINDS } from "@/lib/osReviewGuard";
import type { CofounderPersona } from "@/lib/osPersona";

const signedIn = { rpc: vi.fn() } as unknown as Db & { rpc: ReturnType<typeof vi.fn> };
const price = { inputUsdPerMillion: 2, outputUsdPerMillion: 10 };
const company = (monthly: number) => ({ id: "company-1", monthly_chat_usd: monthly, name: "Synthetic Orchard", what_we_do: "Apples." });
const summary = (rates = price) => ({ provider: "anthropic", model: "m", baseUrl: null, keyLast4: "abcd", price: rates, updatedAt: "2026-10-18T00:00:00Z", setBy: null });
/* The least any start could need, as the quote must compute it: an empty
 * instruction, in the format whose prompt is shortest, at the run's price. */
const least = (rates: typeof price | undefined, persona?: CofounderPersona) => Math.min(...REVIEW_WORK_KINDS.map((draftFormat) => runStartMinimumUsd({
  priced: true, price: rates, instruction: "", system: agentRunSystemFor({ company: company(5), draftFormat, persona, today: new Date().toISOString().slice(0, 10) }),
})));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasOwn.mockResolvedValue(false);
  mocks.pick.mockImplementation((_env, choice) => choice
    ? { turn: vi.fn(), priced: true, label: `${choice.provider}:${choice.model}`, price: choice.price }
    : { turn: vi.fn(), priced: false, label: "local:qwen3:14b" });
});

describe("who pays for a run", () => {
  it("opens a company's own key and says the company pays", async () => {
    mocks.hasOwn.mockResolvedValue(true);
    mocks.sealed.mockResolvedValue({ provider: "anthropic", model: "claude-sonnet-5", baseUrl: null, keyCiphertext: "v1:sealed", price });
    mocks.openKey.mockReturnValue("sk-test");
    const resolved = await resolveRunModel(signedIn, "company-1", {});
    expect(resolved).toMatchObject({ ok: true, payer: "company", picked: { label: "anthropic:claude-sonnet-5", price } });
    expect(mocks.pick).toHaveBeenCalledWith({}, { provider: "anthropic", model: "claude-sonnet-5", baseUrl: null, apiKey: "sk-test", price });
  });
  it("touches the service role only when the signed-in read says there is a key", async () => {
    expect(await resolveRunModel(signedIn, "company-1", {})).toMatchObject({ ok: true, payer: "local" });
    expect(mocks.admin).not.toHaveBeenCalled();
    mocks.pick.mockReturnValue({ turn: vi.fn(), priced: true, label: "claude-opus-5" });
    expect(await resolveRunModel(signedIn, "company-1", {})).toMatchObject({ ok: true, payer: "platform" });
  });
  it.each([
    ["a key the vault cannot open", () => { mocks.hasOwn.mockResolvedValue(true); mocks.sealed.mockResolvedValue({ provider: "anthropic", model: "m", baseUrl: null, keyCiphertext: "x", price }); mocks.openKey.mockReturnValue(null); }, "key_unavailable"],
    ["an unreadable setting", () => { mocks.hasOwn.mockRejectedValue(new Error("PRIVATE")); }, "model_settings_unavailable"],
    ["an invalid setting", () => { mocks.pick.mockImplementation(() => { throw new Error("bad url"); }); }, "model_settings_invalid"],
    ["no model at all", () => { mocks.pick.mockReturnValue(null); }, "not_configured"],
  ])("refuses %s with 503", async (_label, arrange, error) => {
    arrange();
    expect(await resolveRunModel(signedIn, "company-1", {})).toEqual({ ok: false, error, status: 503 });
  });
});

describe("caps and the quote", () => {
  it("caps a run at one dollar unless set, never above five; the daily cap reads like the worker's", () => {
    expect(runCapUsd({})).toBe(1);
    expect(runCapUsd({ MAYDAOS_RUN_USD_CAP: "2.5" })).toBe(2.5);
    expect(runCapUsd({ MAYDAOS_RUN_USD_CAP: "50" })).toBe(5);
    expect(runCapUsd({ MAYDAOS_RUN_USD_CAP: "-1" })).toBe(1);
    expect(dailyCapUsd({})).toBe(2);
    expect(dailyCapUsd({ MAYDAOS_DAILY_USD_CAP: "0" })).toBe(0);
    expect(dailyCapUsd({ MAYDAOS_DAILY_USD_CAP: "abc" })).toBe(2);
  });
  const today = (spent: number | null, error: unknown = null) => {
    const rpc = vi.fn(async (name: string, args: unknown) => { void name; void args; return { data: spent, error }; });
    mocks.admin.mockReturnValue({ rpc });
    return rpc;
  };

  it("quotes the month's remainder without opening a key", async () => {
    mocks.hasOwn.mockResolvedValue(true);
    mocks.summary.mockResolvedValue(summary());
    signedIn.rpc.mockResolvedValue({ data: 4.2, error: null });
    const day = today(0);
    expect(await runQuote(signedIn, company(5), {})).toEqual({ payer: "company", priced: true, maxUsd: 0.8, leftUsd: 0.8 });
    // A company key is checked against the company's own day, at the rates it recorded, read signed in.
    expect(day).toHaveBeenCalledExactlyOnceWith("os_spent_today", { p_company: "company-1" });
    expect(mocks.summary).toHaveBeenCalledExactlyOnceWith(signedIn, "company-1");
    expect(mocks.openKey).not.toHaveBeenCalled();
    expect(mocks.sealed).not.toHaveBeenCalled();
  });

  it("clamps the quote to what today still has, on the platform's day for the platform's key", async () => {
    signedIn.rpc.mockResolvedValue({ data: 0, error: null });
    const day = today(1.6);
    expect(await runQuote(signedIn, company(5), { MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" }))
      .toEqual({ payer: "platform", priced: true, maxUsd: 0.4, leftUsd: 5 });
    expect(day).toHaveBeenCalledExactlyOnceWith("os_spent_today", { p_company: null });
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it.each([
    // Remainder → what SQL would set as the ceiling (four places) → whole cents, rounded down;
    // a ceiling SQL would refuse (below ten cents, here the floor at these rates) quotes nothing.
    [4.904, 0], [4.9049, 0], [4.9, 0.1], [4.8951, 0.1], [3.999, 1],
  ])("never quotes a cent SQL would not allow (month spent %d)", async (spent, maxUsd) => {
    mocks.hasOwn.mockResolvedValue(true);
    mocks.summary.mockResolvedValue(summary());
    signedIn.rpc.mockResolvedValue({ data: spent, error: null });
    today(0);
    expect(least(price)).toBeLessThan(0.1);
    const quote = await runQuote(signedIn, company(5), {});
    expect(quote?.maxUsd).toBe(maxUsd);
    // The window offers a run exactly when SQL would start one: a ceiling of at least ten cents.
    expect(quote!.maxUsd >= 0.1).toBe(Math.round((5 - spent) * 10_000) / 10_000 >= 0.1);
    expect(quote!.leftUsd).toBeLessThanOrEqual(5 - spent + 1e-9);
  });

  /* A dear model's first rounds cost more than ten cents. SQL refuses a
   * ceiling below what they would be held at (os_agent_run_start's
   * p_min_usd), and the quote says so first, at the same price and from the
   * same projection; a cheap model keeps the ten-cent floor. */
  it.each([
    ["the company's own dear key", { inputUsdPerMillion: 15, outputUsdPerMillion: 75 }, {}],
    ["the platform's key", undefined, { MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" }],
  ] as const)("quotes nothing when the ceiling cannot pay for a run's first rounds on %s", async (_label, rates, env) => {
    mocks.hasOwn.mockResolvedValue(rates !== undefined);
    mocks.summary.mockResolvedValue(summary(rates));
    const needed = Math.ceil(least(rates) * 10_000) / 10_000;
    expect(needed).toBeGreaterThan(0.2);
    today(0);
    // Exactly what the first rounds need is enough; a hundredth of a cent less is not.
    signedIn.rpc.mockResolvedValue({ data: Math.round((5 - needed) * 10_000) / 10_000, error: null });
    expect((await runQuote(signedIn, company(5), env))?.maxUsd).toBe(Math.floor(needed * 100) / 100);
    signedIn.rpc.mockResolvedValue({ data: Math.round((5 - needed + 0.0001) * 10_000) / 10_000, error: null });
    expect(await runQuote(signedIn, company(5), env)).toMatchObject({ priced: true, maxUsd: 0 });
  });

  it("counts the persona the run will be sent, so a longer prompt needs more", async () => {
    const persona: CofounderPersona = { name: "Ada", voice: "warm", note: "Short sentences.", addressAs: "Boss" };
    expect(least(undefined, persona)).toBeGreaterThan(least(undefined));
    const needed = Math.ceil(least(undefined, persona) * 10_000) / 10_000;
    signedIn.rpc.mockResolvedValue({ data: Math.round((5 - needed + 0.0001) * 10_000) / 10_000, error: null });
    today(0);
    const env = { MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" };
    expect((await runQuote(signedIn, company(5), env, persona))?.maxUsd).toBe(0);
    expect((await runQuote(signedIn, company(5), env))?.maxUsd).toBeGreaterThan(0);
  });

  it("fails closed when today's spend or the company's rates cannot be read", async () => {
    signedIn.rpc.mockResolvedValue({ data: 0, error: null });
    today(null, { message: "down" });
    await expect(runQuote(signedIn, company(5), { MAYDAOS_ANTHROPIC_API_KEY: "sk-platform" })).rejects.toThrow("budget_unavailable");
    today(0);
    mocks.hasOwn.mockResolvedValue(true);
    mocks.summary.mockResolvedValue(null);
    await expect(runQuote(signedIn, company(5), {})).rejects.toThrow("budget_unavailable");
  });
  it("quotes a local run as free and an unconfigured desk as nothing", async () => {
    expect(await runQuote(signedIn, company(5), { MAYDAOS_LOCAL_MODEL: "qwen3:14b" })).toEqual({ payer: "local", priced: false, maxUsd: 0, leftUsd: 0 });
    expect(await runQuote(signedIn, company(5), {})).toBeNull();
  });
});
