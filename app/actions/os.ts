"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { draftFromSources } from "@/lib/osDraft";
import { getOsBetaAccess } from "@/lib/osBetaAccess";
import { gatherSources } from "@/lib/osGather";
import {
  asStandingSources,
  OS_SHAPES,
  OS_CADENCES,
  parseStandingSources,
  monthStart,
  workflowBudget,
  OS_MODEL,
  OS_EFFORT,
  OS_DEFAULT_MONTHLY_BUDGET_USD,
  OS_TOPIC_LIMIT,
  parseSourceUrls,
  runCostUsd,
  workflowKeyFromName,
} from "@/lib/os";

/*
 * One run of a workflow.
 *
 * Two budgets stand between a run and the API bill: what this workflow may
 * spend this calendar month, and a daily ceiling across every workflow. Only
 * work that exists is charged, so a failed fetch or a model error costs
 * nothing and is still recorded.
 */

export type OsRunState = {
  status: "idle" | "drafted" | "error";
  code?:
    | "not_signed_in"
    | "invite_only"
    | "budget_spent"
    | "daily_cap"
    | "invalid"
    | "no_workflow"
    | "no_sources"
    | "model_failed"
    | "save_failed";
  message?: string;
};

/* Worst case this many dollars a day across every workflow, so a bug or a
 * busy morning costs days rather than the whole balance in an afternoon. */
const DAILY_USD_CAP = Number(process.env.MAYDAOS_DAILY_USD_CAP ?? "2");

export async function runOsDraftAction(_prev: OsRunState, formData: FormData): Promise<OsRunState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "not_signed_in" };
  const access = await getOsBetaAccess();
  if (!access.allowed) return { status: "error", code: access.code };
  const { claims, supabase: scoped } = access;
  const userId = claims.sub;

  const topic = String(formData.get("topic") ?? "").trim().slice(0, OS_TOPIC_LIMIT);
  if (!topic) return { status: "error", code: "invalid", message: "Give it a topic." };

  const workflowId = String(formData.get("workflowId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(workflowId)) return { status: "error", code: "no_workflow" };

  // Read the workflow through the caller's own client: row-level security
  // decides whether it is a template or one installed for them.
  const { data: workflow } = await scoped
    .from("os_workflows")
    .select("id, key, name, brief, shape, max_sources, active, standing_sources, window_days, monthly_budget_usd")
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

  // Budget first: everything after this costs money. What this workflow has
  // already spent this month is the sum of what its runs actually cost, so
  // the limit is measured in the same units it is set in.
  const since = monthStart();
  const { data: monthRuns, error: monthError } = await admin
    .from("os_runs")
    .select("cost_usd")
    .eq("workflow_id", workflow.id)
    .gte("created_at", since.toISOString());
  // Unknown spend is not zero spend. Refuse before any source/model request
  // if the database cannot establish the applicable budget usage.
  if (monthError || !monthRuns) return { status: "error", code: "save_failed" };
  const spentThisMonth = monthRuns.reduce((total, row) => total + Number(row.cost_usd ?? 0), 0);
  const budget = workflowBudget(spentThisMonth, Number(workflow.monthly_budget_usd ?? OS_DEFAULT_MONTHLY_BUDGET_USD));
  if (budget.exhausted) {
    return {
      status: "error",
      code: "budget_spent",
      message: `${workflow.name} has used its budget for this month ($${budget.budgetUsd.toFixed(2)}).`,
    };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { data: todayRuns, error: todayError } = await admin
    .from("os_runs")
    .select("cost_usd")
    .gte("created_at", today.toISOString());
  if (todayError || !todayRuns) return { status: "error", code: "save_failed" };
  const spentToday = todayRuns.reduce((total, row) => total + Number(row.cost_usd ?? 0), 0);
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
    revalidatePath("/portal");
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

  // Nothing further to charge: the run row carries its own cost, and the
  // month's spend is the sum of those rows. There is no second number to
  // keep in step with the first.
  revalidatePath("/portal");
  revalidatePath("/portal/work");
  return { status: "drafted" };
}

export type OsDecisionState = { status: "idle" | "saved" | "error" };

export async function decideOsRunAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const access = await getOsBetaAccess();
  if (!access.allowed) return;

  const runId = String(formData.get("runId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(runId)) return;
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") return;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;

  // The caller's own client: the column grant allows the decision and
  // nothing else, and row-level security allows only their own run.
  const { supabase } = access;
  await supabase
    .from("os_runs")
    .update({ decision, decision_note: note, decided_at: new Date().toISOString() })
    .eq("id", runId);

  revalidatePath("/portal");
  revalidatePath("/portal/work");
}

/* Where an approved draft ended up. MaydaOS never posts anything, so this is
 * a record of what a person did with the work, not proof the system acted. */
export async function recordOsOutcomeAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const access = await getOsBetaAccess();
  if (!access.allowed) return;

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
  const { supabase } = access;
  await supabase
    .from("os_runs")
    .update({ published_url: url, published_at: url ? new Date().toISOString() : null })
    .eq("id", runId)
    .eq("decision", "approved");

  revalidatePath("/portal");
  revalidatePath("/portal/work");
}

export type OsWorkflowFormState = {
  status: "idle" | "saved" | "error";
  code?: "not_authorized" | "invalid" | "save_failed" | "unknown_client" | "too_many";
  field?: string;
};
/* A member setting up their own work.
 *
 * Everything that must not happen here is refused by the database, not by
 * this function: the trigger in migration 16 pins the owner to the caller,
 * pins the budget out of their reach, and stops them at five. So this runs
 * through the caller's own client with no elevated credential anywhere, and a
 * bug in the form below cannot become a way to spend our API balance.
 */
export async function saveMemberWorkflowAction(
  _prev: OsWorkflowFormState,
  formData: FormData,
): Promise<OsWorkflowFormState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "not_authorized" };
  const access = await getOsBetaAccess();
  if (!access.allowed) return { status: "error", code: "not_authorized" };
  const { claims, supabase } = access;

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const purpose = String(formData.get("purpose") ?? "").trim().slice(0, 300);
  const brief = String(formData.get("brief") ?? "").trim().slice(0, 4000);
  if (!name) return { status: "error", code: "invalid", field: "name" };
  if (!purpose) return { status: "error", code: "invalid", field: "purpose" };
  if (!brief) return { status: "error", code: "invalid", field: "brief" };

  const shapeRaw = String(formData.get("shape") ?? "note");
  const shape = (OS_SHAPES as readonly string[]).includes(shapeRaw) ? shapeRaw : "note";
  const destination = String(formData.get("destination") ?? "").trim().slice(0, 200) || null;
  const maxSources = Math.min(5, Math.max(1, Number(formData.get("maxSources")) || 5));
  const windowDays = Math.min(90, Math.max(1, Number(formData.get("windowDays")) || 7));
  const standingSources = parseStandingSources(String(formData.get("standingSources") ?? ""));
  const active = formData.get("active") === "on";

  /* Putting the workflow in a company is what makes the worker pick it up.
   * Whether this person actually belongs to that company is checked by the
   * database, not here: a form is not a thing to be trusted about
   * membership. */
  const companyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId = /^[0-9a-f-]{36}$/.test(companyIdRaw) ? companyIdRaw : null;

  const cadenceRaw = String(formData.get("cadence") ?? "manual");
  const cadence = (OS_CADENCES as readonly string[]).includes(cadenceRaw) ? cadenceRaw : "manual";

  const requiredActionRaw = String(formData.get("requiredAction") ?? "").trim().toLowerCase().slice(0, 60);
  const requiredAction = requiredActionRaw || null;

  const fields = {
    name,
    purpose,
    brief,
    shape,
    destination,
    max_sources: maxSources,
    window_days: windowDays,
    standing_sources: standingSources,
    active,
    company_id: companyId,
    /* A schedule with nowhere to file the result would draft into a queue
     * nobody reads, which is the failure this whole property replaced. */
    cadence: companyId ? cadence : "manual",
    required_action: requiredAction,
    /* Changing the schedule clears a pause: the person has just looked at
     * the thing and decided it should run again. */
    paused_reason: null,
  };

  const id = String(formData.get("workflowId") ?? "");
  if (id) {
    if (!/^[0-9a-f-]{36}$/.test(id)) return { status: "error", code: "invalid", field: "workflowId" };
    // Scoped to the caller twice over: the filter below, and the policy that
    // only matches rows they own.
    const { error } = await supabase
      .from("os_workflows")
      .update(fields)
      .eq("id", id)
      .eq("owner_user_id", claims.sub);
    if (error) {
      return error.message.includes("not your company")
        ? { status: "error", code: "not_authorized" }
        : { status: "error", code: "save_failed" };
    }
  } else {
    const { randomBytes } = await import("node:crypto");
    const { error } = await supabase.from("os_workflows").insert({
      ...fields,
      key: workflowKeyFromName(name, randomBytes(4).toString("hex")),
      owner_user_id: claims.sub,
    });
    // The trigger raises when a sixth is attempted; say so in those words
    // rather than reporting a generic failure.
    if (error) {
      if (error.message.includes("workflow limit reached")) return { status: "error", code: "too_many" };
      if (error.message.includes("not your company")) return { status: "error", code: "not_authorized" };
      return { status: "error", code: "save_failed" };
    }
  }

  revalidatePath("/portal");
  revalidatePath("/portal/workflows");
  return { status: "saved" };
}

export async function deleteMemberWorkflowAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const access = await getOsBetaAccess();
  if (!access.allowed) return;
  const id = String(formData.get("workflowId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  await access.supabase
    .from("os_workflows")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", access.claims.sub);

  revalidatePath("/portal");
  revalidatePath("/portal/workflows");
}


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
  // The month's ceiling for this workflow. Zero is allowed and meaningful:
  // it pauses the workflow without deactivating or deleting it.
  const rawBudget = Number(formData.get("monthlyBudgetUsd"));
  const monthlyBudgetUsd = Number.isFinite(rawBudget)
    ? Math.min(10_000, Math.max(0, Math.round(rawBudget * 100) / 100))
    : OS_DEFAULT_MONTHLY_BUDGET_USD;
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
      monthly_budget_usd: monthlyBudgetUsd,
      standing_sources: standingSources,
      active,
    },
    { onConflict: "key" },
  );
  if (error) return { status: "error", code: "save_failed" };

  revalidatePath("/internal/os");
  revalidatePath("/portal");
  return { status: "saved" };
}
