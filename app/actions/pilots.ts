"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/intakeValidation";
import { PILOT_OFFERS, PILOT_STATUSES, PILOT_UPDATE_KINDS, PROPOSAL_ORIGINS } from "@/lib/pilots";

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

/* ------------------------------------------------------------ proposals
 * "Prepared for you": the work done for a prospect before the outreach
 * note goes out. One per pilot; upsert keyed on pilot_id. Line-based
 * textareas are parsed here into the jsonb shapes the view expects.
 */

function parseObservations(value: FormDataEntryValue | null): { text: string; source_url: string | null; source_label: string | null }[] {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => {
      const [textPart = "", urlPart = "", labelPart = ""] = line.split("|").map((part) => part.trim());
      const url = /^https?:\/\//i.test(urlPart) ? urlPart.slice(0, 500) : null;
      return { text: textPart.slice(0, 400), source_url: url, source_label: labelPart ? labelPart.slice(0, 80) : null };
    })
    .filter((item) => item.text);
}

function parseScope(value: FormDataEntryValue | null): { label: string; title: string; detail: string | null }[] {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const [labelPart = "", titlePart = "", detailPart = ""] = line.split("|").map((part) => part.trim());
      // "Title only" lines still work: the label becomes the title.
      const title = titlePart || labelPart;
      const label = titlePart ? labelPart : "";
      return { label: label.slice(0, 40), title: title.slice(0, 160), detail: detailPart ? detailPart.slice(0, 600) : null };
    })
    .filter((item) => item.title);
}

function safeHref(value: FormDataEntryValue | null): string | null {
  const href = text(value, 500);
  if (!href) return null;
  return /^(https?:\/\/|mailto:)/i.test(href) ? href : null;
}

export async function upsertPilotProposalAction(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const pilotId = formData.get("pilotId");
  if (typeof pilotId !== "string" || !UUID.test(pilotId)) return { status: "error", code: "invalid", field: "pilotId" };
  const headline = text(formData.get("headline"), 200);
  const angle = text(formData.get("angle"), 2000);
  if (!headline) return { status: "error", code: "invalid", field: "headline" };
  if (!angle) return { status: "error", code: "invalid", field: "angle" };
  const ctaUrlRaw = text(formData.get("ctaUrl"), 500);
  const ctaUrl = safeHref(formData.get("ctaUrl"));
  if (ctaUrlRaw && !ctaUrl) return { status: "error", code: "invalid", field: "ctaUrl" };

  const { data, error } = await supabase
    .from("pilot_proposals")
    .upsert(
      {
        pilot_id: pilotId,
        origin: option(formData.get("origin"), PROPOSAL_ORIGINS) ?? "outreach",
        headline,
        angle,
        observations: parseObservations(formData.get("observations")),
        sample_title: text(formData.get("sampleTitle"), 200),
        sample_body: text(formData.get("sampleBody"), 12000),
        sample_note: text(formData.get("sampleNote"), 600),
        scope: parseScope(formData.get("scope")),
        role_title: text(formData.get("roleTitle"), 200),
        role_note: text(formData.get("roleNote"), 4000),
        terms: text(formData.get("terms"), 2000),
        cta_label: text(formData.get("ctaLabel"), 80),
        cta_url: ctaUrl,
        published: formData.get("published") === "on",
      },
      { onConflict: "pilot_id" },
    )
    .select("id");
  if (error) return { status: "error", code: "save_failed" };
  if (!data?.length) return { status: "error", code: "not_authorized" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function deletePilotProposalAction(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const supabase = await operatorClient();
  if (!supabase) return { status: "error", code: "not_authorized" };

  const proposalId = formData.get("proposalId");
  if (typeof proposalId !== "string" || !UUID.test(proposalId)) return { status: "error", code: "invalid" };

  const { error } = await supabase.from("pilot_proposals").delete().eq("id", proposalId);
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}
