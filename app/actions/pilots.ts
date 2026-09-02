"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/intakeValidation";
import { PILOT_OFFERS, PILOT_STATUSES, PILOT_UPDATE_KINDS } from "@/lib/pilots";

/*
 * Operator-only pilot management. Every mutation runs through the caller's
 * RLS-scoped client, so non-operators match zero rows; the explicit
 * operator check up front only exists to avoid doing any work (including
 * the admin user lookup) for callers who aren't allowed in.
 */

export type PilotFormState = {
  status: "idle" | "saved" | "error";
  code?: "not_authorized" | "invalid" | "save_failed";
  field?: string;
};


const UUID = /^[0-9a-f-]{36}$/;

function text(value: FormDataEntryValue | null, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function option<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function dateOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function numberOrNull(value: FormDataEntryValue | null, { integer = false, max = 1e9 } = {}): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return null;
  return integer ? Math.round(parsed) : Math.round(parsed * 100) / 100;
}

async function operatorClient() {
  if (!isSupabaseConfigured()) return null;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!data) return null;
  return supabase;
}

export async function createPilotAction(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const clientEmail = text(formData.get("clientEmail"), 320)?.toLowerCase() ?? null;
  const company = text(formData.get("company"), 200);
  const workflow = text(formData.get("workflow"), 200);
  const offer = option(formData.get("offer"), PILOT_OFFERS) ?? "ai_operations";
  const status = option(formData.get("status"), PILOT_STATUSES) ?? "proposed";
  if (!clientEmail || !isValidEmail(clientEmail)) return { status: "error", code: "invalid", field: "clientEmail" };
  if (!company) return { status: "error", code: "invalid", field: "company" };
  if (!workflow) return { status: "error", code: "invalid", field: "workflow" };

  // If the client already has an account, attach the pilot now; otherwise
  // sign-in claims it later by verified email.
  let clientUserId: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    clientUserId = data?.users.find((user) => user.email?.toLowerCase() === clientEmail)?.id ?? null;
  } catch {
    clientUserId = null;
  }

  const { error } = await supabase.from("pilots").insert({
    client_user_id: clientUserId,
    client_email: clientEmail,
    company,
    workflow,
    offer,
    status,
    starts_on: dateOrNull(formData.get("startsOn")),
    ends_on: dateOrNull(formData.get("endsOn")),
    summary: text(formData.get("summary"), 4000),
    next_step: text(formData.get("nextStep"), 1000),
  });
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function updatePilotAction(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const pilotId = formData.get("pilotId");
  if (typeof pilotId !== "string" || !UUID.test(pilotId)) return { status: "error", code: "invalid" };
  const status = option(formData.get("status"), PILOT_STATUSES);
  if (!status) return { status: "error", code: "invalid", field: "status" };

  const { data, error } = await supabase
    .from("pilots")
    .update({
      status,
      starts_on: dateOrNull(formData.get("startsOn")),
      ends_on: dateOrNull(formData.get("endsOn")),
      summary: text(formData.get("summary"), 4000),
      next_step: text(formData.get("nextStep"), 1000),
    })
    .eq("id", pilotId)
    .select("id");
  if (error) return { status: "error", code: "save_failed" };
  if (!data?.length) return { status: "error", code: "not_authorized" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function addPilotUpdateAction(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const pilotId = formData.get("pilotId");
  if (typeof pilotId !== "string" || !UUID.test(pilotId)) return { status: "error", code: "invalid" };
  const title = text(formData.get("title"), 200);
  if (!title) return { status: "error", code: "invalid", field: "title" };

  const { error } = await supabase.from("pilot_updates").insert({
    pilot_id: pilotId,
    kind: option(formData.get("kind"), PILOT_UPDATE_KINDS) ?? "report",
    title,
    body: text(formData.get("body"), 8000),
    period_label: text(formData.get("periodLabel"), 60),
    output_count: numberOrNull(formData.get("outputCount"), { integer: true }),
    approval_latency_minutes: numberOrNull(formData.get("approvalLatencyMinutes"), { integer: true }),
    source_coverage_pct: numberOrNull(formData.get("sourceCoveragePct"), { max: 100 }),
    cost_usd: numberOrNull(formData.get("costUsd")),
    published: formData.get("published") === "on",
  });
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function deletePilotUpdateAction(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const updateId = formData.get("updateId");
  if (typeof updateId !== "string" || !UUID.test(updateId)) return { status: "error", code: "invalid" };

  const { error } = await supabase.from("pilot_updates").delete().eq("id", updateId);
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}
