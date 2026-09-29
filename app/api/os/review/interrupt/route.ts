import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { hasReviewAccess, interruptReviewTurn } from "@/lib/osReviewStore";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return json({ error: "not_signed_in" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || Object.keys(body).length !== 1 || typeof body.turnId !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(body.turnId)) return json({ error: "invalid_request" }, 400);
  try {
    const db = await createSupabaseServerClient();
    const company = await currentCompany(db);
    if (!company || !await hasReviewAccess(db, claims.sub)) return json({ error: "review_access_denied" }, 403);
    return json({ turn: await interruptReviewTurn(createSupabaseAdminClient(), { actorId: claims.sub, companyId: company.id }, body.turnId) });
  } catch {
    return json({ error: "interrupt_unconfirmed", message: "An answer must have been waiting at least three minutes. Check stored progress before trying again." }, 409);
  }
}
