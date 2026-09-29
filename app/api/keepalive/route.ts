import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isCronAuthorized } from "@/lib/cronAuth";

/* A heartbeat, so the database is not put to sleep.
 *
 * Supabase pauses a free project after seven days without a request to its
 * API, and on 29 September it did exactly that: the public pages kept
 * rendering from Vercel while the pilot form behind them failed. This makes
 * one cheap read a day. It spends nothing and returns nothing, and it is not
 * the worker: CRON_SECRET is honoured once it exists, and until then only
 * Vercel's own cron caller is accepted, so a stranger cannot turn it into load.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const fromCron = request.headers.get("user-agent")?.startsWith("vercel-cron/") ?? false;
  if (secret ? !isCronAuthorized(request.headers.get("authorization"), secret) : !fromCron) {
    return NextResponse.json({ error: "not authorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  try {
    const { error } = await createSupabaseAdminClient().from("os_companies").select("id", { count: "exact", head: true });
    if (error) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
}
