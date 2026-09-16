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

  if (!error && data) return { allowed: true, claims, supabase } as const;

  /* Belonging to a company is the entitlement now.
   *
   * os_beta_status is the allowlist from the per-user private beta, and it
   * had become the wrong question: a founder who starts a company through
   * the front door is not on it, so "Set up workflows" led to a 404 and they
   * could never schedule anything. The loop was closed everywhere except
   * where a customer touches it.
   *
   * What stands between someone signing up and a bill is money, not this
   * gate: five workflows per person, five dollars a month each, and a daily
   * ceiling across all of them. Nothing runs on a schedule at all without
   * CRON_SECRET and a model key, neither of which is set in production. */
  const { data: membership } = await supabase
    .from("os_company_members")
    .select("user_id")
    .eq("user_id", claims.sub)
    .limit(1)
    .maybeSingle();

  if (membership) return { allowed: true, claims, supabase } as const;
  return { allowed: false, code: "invite_only" } as const;
});
