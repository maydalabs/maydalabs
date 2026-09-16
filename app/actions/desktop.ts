"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { sanitizeLayout } from "@/lib/osDesktop";

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
