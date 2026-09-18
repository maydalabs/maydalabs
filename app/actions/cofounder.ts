"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { OS_LANES } from "@/lib/osWork";

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
  revalidatePath("/os");
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
/* The moves a person can make that are not an approval. Each is a status and
 * the word the record will use for it. */
const MOVES = {
  send_back: { status: "drafted", event: "sent_back" },
  reopen: { status: "drafted", event: "reopened" },
  resubmit: { status: "review", event: "resubmitted" },
} as const;

export async function decideWorkItemAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const itemId = String(formData.get("itemId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(itemId)) return;
  const decision = String(formData.get("decision") ?? "");
  if (!(decision === "approve" || decision in MOVES)) return;
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
    // Whether this move is legal from where the item stands is the
    // database's question; this only names the move.
    const move = MOVES[decision as keyof typeof MOVES];
    const { error } = await supabase.from("os_work_items").update({ status: move.status }).eq("id", item.id);
    if (error) return;
    await supabase.rpc("os_record_event", {
      p_item_id: item.id,
      p_event: move.event,
      p_detail: { note },
    });
  }

  revalidatePath("/portal");
  // The same decision is made from the desk now, and a desk that still shows
  // the item as waiting after you approved it is lying.
  revalidatePath("/os");
}

/*
 * Finishing, and dismissing.
 *
 * Both are one call into the database, because both are several writes that
 * must happen together or not at all: the walk to `completed`, the outcome
 * appended to the item, the line in the record. The link is checked here for
 * a useful early no, and checked again there because a form is not where a
 * rule lives.
 */
export async function completeWorkItemAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const itemId = String(formData.get("itemId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(itemId)) return;

  const rawUrl = String(formData.get("url") ?? "").trim().slice(0, 2000);
  if (rawUrl && !/^https?:\/\/\S+$/i.test(rawUrl)) return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("os_complete_item", {
    p_item_id: itemId,
    p_url: rawUrl || undefined,
    p_note: note || undefined,
  });

  revalidatePath("/portal");
  revalidatePath("/os");
}

export async function dismissWorkItemAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const itemId = String(formData.get("itemId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(itemId)) return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("os_dismiss_item", { p_item_id: itemId, p_reason: reason || undefined });

  revalidatePath("/portal");
  revalidatePath("/os");
}

/*
 * A person adds their own work.
 *
 * Until this, every item was made by the co-founder or the worker, and
 * neither runs without a model key — so the live desk had no way to hold any
 * work at all. It is born `pending`, through the caller's own client, so the
 * insert policy decides whether this is their company and the gate decides
 * whether that birth state is allowed.
 *
 * `by: "person"` is a rendering hint and nothing more: it stops the document
 * setting a person's own note in the co-founder's serif. Who actually added
 * it is the event below, which the database stamps with the actor itself —
 * a form that says who wrote something is a form that can lie about it.
 */
export async function addWorkItemAction(formData: FormData): Promise<void> {
  await addWork(formData);
}

/* The same act from ⌘K, which wants to know whether it happened. A form
 * submit cannot use a return value; a command bar can. */
export async function captureWorkItemAction(formData: FormData): Promise<{ id: string } | { error: string }> {
  return addWork(formData);
}

async function addWork(formData: FormData): Promise<{ id: string } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "not_configured" };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { error: "not_signed_in" };

  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { error: "empty" };
  const laneRaw = String(formData.get("lane") ?? "ops");
  const lane = (OS_LANES as readonly string[]).includes(laneRaw) ? laneRaw : "ops";
  const dueOn = asDate(formData.get("due_on"));

  const supabase = await createSupabaseServerClient();
  const company = await currentCompany(supabase);
  if (!company) return { error: "no_company" };

  const { data: item, error } = await supabase
    .from("os_work_items")
    .insert({
      company_id: company.id,
      lane,
      kind: "task",
      title,
      notes: "",
      status: "pending",
      due_on: dueOn,
      metadata: { by: "person" },
    })
    .select("id")
    .single();
  if (error || !item) return { error: error?.message ?? "failed" };

  await supabase.rpc("os_record_event", { p_item_id: item.id, p_event: "added", p_detail: {} });

  revalidatePath("/os");
  return { id: item.id };
}

/* A calendar date or nothing. The input is a date field, but a form is a
 * form: whatever arrives is checked against the shape a date column takes. */
function asDate(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

/* `version` counts submissions, so the editor can tell a fresh result from
 * the one it already showed without comparing clocks. */
export type EditResult = { error: string | null; version: number };

export async function editWorkItemAction(previous: EditResult, formData: FormData): Promise<EditResult> {
  const version = previous.version + 1;
  if (!isSupabaseConfigured()) return { error: "not_configured", version };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { error: "not_signed_in", version };

  const itemId = String(formData.get("itemId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(itemId)) return { error: "bad_item", version };

  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { error: "empty", version };
  const laneRaw = String(formData.get("lane") ?? "");
  const lane = (OS_LANES as readonly string[]).includes(laneRaw) ? laneRaw : null;
  const notes = String(formData.get("notes") ?? "").slice(0, 8_000);

  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase
    .from("os_work_items")
    .update({ title, notes, due_on: asDate(formData.get("due_on")), ...(lane ? { lane } : {}) }, { count: "exact" })
    .eq("id", itemId);

  if (error) return { error: error.message, version };
  // Zero rows is the row policy saying "not yours", silently. Say it.
  if (count === 0) return { error: "not_yours", version };

  revalidatePath("/os");
  return { error: null, version };
}

/*
 * An operator routes the site's leads to a company, or stops.
 *
 * Through the caller's own client: the connection table's policy admits
 * operators and nobody else, so a member pressing this gets the database's
 * refusal, not a form's. The company id is the one on the form, but the
 * function refuses any company the caller could not route to anyway.
 */
export async function connectSiteLeadsAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const companyId = String(formData.get("companyId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(companyId)) return;
  const active = String(formData.get("active") ?? "") === "on";

  const supabase = await createSupabaseServerClient();
  await supabase.rpc("os_connect_site_leads", { p_company_id: companyId, p_active: active });

  revalidatePath("/os");
}
