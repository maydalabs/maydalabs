import { after, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { currentCompany, type CurrentCompany } from "@/lib/osCompany";
import type { Db } from "@/lib/osCofounder";
import { personaFromCompany } from "@/lib/osPersona";
import { REVIEW_WORK_KINDS, type ReviewWorkKind } from "@/lib/osReviewGuard";
import { hasReviewAccess } from "@/lib/osReviewStore";
import { AgentRunRefusal, RUN_LIMITS } from "@/lib/osAgentRunTypes";
import { cancelAgentRun, leaseToRecover, listAgentRuns, resumeAgentRun, startAgentRun } from "@/lib/osAgentRunStore";
import { dailyCapUsd, resolveRunModel, runCapUsd, runQuote } from "@/lib/osAgentRunPayer";
import { driveAgentRun, runTimingFor } from "@/lib/osAgentRunDriver";
import { runStartMinimumUsd } from "@/lib/osAgentRun";
import { agentRunSystemFor } from "@/lib/osAgentRunPrompt";

/* Agent runs: start, continue, answer, skip, stop, and read.
 *
 * The same checks as the co-founder route, in the same order: same origin,
 * JSON, verified claims, exact keys, the stale-tab fences, the selected
 * company, membership. The short work happens here; the slice itself runs in
 * after(), so the response returns at once and a closed tab changes nothing.
 * Only the run's own actor can start, continue, answer or stop it (SQL binds
 * the actor under a lock); GET never schedules anything, and nothing here
 * ever restarts a run by itself.
 *
 * A start or resume whose response is lost may still have committed, with a
 * lease and no driver: the run would read as working until the lease ran
 * out. So the route reads what SQL holds, and when the run is running on a
 * live lease at exactly the seq this call would have left, it schedules the
 * driver on that lease and answers as the call would have. Every write the
 * driver makes is fenced on the lease and sequenced, so this never puts two
 * drivers to work: the first write either makes fences the other.
 *
 * maxDuration is a literal because Next reads it from the source:
 * tests/osAgentRunMigration.test.ts pins it to RUN_FUNCTION_SECONDS.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const KEYS = {
  start: ["action", "runId", "instruction", "draftFormat", "expectedActorId", "expectedCompanyId"],
  continue: ["action", "runId", "expectedSeq", "expectedActorId", "expectedCompanyId"],
  skip: ["action", "runId", "expectedSeq", "expectedActorId", "expectedCompanyId"],
  answer: ["action", "runId", "expectedSeq", "answer", "expectedActorId", "expectedCompanyId"],
  cancel: ["action", "runId", "expectedActorId", "expectedCompanyId"],
} as const;
type Action = keyof typeof KEYS;

type Body =
  | { action: "start"; runId: string; instruction: string; draftFormat: ReviewWorkKind; expectedActorId: string; expectedCompanyId: string }
  | { action: "continue" | "skip"; runId: string; expectedSeq: number; expectedActorId: string; expectedCompanyId: string }
  | { action: "answer"; runId: string; expectedSeq: number; answer: string; expectedActorId: string; expectedCompanyId: string }
  | { action: "cancel"; runId: string; expectedActorId: string; expectedCompanyId: string };

function parseBody(value: unknown): Body | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.action !== "string" || !Object.hasOwn(KEYS, body.action)) return null;
  const keys: readonly string[] = KEYS[body.action as Action];
  if (Object.keys(body).length !== keys.length || !keys.every((key) => Object.hasOwn(body, key))) return null;
  if (typeof body.runId !== "string" || !uuid.test(body.runId) ||
    typeof body.expectedActorId !== "string" || !uuid.test(body.expectedActorId) ||
    typeof body.expectedCompanyId !== "string" || !uuid.test(body.expectedCompanyId)) return null;
  if (body.action === "start") {
    if (typeof body.instruction !== "string" || !body.instruction.trim() || body.instruction.trim().length > RUN_LIMITS.instruction ||
      !REVIEW_WORK_KINDS.some((kind) => kind === body.draftFormat)) return null;
  }
  if (body.action === "continue" || body.action === "skip" || body.action === "answer") {
    if (typeof body.expectedSeq !== "number" || !Number.isSafeInteger(body.expectedSeq) || body.expectedSeq < 0) return null;
  }
  if (body.action === "answer" && (typeof body.answer !== "string" || !body.answer.trim() || body.answer.trim().length > RUN_LIMITS.answer)) return null;
  return body as Body;
}

/* How it sounds, read at slice time and stored on no run. A failed read of
 * the person's own row is a plain "you", not a refusal. */
async function personaFor(db: Db, company: CurrentCompany, actorId: string) {
  let addressAs: string | null = null;
  try {
    const { data } = await db.from("os_company_members").select("address_as").eq("company_id", company.id).eq("user_id", actorId).maybeSingle();
    addressAs = data?.address_as ?? null;
  } catch { addressAs = null; }
  return personaFromCompany(company, addressAs);
}

/* The lease a lost start or resume left behind, and the run as a member may
 * see it; null when the call cannot be shown to have committed. */
async function recovered(supabase: Db, who: { companyId: string; actorId: string }, runId: string, expectedSeq: number) {
  try {
    const lease = await leaseToRecover(createSupabaseAdminClient(), who, runId, expectedSeq, Date.now());
    if (!lease) return null;
    const [run] = await listAgentRuns(supabase, who.companyId, who.actorId, Date.now(), { id: runId });
    return run && run.seq === expectedSeq ? { lease, run } : null;
  } catch { return null; }
}

function refusalResponse(error: unknown) {
  if (error instanceof AgentRunRefusal) {
    switch (error.code) {
      case "active": return json({ error: "agent_run_active" }, 409);
      case "budget": return json({ error: "budget" }, 402);
      case "stale": return json({ error: "agent_run_stale" }, 409);
      case "not_resumable": return json({ error: "agent_run_not_resumable" }, 409);
      case "slice_limit": return json({ error: "agent_run_slice_limit" }, 409);
      case "request": return json({ error: "invalid_request" }, 400);
      case "unavailable": return json({ error: "run_unavailable" }, 403);
      case "refused": return json({ error: "run_refused" }, 409);
      default: break;
    }
  }
  // A lost response may follow a commit: never say it did not happen.
  return json({ error: "run_unconfirmed", message: "The run's state could not be confirmed. Refresh before trying again." }, 409);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (!isSupabaseConfigured()) return json({ error: "not_configured" }, 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return json({ error: "not_signed_in" }, 401);
  const body = parseBody(await request.json().catch(() => null));
  if (!body) return json({ error: "invalid_request" }, 400);
  // Stale-tab preconditions, never identity or authorisation inputs.
  if (body.expectedActorId !== claims.sub) return json({ error: "identity_changed" }, 409);
  const supabase = await createSupabaseServerClient();
  const company = await currentCompany(supabase);
  if (!company) return json({ error: "no_company" }, 409);
  if (body.expectedCompanyId !== company.id) return json({ error: "identity_changed" }, 409);
  if (!await hasReviewAccess(supabase, company.id, claims.sub)) return json({ error: "review_access_denied" }, 403);
  const who = { companyId: company.id, actorId: claims.sub };
  const timing = runTimingFor();

  if (body.action === "cancel") {
    try { return json({ run: await cancelAgentRun(createSupabaseAdminClient(), who, body.runId) }); }
    catch (error) { return refusalResponse(error); }
  }

  if (body.action === "start") {
    const model = await resolveRunModel(supabase, company.id);
    if (!model.ok) return json({ error: model.error }, model.status);
    const persona = await personaFor(supabase, company, claims.sub);
    const instruction = body.instruction.trim();
    /* What this run's first rounds would be held at, from the prompt the
     * driver will send and the price it will pay: SQL refuses a start whose
     * ceiling cannot cover it, before the instruction is posted. */
    const minUsd = runStartMinimumUsd({
      priced: model.picked.priced, price: model.picked.price, instruction,
      system: agentRunSystemFor({ company, draftFormat: body.draftFormat, persona, today: new Date(startedAt).toISOString().slice(0, 10) }),
    });
    let started;
    try {
      started = await startAgentRun(createSupabaseAdminClient(), who, {
        id: body.runId, instruction, draftFormat: body.draftFormat, payer: model.payer,
        modelLabel: model.picked.label, capUsd: runCapUsd(), dailyCapUsd: dailyCapUsd(), minUsd, leaseSeconds: timing.leaseSeconds,
      });
    } catch (error) {
      // A start leaves a fresh run at seq 0; nothing but its own driver moves it.
      const found = error instanceof AgentRunRefusal ? null : await recovered(supabase, who, body.runId, 0);
      if (!found) return refusalResponse(error);
      const lease = found.lease;
      after(() => driveAgentRun({ runId: body.runId, ...who, lease, startedAt, picked: model.picked, company, persona }));
      return json({ type: "started", run: found.run }, 202);
    }
    // A replay reads the existing run; it never schedules a second driver.
    if (!started.created || !started.lease) return json({ type: "existing", run: started.run }, 200);
    const lease = started.lease;
    after(() => driveAgentRun({ runId: body.runId, ...who, lease, startedAt, picked: model.picked, company, persona }));
    return json({ type: "started", run: started.run }, 202);
  }

  // Continue, answer, skip: the actor's own run, on the model it started with.
  let existing;
  try { [existing] = await listAgentRuns(supabase, company.id, claims.sub, startedAt, { id: body.runId }); }
  catch { return json({ error: "runs_unavailable" }, 503); }
  if (!existing || !existing.mine) return json({ error: "run_unavailable" }, 403);
  const model = await resolveRunModel(supabase, company.id);
  if (!model.ok) return json({ error: model.error }, model.status);
  if (model.picked.label !== existing.model_label || model.payer !== existing.payer) return json({ error: "model_changed" }, 409);
  const persona = await personaFor(supabase, company, claims.sub);
  let resumed;
  try {
    resumed = await resumeAgentRun(createSupabaseAdminClient(), who, {
      id: body.runId, seq: body.expectedSeq, action: body.action,
      answer: body.action === "answer" ? body.answer.trim() : null, leaseSeconds: timing.leaseSeconds,
    });
  } catch (error) {
    // A resume moves seq by exactly one.
    const found = error instanceof AgentRunRefusal ? null : await recovered(supabase, who, body.runId, body.expectedSeq + 1);
    if (!found) return refusalResponse(error);
    const lease = found.lease;
    after(() => driveAgentRun({ runId: body.runId, ...who, lease, startedAt, picked: model.picked, company, persona }));
    return json({ type: "resumed", run: found.run }, 202);
  }
  const lease = resumed.lease;
  after(() => driveAgentRun({ runId: body.runId, ...who, lease, startedAt, picked: model.picked, company, persona }));
  return json({ type: "resumed", run: resumed.run }, 202);
}

export async function GET(request: Request) {
  const serverNow = Date.now();
  if (!isSupabaseConfigured()) return json({ error: "not_configured" }, 503);
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return json({ error: "not_signed_in" }, 401);
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  if (id !== null && !uuid.test(id)) return json({ error: "invalid_request" }, 400);
  try {
    const supabase = await createSupabaseServerClient();
    const company = await currentCompany(supabase);
    if (!company) return json({ error: "no_company" }, 403);
    if (!await hasReviewAccess(supabase, company.id, claims.sub)) return json({ error: "review_access_denied" }, 403);
    if (params.get("quote") === "1") return json({ quote: await runQuote(supabase, company, process.env, await personaFor(supabase, company, claims.sub)), serverNow });
    if (id) {
      const [run] = await listAgentRuns(supabase, company.id, claims.sub, serverNow, { id });
      return run ? json({ run, serverNow }) : json({ error: "run_unavailable" }, 404);
    }
    return json({ runs: await listAgentRuns(supabase, company.id, claims.sub, serverNow), serverNow });
  } catch { return json({ error: "runs_unavailable" }, 503); }
}
