"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { draftFromSources } from "@/lib/osDraft";
import { isOsAllowed } from "@/lib/osAccess";
import { gatherSources } from "@/lib/osGather";
import {
  asStandingSources,
  parseStandingSources,
  OS_MODEL,
  OS_EFFORT,
  OS_STARTING_CREDITS,
  OS_TOPIC_LIMIT,
  parseSourceUrls,
  runCostUsd,
} from "@/lib/os";

/*
 * One run of the MaydaOS beta.
 *
 * Two budgets stand between a signed-in stranger and the API bill: the
 * person's own credits, and a daily ceiling across everyone. A credit is
 * spent only when the model actually produced something, so a failed fetch
 * or a model error costs the person nothing.
 */

export type OsRunState = {
  status: "idle" | "drafted" | "error";
  code?:
    | "not_signed_in"
    | "invite_only"
    | "no_credits"
    | "daily_cap"
    | "invalid"
    | "no_workflow"
    | "no_sources"
    | "model_failed"
    | "save_failed";
  message?: string;
};

/* Worst case this many dollars a day, so a bug or an enthusiast costs days
 * rather than the whole balance in an afternoon. */
const DAILY_USD_CAP = Number(process.env.MAYDAOS_DAILY_USD_CAP ?? "2");

export async function runOsDraftAction(_prev: OsRunState, formData: FormData): Promise<OsRunState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "not_signed_in" };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_signed_in" };
  const userId = claims.sub;
  // The balance is ours, so being signed in is not the same as being allowed
  // to spend it.
  if (!isOsAllowed(claims.email)) return { status: "error", code: "invite_only" };

  const topic = String(formData.get("topic") ?? "").trim().slice(0, OS_TOPIC_LIMIT);
  if (!topic) return { status: "error", code: "invalid", message: "Give it a topic." };

  const workflowId = String(formData.get("workflowId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(workflowId)) return { status: "error", code: "no_workflow" };

  // Read the workflow through the caller's own client: row-level security
  // decides whether it is a template or one installed for them.
  const scoped = await createSupabaseServerClient();
  const { data: workflow } = await scoped
    .from("os_workflows")
    .select("id, key, name, brief, shape, max_sources, active, standing_sources, window_days")
    .eq("id", workflowId)
    .maybeSingle();
  if (!workflow || !workflow.active) return { status: "error", code: "no_workflow" };

  const standing = asStandingSources(workflow.standing_sources);
  const { urls, rejected } = parseSourceUrls(String(formData.get("sources") ?? ""));
  // A workflow that carries its own sources runs with nothing pasted at all.
  if (standing.length === 0 && urls.length === 0) {
    return {
      status: "error",
      code: "no_sources",
      message: rejected.length ? `Not a usable link: ${rejected[0]}` : `Add one to ${workflow.max_sources} links.`,
    };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { status: "error", code: "save_failed" };

  // Balance first: everything after this costs money. A first-time visitor
  // gets their grant here rather than at sign-up, so the row exists only for
  // people who actually try it.
  let { data: credit } = await admin
    .from("os_credits")
    .select("granted, used")
    .eq("user_id", userId)
    .maybeSingle();

  if (!credit) {
    const { data: created } = await admin
      .from("os_credits")
      .insert({ user_id: userId, granted: OS_STARTING_CREDITS })
      .select("granted, used")
      .maybeSingle();
    credit = created ?? { granted: OS_STARTING_CREDITS, used: 0 };
  }

  if (credit.granted - credit.used <= 0) return { status: "error", code: "no_credits" };

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data: today } = await admin
    .from("os_runs")
    .select("cost_usd")
    .gte("created_at", since.toISOString());
  const spentToday = (today ?? []).reduce((total, row) => total + Number(row.cost_usd ?? 0), 0);
  if (spentToday >= DAILY_USD_CAP) return { status: "error", code: "daily_cap" };

  const { sources, failures } = await gatherSources(standing, urls, {
    maxSources: workflow.max_sources,
    windowDays: workflow.window_days ?? 7,
  });
  if (sources.length === 0) {
    const first = failures[0];
    return {
      status: "error",
      code: "no_sources",
      message: first ? `${first.url}: ${first.reason}` : "Nothing could be read this time.",
    };
  }

  const drafted = await draftFromSources(topic, workflow.brief, sources);
  if ("error" in drafted) {
    // Nothing was produced, so nothing is charged.
    await admin.from("os_runs").insert({
      user_id: userId,
      workflow_id: workflow.id,
      shape: workflow.shape,
      topic,
      sources: sources.map((source) => ({ url: source.url, title: source.title, chars: source.chars })),
      status: "failed",
      model: OS_MODEL,
      effort: OS_EFFORT,
      error: drafted.error.slice(0, 500),
    });
    revalidatePath("/os/desk");
    return { status: "error", code: "model_failed", message: drafted.error };
  }

  const cost = runCostUsd(drafted.inputTokens, drafted.outputTokens);
  const { error: insertError } = await admin.from("os_runs").insert({
    user_id: userId,
    workflow_id: workflow.id,
    shape: workflow.shape,
    topic,
    sources: sources.map((source) => ({ url: source.url, title: source.title, chars: source.chars })),
    status: "drafted",
    draft: drafted.draft.slice(0, 20_000),
    claims: drafted.claims,
    model: OS_MODEL,
    effort: OS_EFFORT,
    input_tokens: drafted.inputTokens,
    output_tokens: drafted.outputTokens,
    cost_usd: cost,
  });
  if (insertError) return { status: "error", code: "save_failed" };

  // Charged only now, for work that exists, and incremented in the database
  // so two runs at once cannot both spend the same last credit.
  await admin.rpc("os_spend_credit", { p_user_id: userId });

  revalidatePath("/os/desk");
  return { status: "drafted" };
}

export type OsDecisionState = { status: "idle" | "saved" | "error" };

export async function decideOsRunAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const runId = String(formData.get("runId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(runId)) return;
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;

  // The caller's own client: the column grant allows the decision and
  // nothing else, and row-level security allows only their own run.
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("os_runs")
    .update({ decision, decision_note: note, decided_at: new Date().toISOString() })
    .eq("id", runId);

  revalidatePath("/os/desk");
}

/* Operator-only: more rope for one person, decided case by case while
 * pricing stays switched off. */
export async function grantOsCreditsAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const supabase = await createSupabaseServerClient();
  const { data: operator } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!operator) return;

  const userId = String(formData.get("userId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(userId)) return;
  const granted = Number(formData.get("granted"));
  if (!Number.isInteger(granted) || granted < 0 || granted > 1000) return;

  // Row-level security already limits this to operators; the check above only
  // avoids doing the work for anyone else.
  await supabase.from("os_credits").update({ granted }).eq("user_id", userId);

  revalidatePath("/internal/os");
}

/* Where an approved draft ended up. MaydaOS never posts anything, so this is
 * a record of what a person did with the work, not proof the system acted. */
export async function recordOsOutcomeAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return;

  const runId = String(formData.get("runId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(runId)) return;

  const raw = String(formData.get("publishedUrl") ?? "").trim();
  let url: string | null = null;
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "https:") return;
      url = parsed.toString().slice(0, 500);
    } catch {
      return;
    }
  }

  // Their own run, and only these columns: the grant sees to that.
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("os_runs")
    .update({ published_url: url, published_at: url ? new Date().toISOString() : null })
    .eq("id", runId)
    .eq("decision", "approved");

  revalidatePath("/os/desk");
  revalidatePath("/os/record");
}

export type OsWorkflowFormState = {
  status: "idle" | "saved" | "error";
  code?: "not_authorized" | "invalid" | "save_failed" | "unknown_client";
  field?: string;
};

/* Installing a workflow. This is the operator's core move: a named piece of
 * work, its instruction, and who it belongs to. Leave the client email blank
 * and it is a template everyone can run. */
export async function saveOsWorkflowAction(
  _prev: OsWorkflowFormState,
  formData: FormData,
): Promise<OsWorkflowFormState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "not_authorized" };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_authorized" };

  const supabase = await createSupabaseServerClient();
  const { data: operator } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!operator) return { status: "error", code: "not_authorized" };

  const key = String(formData.get("key") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,60}$/.test(key)) return { status: "error", code: "invalid", field: "key" };

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const purpose = String(formData.get("purpose") ?? "").trim().slice(0, 300);
  const brief = String(formData.get("brief") ?? "").trim().slice(0, 4000);
  if (!name) return { status: "error", code: "invalid", field: "name" };
  if (!purpose) return { status: "error", code: "invalid", field: "purpose" };
  if (!brief) return { status: "error", code: "invalid", field: "brief" };

  const shapeRaw = String(formData.get("shape") ?? "note");
  const shape = ["note", "post", "summary"].includes(shapeRaw) ? shapeRaw : "note";
  const destination = String(formData.get("destination") ?? "").trim().slice(0, 200) || null;
  const maxSources = Math.min(5, Math.max(1, Number(formData.get("maxSources")) || 5));
  const windowDays = Math.min(90, Math.max(1, Number(formData.get("windowDays")) || 7));
  const standingSources = parseStandingSources(String(formData.get("standingSources") ?? ""));
  const active = formData.get("active") === "on";

  // Installed for one client, or a template for everyone.
  const clientEmail = String(formData.get("clientEmail") ?? "").trim().toLowerCase();
  let ownerUserId: string | null = null;
  if (clientEmail) {
    const admin = createSupabaseAdminClient();
    if (!admin) return { status: "error", code: "save_failed" };
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = (users?.users ?? []).find((user) => user.email?.toLowerCase() === clientEmail);
    if (!match) return { status: "error", code: "unknown_client", field: "clientEmail" };
    ownerUserId = match.id;
  }

  const { error } = await supabase.from("os_workflows").upsert(
    {
      key,
      owner_user_id: ownerUserId,
      name,
      purpose,
      brief,
      shape,
      destination,
      max_sources: maxSources,
      window_days: windowDays,
      standing_sources: standingSources,
      active,
    },
    { onConflict: "key" },
  );
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/internal/os");
  revalidatePath("/os/desk");
  return { status: "saved" };
}
