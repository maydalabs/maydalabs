import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/* Which company this is.
 *
 * One answer for the whole desk. Until there is a way to choose, it is the
 * oldest company the person belongs to — row-level security decides which
 * those are, and the order makes it the same one on every page, where "the
 * first row the database happened to return" did not. When choosing arrives,
 * it arrives here, and nothing else has to learn about it.
 */
export type CurrentCompany = { id: string; name: string; monthly_chat_usd: number };

export async function currentCompany(supabase: SupabaseClient<Database>): Promise<CurrentCompany | null> {
  const { data } = await supabase
    .from("os_companies")
    .select("id, name, monthly_chat_usd")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
