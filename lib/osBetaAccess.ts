import "server-only";
import { cache } from "react";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";

/** One authority for pages and actions. RLS checks the same live membership.
 * Missing migration, query failure, revoked membership: all fail closed. */
export const getOsBetaAccess = cache(async () => {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { allowed: false, code: "not_signed_in" } as const;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("os_beta_status")
    .select("user_id")
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (error || !data) return { allowed: false, code: "invite_only" } as const;
  return { allowed: true, claims, supabase } as const;
});
