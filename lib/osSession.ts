/* Everything an OS app needs before it can render: who is signed in, and
 * what their credit balance is for the system bar. */

import { redirect } from "next/navigation";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath, type Locale } from "@/lib/i18n";
import { OS_STARTING_CREDITS, creditsLeft } from "@/lib/os";

export async function requireOsSession(locale: Locale, app: string) {
  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath(`/auth/sign-in?next=/os/${app}`, locale));

  const supabase = await createSupabaseServerClient();
  const { data: credit } = await supabase.from("os_credits").select("granted, used").maybeSingle();
  const granted = credit?.granted ?? OS_STARTING_CREDITS;
  const used = credit?.used ?? 0;

  return {
    claims,
    supabase,
    credits: { left: creditsLeft(granted, used), granted, used },
  };
}
