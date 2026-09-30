"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeApiKey, sealKey, vaultSecret } from "@/lib/osKeyVault";
import { parseModelSettings } from "@/lib/osModelSettings";
import type { EditResult } from "@/app/actions/cofounder";

/* Bringing your own key.
 *
 * Only an owner may choose the company's model or hand over a key, and the
 * key is sealed before it touches the database. The reads that decide who
 * is an owner go through the signed-in client, so RLS is the authority; the
 * write goes through the service role because no signed-in user may hold a
 * privilege on the ciphertext column, not even to write it.
 */

const UUID = /^[0-9a-f-]{36}$/;

async function owner(companyId: string): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { ok: false, error: "not_signed_in" };
  if (!UUID.test(companyId)) return { ok: false, error: "bad_company" };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("os_company_members").select("role")
    .eq("company_id", companyId).eq("user_id", claims.sub).maybeSingle();
  if (data?.role !== "owner") return { ok: false, error: "not_yours" };
  return { ok: true, userId: claims.sub };
}

export async function saveModelSettingsAction(previous: EditResult, formData: FormData): Promise<EditResult> {
  const version = previous.version + 1;
  const companyId = String(formData.get("companyId") ?? "");
  const gate = await owner(companyId);
  if (!gate.ok) return { error: gate.error, version };
  if (!vaultSecret()) return { error: "vault_locked", version };

  const parsed = parseModelSettings({
    provider: formData.get("provider"), model: formData.get("model"), baseUrl: formData.get("baseUrl"),
    inputPrice: formData.get("inputPrice"), outputPrice: formData.get("outputPrice"),
  });
  if (!parsed.ok) return { error: parsed.error, version };

  const admin = createSupabaseAdminClient();
  const columns = {
    provider: parsed.provider, model: parsed.model, base_url: parsed.baseUrl,
    input_usd_per_million: parsed.price.inputUsdPerMillion, output_usd_per_million: parsed.price.outputUsdPerMillion,
    set_by: gate.userId,
  };
  const rawKey = String(formData.get("apiKey") ?? "");
  if (rawKey.trim()) {
    const key = normalizeApiKey(rawKey);
    if (!key) return { error: "key", version };
    const sealed = sealKey(key);
    const row = { ...columns, key_ciphertext: sealed.ciphertext, key_last4: sealed.last4 };
    // Update, then insert: an upsert would have PostgREST set the primary key
    // on conflict, and the service role deliberately holds no such grant.
    const updated = await admin.from("os_model_settings").update(row, { count: "exact" }).eq("company_id", companyId);
    if (updated.error) return { error: "storage", version };
    if (updated.count === 0) {
      const inserted = await admin.from("os_model_settings").insert({ company_id: companyId, ...row });
      if (inserted.error) return { error: "storage", version };
    }
  } else {
    // No key typed: keep the stored one and change only the rest. There must
    // be a stored one; a setting with no key is not a setting.
    const { error, count } = await admin.from("os_model_settings").update(columns, { count: "exact" }).eq("company_id", companyId);
    if (error) return { error: "storage", version };
    if (count === 0) return { error: "key", version };
  }

  /* A schedule that stopped for want of a key resumes on the owner's own
   * save — only that pause, only this company. Other pauses keep their
   * reasons. */
  await admin.from("os_workflows").update({ paused_reason: null }).eq("company_id", companyId).eq("paused_reason", "no_key");

  revalidatePath("/os");
  return { error: null, version };
}

export async function removeModelSettingsAction(previous: EditResult, formData: FormData): Promise<EditResult> {
  const version = previous.version + 1;
  const companyId = String(formData.get("companyId") ?? "");
  const gate = await owner(companyId);
  if (!gate.ok) return { error: gate.error, version };
  const { error } = await createSupabaseAdminClient().from("os_model_settings").delete().eq("company_id", companyId);
  if (error) return { error: "storage", version };
  revalidatePath("/os");
  return { error: null, version };
}

/* The monthly ceiling is the owner's to set only while the company pays
 * with its own key; when MaydaLabs pays, it stays ours. The table check
 * (0 to 500) still applies. */
export async function setMonthlyCapAction(previous: EditResult, formData: FormData): Promise<EditResult> {
  const version = previous.version + 1;
  const companyId = String(formData.get("companyId") ?? "");
  const gate = await owner(companyId);
  if (!gate.ok) return { error: gate.error, version };
  const cap = Number(String(formData.get("monthlyCap") ?? "").trim().replace(",", "."));
  if (!Number.isFinite(cap) || cap < 0 || cap > 500) return { error: "cap", version };
  const admin = createSupabaseAdminClient();
  const { data: own } = await admin.from("os_model_settings").select("company_id").eq("company_id", companyId).maybeSingle();
  if (!own) return { error: "not_own_key", version };
  const { error } = await admin.from("os_companies").update({ monthly_chat_usd: Math.round(cap * 100) / 100 }).eq("id", companyId);
  if (error) return { error: "storage", version };
  revalidatePath("/os");
  return { error: null, version };
}
