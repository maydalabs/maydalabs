/* Property three: it works while you are gone.
 *
 * Everything here already existed in pieces. The workflow could gather
 * sources and draft from them; the spine could hold work and refuse to
 * approve it without a person. What was missing was a reason to start and a
 * place to put the result. This is both, and nothing more: it prepares, it
 * files what it prepared where a person will see it, and it stops.
 *
 * The one rule it must never break is the product's whole promise — it may
 * prepare anything and decide nothing. Every item it creates is born in
 * `review`, carrying the action it is waiting for. The database refuses to
 * let it be born approved (migration 20260916180000), so this is guaranteed
 * rather than merely intended.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { draftFromSources, type DraftClient } from "@/lib/osDraft";
import { gatherSources } from "@/lib/osGather";
import {
  asStandingSources,
  monthStart,
  workflowBudget,
  runCostUsd,
  OS_MODEL,
  OS_EFFORT,
  OS_DEFAULT_MONTHLY_BUDGET_USD,
} from "@/lib/os";
import type { Database } from "@/lib/supabase/database.types";

type Admin = SupabaseClient<Database>;

/* Worst case this many dollars a day across every workflow, matching the
 * manual path. A schedule is exactly the thing that turns a small per-run
 * cost into a large monthly one, so the ceiling matters more here. */
const DAILY_USD_CAP = Number(process.env.MAYDAOS_DAILY_USD_CAP ?? "2");

/* How many workflows one tick will take. The claim is atomic, so this is a
 * throughput choice rather than a correctness one: a tick that tries to do
 * everything at once is a tick that times out halfway. */
const PER_TICK = 5;

export type WorkerOutcome =
  | { workflow: string; result: "drafted"; itemId: string; costUsd: number }
  | { workflow: string; result: "skipped"; reason: string }
  | { workflow: string; result: "failed"; reason: string };

/* The same seam lib/osDraft.ts already established, carried one level up.
 * A worker that can only be exercised by spending money on a model call and
 * fetching the live internet is a worker whose behaviour is asserted in
 * comments rather than in tests. */
export type WorkerDeps = {
  gather?: typeof gatherSources;
  draft?: DraftClient;
};

export type WorkerReport = {
  claimed: number;
  drafted: number;
  outcomes: WorkerOutcome[];
};

/* A workflow that keeps failing for a reason another run will not fix —
 * nobody has given it readable sources, say — should stop asking. Pausing
 * writes the reason down, so the person sees why it went quiet instead of
 * discovering silence. */
async function pause(admin: Admin, workflowId: string, reason: string) {
  await admin
    .from("os_workflows")
    .update({ paused_reason: reason.slice(0, 300) })
    .eq("id", workflowId);
}

async function spentSince(admin: Admin, since: Date, workflowId?: string): Promise<number | null> {
  let query = admin.from("os_runs").select("cost_usd").gte("created_at", since.toISOString());
  if (workflowId) query = query.eq("workflow_id", workflowId);
  const { data, error } = await query;
  if (error || !data) return null;
  return data.reduce((total, row) => total + Number(row.cost_usd ?? 0), 0);
}

export async function runDueWorkflows(
  admin: Admin,
  limit: number = PER_TICK,
  deps: WorkerDeps = {},
): Promise<WorkerReport> {
  const gather = deps.gather ?? gatherSources;
  const { data: claimed, error } = await admin.rpc("os_claim_due_workflows", { p_limit: limit });
  if (error || !claimed) return { claimed: 0, drafted: 0, outcomes: [] };

  const outcomes: WorkerOutcome[] = [];
  let drafted = 0;

  for (const workflow of claimed) {
    const label = workflow.name ?? workflow.key ?? workflow.id;

    /* The claim already filters these out. Narrowing here rather than
     * asserting means a future change to that query fails as a skipped
     * workflow rather than as a row written against a null company. */
    const companyId = workflow.company_id;
    if (!companyId) {
      outcomes.push({ workflow: label, result: "skipped", reason: "no company" });
      continue;
    }

    // The daily ceiling is read fresh inside the loop: five workflows in one
    // tick could otherwise blow through it together, each having checked a
    // total that did not yet include the others.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const spentToday = await spentSince(admin, today);
    if (spentToday === null) {
      outcomes.push({ workflow: label, result: "failed", reason: "spend could not be read" });
      continue;
    }
    if (spentToday >= DAILY_USD_CAP) {
      outcomes.push({ workflow: label, result: "skipped", reason: "daily cap" });
      continue;
    }

    const spentThisMonth = await spentSince(admin, monthStart(), workflow.id);
    if (spentThisMonth === null) {
      outcomes.push({ workflow: label, result: "failed", reason: "spend could not be read" });
      continue;
    }
    const budget = workflowBudget(
      spentThisMonth,
      Number(workflow.monthly_budget_usd ?? OS_DEFAULT_MONTHLY_BUDGET_USD),
    );
    if (budget.exhausted) {
      outcomes.push({ workflow: label, result: "skipped", reason: "monthly budget spent" });
      continue;
    }

    const standing = asStandingSources(workflow.standing_sources);
    if (standing.length === 0) {
      await pause(admin, workflow.id, "No standing sources, so there is nothing to read on a schedule.");
      outcomes.push({ workflow: label, result: "skipped", reason: "no standing sources" });
      continue;
    }

    const { sources, failures } = await gather(standing, [], {
      maxSources: workflow.max_sources,
      windowDays: workflow.window_days ?? 7,
    });

    if (sources.length === 0) {
      const reason = failures[0] ? `${failures[0].url}: ${failures[0].reason}` : "nothing could be read";
      await admin.from("os_runs").insert({
        user_id: null,
        company_id: companyId,
        workflow_id: workflow.id,
        shape: workflow.shape,
        topic: workflow.name,
        sources: [],
        status: "failed",
        model: OS_MODEL,
        effort: OS_EFFORT,
        error: reason.slice(0, 500),
      });
      outcomes.push({ workflow: label, result: "failed", reason });
      continue;
    }

    const draft = await draftFromSources(workflow.name, workflow.brief, sources, deps.draft);
    const sourceRecord = sources.map((source) => ({
      url: source.url,
      title: source.title,
      chars: source.chars,
    }));

    if ("error" in draft) {
      // Nothing was produced, so nothing is charged.
      await admin.from("os_runs").insert({
        user_id: null,
        company_id: companyId,
        workflow_id: workflow.id,
        shape: workflow.shape,
        topic: workflow.name,
        sources: sourceRecord,
        status: "failed",
        model: OS_MODEL,
        effort: OS_EFFORT,
        error: draft.error.slice(0, 500),
      });
      outcomes.push({ workflow: label, result: "failed", reason: draft.error });
      continue;
    }

    /* The item comes first. A draft that exists but sits in no queue is the
     * failure this whole property exists to end, so if only one of these two
     * writes can succeed it should be the one a person will see. */
    const { data: item, error: itemError } = await admin
      .from("os_work_items")
      .insert({
        company_id: companyId,
        lane: "content",
        kind: workflow.shape,
        title: workflow.name,
        status: "review",
        required_action: workflow.required_action,
        notes: draft.draft.slice(0, 20_000),
        sources: sourceRecord,
        metadata: { claims: draft.claims, workflow_key: workflow.key },
      })
      .select("id")
      .single();

    if (itemError || !item) {
      outcomes.push({ workflow: label, result: "failed", reason: itemError?.message ?? "item could not be filed" });
      continue;
    }

    const costUsd = runCostUsd(draft.inputTokens, draft.outputTokens);
    await admin.from("os_runs").insert({
      user_id: null,
      company_id: companyId,
      workflow_id: workflow.id,
      item_id: item.id,
      shape: workflow.shape,
      topic: workflow.name,
      sources: sourceRecord,
      status: "drafted",
      draft: draft.draft.slice(0, 20_000),
      claims: draft.claims,
      model: OS_MODEL,
      effort: OS_EFFORT,
      input_tokens: draft.inputTokens,
      output_tokens: draft.outputTokens,
      cost_usd: costUsd,
    });

    /* The history says a machine did this, and says so in the same words a
     * person's own actions are recorded in. Who did what is the point of
     * keeping a record at all. */
    await admin.from("os_work_item_events").insert({
      item_id: item.id,
      actor: null,
      event: "prepared",
      detail: { by: "worker", workflow: workflow.key, sources: sourceRecord.length },
    });

    drafted += 1;
    outcomes.push({ workflow: label, result: "drafted", itemId: item.id, costUsd });
  }

  return { claimed: claimed.length, drafted, outcomes };
}
