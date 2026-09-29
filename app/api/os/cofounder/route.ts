import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { buildCompanyContext, openOnThePerson, reviewedSystemFor } from "@/lib/osCofounder";
import { runReviewedTurn, ReviewedTurnError } from "@/lib/osReviewedTurn";
import { beginReviewTurn, finishReviewTurn, proposeReview, hasReviewAccess } from "@/lib/osReviewStore";
import { pickTurn } from "@/lib/osCofounderModel";
import { currentCompany } from "@/lib/osCompany";
import { isReviewRequestMode, parseReviewRequestIntent, reviewIntentGuard, reviewSourceForIntent } from "@/lib/osReviewIntent";
import { rejectUnavailableCurrentMessageCitation } from "@/lib/osReviewCitation";
import { rejectExistingOpenWork } from "@/lib/osReviewDuplicate";
import { ConfirmedReviewRejection } from "@/lib/osReviewGuard";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return json({ error: "not_configured" }, 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return json({ error: "not_signed_in" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim() || body.message.length > 8000 ||
    !isReviewRequestMode(body.mode) ||
    typeof body.requestId !== "string" || !uuid.test(body.requestId) ||
    typeof body.expectedActorId !== "string" || !uuid.test(body.expectedActorId) ||
    typeof body.expectedCompanyId !== "string" || !uuid.test(body.expectedCompanyId) ||
    Object.keys(body).some((key) => !["message", "mode", "intent", "requestId", "expectedActorId", "expectedCompanyId"].includes(key))) return json({ error: "invalid_message" }, 400);
  const intent = parseReviewRequestIntent(body.intent, body.mode);
  if (!intent) return json({ error: "invalid_intent" }, 400);
  // These are stale-tab preconditions, never identity or authorisation inputs.
  // A changed cookie/company in another tab must not move this question into a
  // different conversation before the old tab receives a fresh server render.
  if (body.expectedActorId !== claims.sub) return json({ error: "identity_changed" }, 409);
  const said = body.message.trim();
  const supabase = await createSupabaseServerClient();
  const company = await currentCompany(supabase);
  if (!company) return json({ error: "no_company" }, 409);
  if (body.expectedCompanyId !== company.id) return json({ error: "identity_changed" }, 409);
  if (!await hasReviewAccess(supabase, company.id, claims.sub)) return json({ error: "review_access_denied" }, 403);
  const picked = pickTurn();
  if (!picked) return json({ error: "not_configured" }, 503);
  const { data: spent, error: budgetError } = await supabase.rpc("os_chat_spent_this_month", { p_company_id: company.id });
  if (budgetError || spent === null) return json({ error: "budget_unavailable" }, 500);
  if (picked.priced && Number(spent) >= Number(company.monthly_chat_usd ?? 0)) return json({ error: "budget" }, 402);
  let context: string;
  try { context = await buildCompanyContext(supabase, company.id); }
  catch { return json({ error: "context_unavailable" }, 500); }

  const admin = createSupabaseAdminClient();
  const who = { companyId: company.id, actorId: claims.sub };
  let begun;
  try { begun = await beginReviewTurn(admin, who, body.requestId, said, body.mode, intent); }
  catch { return json({ error: "turn_unconfirmed" }, 409); }
  // Replays read the existing receipt; they never start a second generation.
  if (!begun.created) return json({ type: "existing", turn: begun.turn }, 200);
  const stored = begun.turn;
  if (!Array.isArray(stored.history) || !stored.intent) {
    await finishReviewTurn(admin, who, stored.id, "The conversation could not be read. No answer was generated.", "failed").catch(() => {});
    return json({ error: "history_unavailable" }, 500);
  }
  const abort = new AbortController();
  const cancel = () => abort.abort();
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) abort.abort();
  let disconnected = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      let completed = false;
      const emit = (event: unknown) => {
        if (disconnected) return;
        try { controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`)); }
        catch { disconnected = true; abort.abort(); }
      };
      try {
        emit({ type: "started", turnId: stored.id });
        for await (const event of runReviewedTurn({
          mode: stored.mode,
          intent: stored.intent!,
          source: { id: stored.person_message_id, text: stored.question },
          system: reviewedSystemFor(context, stored.mode, stored.intent),
          history: [...openOnThePerson(stored.history)
            .map((m) => ({ role: m.role, body: m.body })), { role: "person", body: stored.question }],
          turn: picked.turn, priced: picked.priced, signal: abort.signal,
          propose: async (payload) => {
            const intentReason = reviewIntentGuard(payload, stored.intent);
            if (intentReason) return { rejected: intentReason };
            const refusal = rejectUnavailableCurrentMessageCitation(payload, reviewSourceForIntent(payload.type, { id: stored.person_message_id, text: stored.question }, stored.intent!));
            if (refusal) return refusal;
            const duplicate = await rejectExistingOpenWork(supabase, who.companyId, payload);
            if (duplicate) return duplicate;
            try { return await proposeReview(admin, who, stored.id, payload); }
            catch (error) {
              if (error instanceof ConfirmedReviewRejection) return { rejected: error.reason };
              throw error;
            }
          },
        })) {
          if (event.type === "text") reply += event.text;
          if (event.type === "done") {
            const persisted = await finishReviewTurn(admin, who, stored.id, event.text, "completed", event);
            completed = true;
            emit({ type: "done", turn: persisted, costUsd: event.costUsd });
          } else emit(event);
        }
        if (!completed) throw new Error("incomplete_turn");
      } catch (error) {
        // Hard termination can leave "running": recovery displays that honestly,
        // never automatically restarting a generation with a new request ID.
        if (!completed) await finishReviewTurn(admin, who, stored.id,
          `${(error instanceof ReviewedTurnError ? error.text : reply).slice(0, 39000)}\n\n[Interrupted: this answer is incomplete. Review stored suggestions separately.]`, "failed",
          error instanceof ReviewedTurnError ? error : undefined).catch(() => {});
        emit({ type: "error", message: "The answer or review proposal could not be confirmed. Refresh to check the stored record; nothing was retried." });
      } finally {
        request.signal.removeEventListener("abort", cancel);
        if (!disconnected) controller.close();
      }
    },
    cancel() { disconnected = true; abort.abort(); },
  });
  return new Response(stream, { headers: {
    "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no",
  } });
}
