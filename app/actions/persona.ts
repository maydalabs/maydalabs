"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { parseAddress, parsePersona } from "@/lib/osPersona";
import type { EditResult } from "@/app/actions/cofounder";

/* Naming the co-founder, and saying how it should address you.
 *
 * Both go through the caller's own client: the owner policy on the company
 * row and the own-row policy on the membership row are the authority, and
 * the table checks are the last word on the limits. No service role is
 * involved anywhere here, because nothing here is a secret.
 */

const UUID = /^[0-9a-f-]{36}$/;

export async function savePersonaAction(previous: EditResult, formData: FormData): Promise<EditResult> {
  const version = previous.version + 1;
  if (!isSupabaseConfigured()) return { error: "not_configured", version };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { error: "not_signed_in", version };

  const companyId = String(formData.get("companyId") ?? "");
  if (!UUID.test(companyId)) return { error: "bad_company", version };

  const parsed = parsePersona({ name: formData.get("name"), voice: formData.get("voice"), note: formData.get("note") });
  if (!parsed.ok) return { error: parsed.error, version };

  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase
    .from("os_companies")
    .update({ cofounder_name: parsed.name, cofounder_voice: parsed.voice, cofounder_note: parsed.note }, { count: "exact" })
    .eq("id", companyId);
  if (error) return { error: "storage", version };
  // Zero rows is the owner policy saying no, silently. Say it.
  if (count === 0) return { error: "not_yours", version };

  revalidatePath("/os");
  revalidatePath("/portal");
  return { error: null, version };
}

export async function setAddressAction(previous: EditResult, formData: FormData): Promise<EditResult> {
  const version = previous.version + 1;
  if (!isSupabaseConfigured()) return { error: "not_configured", version };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { error: "not_signed_in", version };

  const supabase = await createSupabaseServerClient();
  const company = await currentCompany(supabase);
  if (!company) return { error: "no_company", version };

  const parsed = parseAddress(formData.get("address"));
  if (!parsed.ok) return { error: parsed.error, version };

  // The company from the desk and the person from the verified claims —
  // never from the form. Clearing is saving an empty field.
  const { error, count } = await supabase
    .from("os_company_members")
    .update({ address_as: parsed.address }, { count: "exact" })
    .eq("company_id", company.id)
    .eq("user_id", claims.sub);
  if (error) return { error: "storage", version };
  if (count === 0) return { error: "not_member", version };

  revalidatePath("/os");
  return { error: null, version };
}
