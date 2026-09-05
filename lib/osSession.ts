/* Everything an OS app needs before it can render: who is signed in, and
 * what their credit balance is for the system bar. */

import { notFound } from "next/navigation";
import { getOsBetaAccess } from "@/lib/osBetaAccess";
import { OS_STARTING_CREDITS, creditsLeft } from "@/lib/os";

export async function requireOsSession() {
  const access = await getOsBetaAccess();
  // No public preview or invitation funnel. Sign in via the ordinary account
  // page first, then use the private URL if you have been granted access.
  if (!access.allowed) notFound();
  const { claims, supabase } = access;
  const { data: credit } = await supabase.from("os_credits").select("granted, used").eq("user_id", claims.sub).maybeSingle();
  const granted = credit?.granted ?? OS_STARTING_CREDITS;
  const used = credit?.used ?? 0;

  return {
    claims,
    supabase,
    credits: { left: creditsLeft(granted, used), granted, used },
  };
}
