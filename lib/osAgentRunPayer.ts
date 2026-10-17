import "server-only";
import type { Db } from "@/lib/osCofounder";
import { localModelSettings } from "@/lib/osCofounderLocal";
import { pickTurn, type PickedTurn } from "@/lib/osCofounderModel";
import { openKey } from "@/lib/osKeyVault";
import { companyHasModelSettings, readModelSettingsSummary, readSealedModelSettings, type ModelChoice } from "@/lib/osModelSettings";
import { DEFAULT_PERSONA, type CofounderPersona } from "@/lib/osPersona";
import { REVIEW_WORK_KINDS } from "@/lib/osReviewGuard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { spentToday } from "@/lib/osSpentToday";
import { runStartMinimumUsd } from "@/lib/osAgentRun";
import { agentRunSystemFor } from "@/lib/osAgentRunPrompt";
import type { RunPayer } from "@/lib/osAgentRunTypes";

/* Who pays for a run, and which model speaks.
 *
 * The same order the co-founder route uses (app/api/os/cofounder/route.ts),
 * repeated rather than shared so that route stays exactly as it is: a
 * company's own key first, opened here and nowhere else; then a local model,
 * never on Vercel; then the platform's key. Who pays decides the money rules:
 * a company key spends the company's month and is checked against the
 * company's day, the platform key against the platform's day (every company's
 * runs on that key, and every workflow run), a local model costs nothing.
 */

type Env = Record<string, string | undefined>;
export type ResolvedRunModel = { ok: true; picked: PickedTurn; payer: RunPayer } | { ok: false; error: string; status: number };

export async function resolveRunModel(signedIn: Db, companyId: string, env: Env = process.env): Promise<ResolvedRunModel> {
  let choice: ModelChoice | null = null;
  try {
    // The service role is touched only when the signed-in read says there is a key to open.
    const sealed = await companyHasModelSettings(signedIn, companyId) ? await readSealedModelSettings(createSupabaseAdminClient(), companyId) : null;
    if (sealed) {
      const apiKey = openKey(sealed.keyCiphertext);
      if (!apiKey) return { ok: false, error: "key_unavailable", status: 503 };
      choice = { provider: sealed.provider, model: sealed.model, baseUrl: sealed.baseUrl, apiKey, price: sealed.price };
    }
  } catch { return { ok: false, error: "model_settings_unavailable", status: 503 }; }
  let picked: PickedTurn | null;
  try { picked = pickTurn(env, choice); } catch { return { ok: false, error: "model_settings_invalid", status: 503 }; }
  if (!picked) return { ok: false, error: "not_configured", status: 503 };
  return { ok: true, picked, payer: choice ? "company" : picked.priced ? "platform" : "local" };
}

/** MAYDAOS_RUN_USD_CAP: what one run may spend, $1 unless set, never above $5. */
export function runCapUsd(env: Env = process.env): number {
  const value = Number(env.MAYDAOS_RUN_USD_CAP);
  return Number.isFinite(value) && value >= 0 ? Math.min(5, value) : 1;
}

/** MAYDAOS_DAILY_USD_CAP, read the way lib/osWorker.ts reads it. */
export function dailyCapUsd(env: Env = process.env): number {
  const value = Number(env.MAYDAOS_DAILY_USD_CAP);
  return Number.isFinite(value) && value >= 0 ? value : 2;
}

/* Whole cents at or below an amount, from SQL's four places: what the quote
 * says may be spent is never a cent more than SQL would allow. */
function centsAtMost(usd: number): number {
  return Math.max(0, Math.floor(Math.round(usd * 10_000) / 100)) / 100;
}

/** What starting a run would cost at most, without opening any key: the
 * ceiling os_agent_run_start would set — the run cap, clamped to what this
 * month and today still have — in whole cents, rounded down. Today's total
 * on the platform's key spans every company, which no member may read: the
 * service role reads it here, and only the clamped amount leaves.
 *
 * SQL refuses a start whose ceiling is below ten cents or below what the
 * run's first rounds would be held at (runStartMinimumUsd), and the window
 * says so before the press: the quote is then 0. The instruction and its
 * format are not known yet, so the quote takes the least any start could
 * need — an empty instruction, in the format whose prompt is shortest — at
 * the price the run would pay: the company's recorded rates on its own key
 * (read signed in, like the rest of the setting but the key), the
 * platform's otherwise. A long instruction can still be refused on the
 * press, cleanly: the start writes nothing. */
export async function runQuote(
  signedIn: Db, company: { id: string; monthly_chat_usd: number | string | null; name: string; what_we_do: string | null },
  env: Env = process.env, persona: CofounderPersona = DEFAULT_PERSONA,
) {
  const own = await companyHasModelSettings(signedIn, company.id);
  const payer: RunPayer | null = own ? "company" : localModelSettings(env) ? "local" : env.MAYDAOS_ANTHROPIC_API_KEY ? "platform" : null;
  if (!payer) return null;
  if (payer === "local") return { payer, priced: false, maxUsd: 0, leftUsd: 0 };
  const [month, today, settings] = await Promise.all([
    signedIn.rpc("os_chat_spent_this_month", { p_company_id: company.id }),
    spentToday(createSupabaseAdminClient(), payer === "company" ? company.id : null),
    payer === "company" ? readModelSettingsSummary(signedIn, company.id) : Promise.resolve(null),
  ]);
  if (month.error || month.data === null || today === null || (payer === "company" && !settings)) throw new Error("budget_unavailable");
  const monthLeft = Number(company.monthly_chat_usd ?? 0) - Number(month.data);
  const dayLeft = dailyCapUsd(env) - today;
  // SQL rounds the ceiling to four places before comparing it with the floor.
  const ceiling = Math.round(Math.min(runCapUsd(env), monthLeft, dayLeft) * 10_000) / 10_000;
  const day = new Date().toISOString().slice(0, 10);
  const least = Math.min(...REVIEW_WORK_KINDS.map((draftFormat) => runStartMinimumUsd({
    priced: true, price: settings?.price, instruction: "", system: agentRunSystemFor({ company, draftFormat, persona, today: day }),
  })));
  const startable = ceiling >= Math.max(0.10, least);
  return { payer, priced: true, maxUsd: startable ? centsAtMost(ceiling) : 0, leftUsd: centsAtMost(monthLeft) };
}
