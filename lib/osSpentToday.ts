import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/* What has been spent today (UTC), as every daily ceiling counts it.
 *
 * MAYDAOS_DAILY_USD_CAP is one ceiling, and three paths spend under it: the
 * scheduled worker, the manual workflow run and agent runs. Each used to
 * count only what it could see — workflows summed os_runs, so a day of agent
 * runs left the worker free to spend the whole cap again on top. Now all
 * three read one SQL definition (public.os_spent_today, the same sum
 * os_agent_run_round checks): workflow runs, and the run rounds reserved
 * today — at what each call cost, or at its hold while it is in flight.
 *
 * A company id is that company's day — the ceiling on a company's own key; a
 * null company is the platform's day: every workflow run, and the runs on
 * the platform's key. A run on a company's own key is never in it, so one
 * company spending its own key leaves the platform's day to everyone else.
 * Service role only: the platform's total spans every company. null
 * means the total could not be read, and unknown spend is not zero spend:
 * every caller refuses to spend on it.
 */
export async function spentToday(admin: SupabaseClient<Database>, companyId: string | null): Promise<number | null> {
  // SQL null is the platform-wide total; the generated Args type cannot say so.
  const { data, error } = await admin.rpc("os_spent_today", { p_company: companyId as string });
  if (error || data === null || data === undefined) return null;
  const spent = Number(data);
  return Number.isFinite(spent) && spent >= 0 ? spent : null;
}
