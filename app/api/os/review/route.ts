import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { decideReview, loadReviewSnapshot, hasReviewAccess } from "@/lib/osReviewStore";
import { parseReviewProposal } from "@/lib/osReviewBoundary";
import { ConfirmedReviewRejection } from "@/lib/osReviewGuard";

export const dynamic = "force-dynamic";
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "cache-control": "no-store" } });
export async function GET(request?: Request) {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return json({ error: "not_signed_in" }, 401);
  try {
    const db = await createSupabaseServerClient();
    const company = await currentCompany(db);
    if (!company) return json({ error: "no_company" }, 403);
    if (!await hasReviewAccess(db, claims.sub)) return json({ error: "review_access_denied" }, 403);
    const requestId = request ? new URL(request.url).searchParams.get("requestId") ?? undefined : undefined;
    if (requestId && !uuid.test(requestId)) return json({ error: "invalid_request" }, 400);
    return json(await loadReviewSnapshot(db, company.id, claims.sub, requestId));
  } catch { return json({ error: "review_read_unavailable" }, 503); }
}

export async function POST(request: Request) {
  // Cookie-authenticated mutation. Reject cross-origin form/fetch requests.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return json({ error: "not_signed_in" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    Object.keys(body).some((key) => !["proposalId", "revision", "fingerprint", "action", "payload", "knowledgeApproved"].includes(key)) ||
    typeof body.proposalId !== "string" || !uuid.test(body.proposalId) ||
    !Number.isSafeInteger(body.revision) || body.revision < 1 ||
    typeof body.fingerprint !== "string" || !/^[\da-f]{64}$/i.test(body.fingerprint) ||
    !["revise", "dismiss", "save_to_work", "add_to_company_knowledge"].includes(body.action)) return json({ error: "invalid_review" }, 400);
  const payload = body.action === "revise" ? parseReviewProposal(body.payload) : undefined;
  if ((body.action === "revise" && !payload) || (body.action !== "revise" && body.payload !== undefined)) return json({ error: "invalid_review" }, 400);
  if (body.action === "add_to_company_knowledge" ? body.knowledgeApproved !== true : body.knowledgeApproved !== undefined) return json({ error: "review_rejected", reason: "knowledge_approval" }, 422);
  try {
    const db = await createSupabaseServerClient();
    const company = await currentCompany(db);
    if (!company) return json({ error: "no_company" }, 403);
    if (!await hasReviewAccess(db, claims.sub)) return json({ error: "review_access_denied" }, 403);
    const proposal = await decideReview(createSupabaseAdminClient(), { companyId: company.id, actorId: claims.sub }, {
      proposalId: body.proposalId, revision: body.revision, fingerprint: body.fingerprint,
      action: body.action, ...(body.knowledgeApproved === true ? { knowledgeApproved: true } : {}), ...(payload ? { payload } : {}),
    });
    return json({ proposal });
  } catch (error) {
    if (error instanceof ConfirmedReviewRejection) return json({ error: "review_rejected", reason: error.reason }, 422);
    // A network error may follow a committed transaction. Never say "not saved".
    return json({ error: "save_unconfirmed", message: "Refresh the saved record before trying again." }, 409);
  }
}
