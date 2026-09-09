/* What every MaydaOS surface needs before it renders: a person the database
 * confirms may be here.
 *
 * There is no balance to look up any more. The budget belongs to the
 * workflow, not to the person, so it is read where a run is about to be
 * charged against it rather than on every page.
 */

import { notFound } from "next/navigation";
import { getOsBetaAccess } from "@/lib/osBetaAccess";

export async function requireOsSession() {
  const access = await getOsBetaAccess();
  // No public preview and no invitation funnel: sign in through the ordinary
  // account page, and the work appears only if a workflow is installed for you.
  if (!access.allowed) notFound();
  return { claims: access.claims, supabase: access.supabase };
}

/* The same check without the redirect, for a page that shows the work only
 * when there is work to show and its ordinary content otherwise. */
export async function getOsSession() {
  const access = await getOsBetaAccess();
  if (!access.allowed) return null;
  return { claims: access.claims, supabase: access.supabase };
}
