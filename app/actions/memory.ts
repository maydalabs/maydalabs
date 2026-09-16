"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";

/* Teaching it something, and correcting it.
 *
 * Both run through the caller's own client. Whether this is their company is
 * the database's question, and retirement goes through os_retire_memory
 * because nobody holds an update grant on the table: a memory is corrected by
 * being retired, never by being rewritten.
 */

const KINDS = ["fact", "preference", "constraint", "person", "decision"];

export async function teachMemoryAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const fact = String(formData.get("fact") ?? "").trim().slice(0, 2000);
  if (fact.length < 3) return;

  const kindRaw = String(formData.get("kind") ?? "fact");
  const kind = KINDS.includes(kindRaw) ? kindRaw : "fact";

  const supabase = await createSupabaseServerClient();
  const { data: company } = await supabase.from("os_companies").select("id").limit(1).maybeSingle();
  if (!company) return;

  // source and created_by are stamped by the trigger, not sent from here: a
  // form saying who wrote something is a form that can lie about it.
  await supabase.from("os_company_memory").insert({ company_id: company.id, fact, kind });

  revalidatePath("/os");
}

export async function retireMemoryAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const id = String(formData.get("memoryId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("os_retire_memory", { p_id: id, p_reason: reason || undefined });

  revalidatePath("/os");
}
