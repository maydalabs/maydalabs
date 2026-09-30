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
 *
 * Who pays is the company's own decision, the same one the co-founder
 * honours: a company that stored its own key is drafted for by the model it
 * chose, at the rates it recorded; a company without one is paused and told
 * why. The platform holds no key of its own in production.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { draftFromSources, type DraftClient } from "@/lib/osDraft";
import { pickDraft, type PickedDraft } from "@/lib/osDraftModel";
import { gatherSources } from "@/lib/osGather";
import { openKey } from "@/lib/osKeyVault";
import { costUsdAt, readSealedModelSettings } from "@/lib/osModelSettings";
import {
  asStandingSources,
  monthStart,
  workflowBudget,
  runCostUsd,
  OS_MODEL,
  OS_EFFORT,
  OS_DEFAULT_MONTHLY_BUDGET_USD,
  type OsPauseReason,
} from "@/lib/os";
import type { Database } from "@/lib/supabase/database.types";

type Admin = SupabaseClient<Database>;
/* Whatever the environment holds; process.env is one of these. */
type Env = Record<string, string | undefined>;

/* Worst case this many dollars a day, matching the manual path: per company
 * when the company pays, across everything when the platform does. A
 * schedule is exactly the thing that turns a small per-run cost into a large
 * monthly one, so the ceiling matters more here. */
const configuredCap = Number(process.env.MAYDAOS_DAILY_USD_CAP);
const DAILY_USD_CAP = Number.isFinite(configuredCap) && configuredCap >= 0 ? configuredCap : 2;

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
  /* What the vault and the pick read; process.env unless a test says otherwise. */
  env?: Env;
  pick?: typeof pickDraft;
};

export type WorkerReport = {
  claimed: number;
  drafted: number;
  outcomes: WorkerOutcome[];
};

/* Who pays for one company's drafting, decided once per company per tick. */
type Payer =
  | { kind: "picked"; picked: PickedDraft }
  | { kind: "none" }
  | { kind: "locked"; label: string }
  | { kind: "invalid"; label: string }
  | { kind: "unavailable" };

async function payerFor(admin: Admin, companyId: string, env: Env, pick: typeof pickDraft, injected: DraftClient | undefined): Promise<Payer> {
  let sealed: Awaited<ReturnType<typeof readSealedModelSettings>>;
  try {
    sealed = await readSealedModelSettings(admin, companyId);
  } catch {
    return { kind: "unavailable" };
  }
  if (sealed) {
    const apiKey = openKey(sealed.keyCiphertext, env);
    if (!apiKey) return { kind: "locked", label: `${sealed.provider}:${sealed.model}` };
    try {
      const picked = pick(env, { provider: sealed.provider, model: sealed.model, baseUrl: sealed.baseUrl, apiKey, price: sealed.price });
      return picked ? { kind: "picked", picked } : { kind: "none" };
    } catch {
      return { kind: "invalid", label: `${sealed.provider}:${sealed.model}` };
    }
  }
  /* A client handed in by a test stands for the platform's model and is
   * priced as it: what a test asserts is the worker, not the machine it
   * happens to run on. */
  if (injected) return { kind: "picked", picked: { client: injected, model: OS_MODEL, effort: OS_EFFORT, priced: true, label: OS_MODEL } };
  const picked = pick(env, null);
  return picked ? { kind: "picked", picked } : { kind: "none" };
}

/* A workflow that keeps failing for a reason another run will not fix —
 * nobody has given it readable sources, say, or a key — should stop asking.
 * Pausing writes the reason down as a code, so the person sees why it went
 * quiet in their own language instead of discovering silence. */
async function pause(admin: Admin, workflowId: string, reason: OsPauseReason) {
  await admin
    .from("os_workflows")
    .update({ paused_reason: reason })
    .eq("id", workflowId);
}

/* A company that stored a key after its schedule was paused for want of one
 * gets it back at the next tick, whatever happened to the save's own resume:
 * the pause and the key are decided at different moments, and this is the
 * moment that settles them. Only that pause, only companies with a key. */
async function resumeKeyed(admin: Admin) {
  const { data, error } = await admin.from("os_model_settings").select("company_id");
  if (error || !data?.length) return;
  await admin
    .from("os_workflows")
    .update({ paused_reason: null })
    .eq("paused_reason", "no_key")
    .in("company_id", data.map((row) => row.company_id));
}

async function spentSince(admin: Admin, since: Date, scope: { workflowId?: string; companyId?: string } = {}): Promise<number | null> {
  let query = admin.from("os_runs").select("cost_usd").gte("created_at", since.toISOString());
  if (scope.workflowId) query = query.eq("workflow_id", scope.workflowId);
  if (scope.companyId) query = query.eq("company_id", scope.companyId);
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
  const env = deps.env ?? process.env;
  const pick = deps.pick ?? pickDraft;
  await resumeKeyed(admin);
  const { data: claimed, error } = await admin.rpc("os_claim_due_workflows", { p_limit: limit });
  if (error || !claimed) return { claimed: 0, drafted: 0, outcomes: [] };

  const outcomes: WorkerOutcome[] = [];
  const payers = new Map<string, Payer>();
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

    /* Whose key, before anything is counted or read. The sealed key is
     * opened once per company per tick and lives only in memory. */
    let payer = payers.get(companyId);
    if (!payer) {
      payer = await payerFor(admin, companyId, env, pick, deps.draft);
      payers.set(companyId, payer);
    }
    if (payer.kind === "unavailable") {
      outcomes.push({ workflow: label, result: "failed", reason: "model settings could not be read" });
      continue;
    }
    if (payer.kind === "locked") {
      // A key that cannot be opened is an operator's problem, recorded where
      // the person will see the run "could not finish" rather than nothing.
      await admin.from("os_runs").insert({
        user_id: null,
        company_id: companyId,
        workflow_id: workflow.id,
        shape: workflow.shape,
        topic: workflow.name,
        sources: [],
        status: "failed",
        model: payer.label,
        effort: null,
        error: "The company key could not be opened: the vault secret is missing or changed.",
      });
      outcomes.push({ workflow: label, result: "failed", reason: "key unavailable" });
      continue;
    }
    if (payer.kind === "invalid") {
      await admin.from("os_runs").insert({
        user_id: null,
        company_id: companyId,
        workflow_id: workflow.id,
        shape: workflow.shape,
        topic: workflow.name,
        sources: [],
        status: "failed",
        model: payer.label,
        effort: null,
        error: "The company's model setting could not be used. Check it in Company, Choose your AI.",
      });
      outcomes.push({ workflow: label, result: "failed", reason: "model setting unusable" });
      continue;
    }
    if (payer.kind === "none") {
      /* One more look before pausing: the owner may have saved a key while
       * this tick was running, and a pause that outlives its reason is the
       * silence this code exists to end. */
      let arrived = false;
      try {
        arrived = (await readSealedModelSettings(admin, companyId)) !== null;
      } catch {
        arrived = false;
      }
      if (arrived) {
        payers.delete(companyId);
        outcomes.push({ workflow: label, result: "skipped", reason: "key arrived" });
        continue;
      }
      await pause(admin, workflow.id, "no_key");
      outcomes.push({ workflow: label, result: "skipped", reason: "no key" });
      continue;
    }
    const { picked } = payer;
    const client = deps.draft ?? picked.client;

    // The daily ceiling is read fresh inside the loop: five workflows in one
    // tick could otherwise blow through it together, each having checked a
    // total that did not yet include the others. On a company's key the
    // ceiling is the company's; on the platform's it is everyone's.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const spentToday = await spentSince(admin, today, picked.price ? { companyId } : {});
    if (spentToday === null) {
      outcomes.push({ workflow: label, result: "failed", reason: "spend could not be read" });
      continue;
    }
    if (spentToday >= DAILY_USD_CAP) {
      outcomes.push({ workflow: label, result: "skipped", reason: "daily cap" });
      continue;
    }

    const spentThisMonth = await spentSince(admin, monthStart(), { workflowId: workflow.id });
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
      await pause(admin, workflow.id, "no_sources");
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
        model: picked.label,
        effort: picked.effort,
        error: reason.slice(0, 500),
      });
      outcomes.push({ workflow: label, result: "failed", reason });
      continue;
    }

    const draft = await draftFromSources(workflow.name, workflow.brief, sources, client, { model: picked.model, effort: picked.effort });
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
        model: picked.label,
        effort: picked.effort,
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
        // The column takes 8000; the run below keeps the whole draft.
        notes: draft.draft.slice(0, 8_000),
        sources: sourceRecord,
        // `by` is what the document reads to say "prepared while you were away";
        // without it the worker's items arrived unattributed.
        metadata: { by: "worker", claims: draft.claims, workflow_key: workflow.key },
      })
      .select("id")
      .single();

    if (itemError || !item) {
      outcomes.push({ workflow: label, result: "failed", reason: itemError?.message ?? "item could not be filed" });
      continue;
    }

    /* Priced the way the co-founder's turns are: at the company's recorded
     * rates on its own key, at the platform's on the platform's, and at
     * nothing on a local model. */
    const costUsd = picked.priced
      ? picked.price
        ? costUsdAt(picked.price, draft.inputTokens, draft.outputTokens)
        : runCostUsd(draft.inputTokens, draft.outputTokens)
      : 0;
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
      model: picked.label,
      effort: picked.effort,
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
