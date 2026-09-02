import "server-only";

import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MAP_CLAIM_COOKIE } from "@/lib/mapClaim";

/**
 * After a successful sign-in, adopt any Multiplier Maps this browser created
 * anonymously. The cookie holds the raw token; only its hash is stored, and
 * rows are matched by hash while still unowned.
 *
 * Deliberately NOT a server action: it takes a userId and must only ever be
 * called from server code that just verified that user's session.
 */
export async function claimAnonymousMaps(userId: string) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(MAP_CLAIM_COOKIE)?.value;
  if (!rawToken || !/^[a-f0-9]{64}$/.test(rawToken)) return;

  const { createHash } = await import("node:crypto");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const admin = createSupabaseAdminClient();
  await admin
    .from("multiplier_maps")
    .update({ user_id: userId, claim_token_hash: null })
    .eq("claim_token_hash", tokenHash)
    .is("user_id", null);

  cookieStore.delete(MAP_CLAIM_COOKIE);
}
