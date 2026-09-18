"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { sanitizeLayout, sanitizePrefs } from "@/lib/osDesktop";

/* Where your windows are.
 *
 * Deliberately not revalidating anything: this is the only write in the
 * product whose result the person has already seen. They moved the window;
 * re-rendering the page to tell them so would take the desk away and give it
 * back.
 */
export async function saveDesktopAction(layout: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("os_desktops")
    .upsert({ user_id: claims.sub, layout: sanitizeLayout(layout) }, { onConflict: "user_id" });
}

/* "I have looked at this."
 *
 * Through a function that can only ever set it to now(), because a claim
 * about when you last looked is not one worth letting anyone backdate.
 */
export async function markSeenAction(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("os_mark_seen");
  revalidatePath("/os");
}

/* How you like your desk.
 *
 * Wallpaper, accent: rebuilt from an allowlist before it is stored, like the
 * layout. Not revalidated either — the person chose it by pressing it and
 * saw it change under their hand; the database is only asked to remember.
 */
export async function savePrefsAction(prefs: unknown): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("os_desktops")
    .upsert({ user_id: claims.sub, prefs: sanitizePrefs(prefs) }, { onConflict: "user_id" });
}

/* Put every window back where it ships. The layout is forgotten rather than
 * rewritten: an empty layout is what a person who has never touched the desk
 * has, and that is exactly the state being asked for. */
export async function resetDesktopAction(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("os_desktops").upsert({ user_id: claims.sub, layout: [] }, { onConflict: "user_id" });
}
