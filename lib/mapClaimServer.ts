import "server-only";

import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MAP_CLAIM_COOKIE } from "@/lib/mapClaim";

/**
 * After a successful sign-in, adopt the records this person created before
 * they had an account:
 *
 * - Multiplier Maps saved anonymously from this browser. The cookie holds
 *   the raw token; only its hash is stored, and rows are matched by hash
 *   while still unowned.
 * - Lead intakes and subscription preferences submitted with the SAME
 *   email address the OTP just verified. Matching on a verified email is
 *   safe: the code proved control of the inbox.
 *
 * Deliberately NOT a server action: it takes a userId and must only ever be
 * called from server code that just verified that user's session.
 */
export async function claimAnonymousRecords(userId: string, verifiedEmail: string | null) {
  const admin = createSupabaseAdminClient();

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(MAP_CLAIM_COOKIE)?.value;
  if (rawToken && /^[a-f0-9]{64}$/.test(rawToken)) {
    const { createHash } = await import("node:crypto");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await admin
      .from("multiplier_maps")
      .update({ user_id: userId, claim_token_hash: null })
      .eq("claim_token_hash", tokenHash)
      .is("user_id", null);
    cookieStore.delete(MAP_CLAIM_COOKIE);
  }

  const email = verifiedEmail?.trim().toLowerCase();
  if (!email) return;

  await admin
    .from("lead_intakes")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);

  await admin
    .from("subscriptions")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);
}
