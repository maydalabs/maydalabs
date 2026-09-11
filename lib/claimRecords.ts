import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * After a successful sign-in, attach the records this person created before
 * they had an account: enquiries and the updates preference submitted with
 * the same email address the code just verified, and any engagement set up
 * for that address. Matching on a verified email is safe: the code proved
 * control of the inbox.
 *
 * Deliberately NOT a server action: it takes a userId and must only ever be
 * called from server code that just verified that user's session.
 */
export async function claimRecordsByEmail(userId: string, verifiedEmail: string | null) {
  const email = verifiedEmail?.trim().toLowerCase();
  if (!email) return;

  const admin = createSupabaseAdminClient();

  await admin.from("lead_intakes").update({ user_id: userId }).eq("email", email).is("user_id", null);
  await admin.from("subscriptions").update({ user_id: userId }).eq("email", email).is("user_id", null);

  // Engagements created for this address before the client had an account.
  await admin
    .from("pilots")
    .update({ client_user_id: userId })
    .eq("client_email", email)
    .is("client_user_id", null);
}
