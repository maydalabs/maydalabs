"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";

/*
 * The co-founder's two acts a person actually performs: starting a company,
 * and settling something the system brought back.
 *
 * Both run through the caller's own client. Nothing here is trusted: the
 * status machine, the approval gate, company membership and the append-only
 * record are all database rules, so this file can only ask, never decide.
 */

export type CofounderState = {
  status: "idle" | "saved" | "error";
  code?: "not_signed_in" | "invalid" | "failed" | "too_many" | "needs_approval";
  message?: string;
};

export async function startCompanyAction(_prev: CofounderState, formData: FormData): Promise<CofounderState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "not_signed_in" };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_signed_in" };

  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  const whatWeDo = String(formData.get("whatWeDo") ?? "").trim().slice(0, 2000) || null;
  if (!name) return { status: "error", code: "invalid" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("os_companies").insert({ name, what_we_do: whatWeDo });
  if (error) {
    return error.message.includes("company limit reached")
      ? { status: "error", code: "too_many" }
      : { status: "error", code: "failed" };
  }

  revalidatePath("/portal");
  return { status: "saved" };
}

/*
 * Settling one item.
 *
 * Approving is two writes and the order matters: the approval is recorded
 * first, because the database refuses to move an item to `approved` until the
 * exact action it waits on has been approved. If the second write fails the
 * approval stands on its own, which is the honest failure: a person did
 * decide, and the record says so.
 */
export async function decideWorkItemAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const itemId = String(formData.get("itemId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(itemId)) return;
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "send_back") return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);

  const supabase = await createSupabaseServerClient();

  // Read through the caller's own client: a row they cannot see does not exist.
  const { data: item } = await supabase
    .from("os_work_items")
    .select("id, status, required_action")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  if (decision === "approve") {
    if (item.required_action) {
      const { error: approvalError } = await supabase.from("os_approvals").insert({
        item_id: item.id,
        action: item.required_action,
        approved_by: claims.sub,
        approved_at: new Date().toISOString(),
        notes: note,
      });
      if (approvalError) return;
    }

    const { error } = await supabase.from("os_work_items").update({ status: "approved" }).eq("id", item.id);
    if (error) return;
    await supabase.rpc("os_record_event", {
      p_item_id: item.id,
      p_event: "approved",
      p_detail: { action: item.required_action, note },
    });
  } else {
    const { error } = await supabase.from("os_work_items").update({ status: "drafted" }).eq("id", item.id);
    if (error) return;
    await supabase.rpc("os_record_event", {
      p_item_id: item.id,
      p_event: "sent_back",
      p_detail: { note },
    });
  }

  revalidatePath("/portal");
}
