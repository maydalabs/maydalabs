import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isOsConfigured } from "@/lib/osDraft";
import { runDueWorkflows } from "@/lib/osWorker";

/* The clock that makes MaydaOS work while you are gone.
 *
 * Called by Vercel Cron, which sends the project's CRON_SECRET as a bearer
 * token. Without that secret configured the endpoint refuses everything: an
 * open URL that spends money on model calls is not an endpoint, it is a bill
 * waiting to be run up by whoever finds it.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const offered = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Compared byte-for-byte in constant time. Lengths are compared first
  // because timingSafeEqual throws on a mismatch, and the length of a secret
  // is not the part worth protecting.
  const a = Buffer.from(offered);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function tick(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "not authorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !isOsConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const admin = createSupabaseAdminClient();
  const report = await runDueWorkflows(admin);

  return NextResponse.json(report, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  return tick(request);
}

/* Vercel Cron issues GET. The work is not idempotent, but the claim is:
 * a workflow's next_run_at moves forward in the same statement that hands it
 * out, so a repeated call finds nothing due rather than drafting twice. */
export async function GET(request: Request) {
  return tick(request);
}
