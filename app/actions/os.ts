"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { draftFromSources } from "@/lib/osDraft";
import { fetchSource, isFailure, type FetchedSource } from "@/lib/osSources";
import {
  OS_MAX_SOURCES,
  OS_MODEL,
  OS_EFFORT,
  OS_SHAPES,
  OS_STARTING_CREDITS,
  OS_TOPIC_LIMIT,
  parseSourceUrls,
  runCostUsd,
  type OsShape,
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
    | "no_credits"
    | "daily_cap"
    | "invalid"
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

  const topic = String(formData.get("topic") ?? "").trim().slice(0, OS_TOPIC_LIMIT);
  if (!topic) return { status: "error", code: "invalid", message: "Give it a topic." };

  const shapeRaw = String(formData.get("shape") ?? "note");
  const shape: OsShape = (OS_SHAPES as readonly string[]).includes(shapeRaw) ? (shapeRaw as OsShape) : "note";

  const { urls, rejected } = parseSourceUrls(String(formData.get("sources") ?? ""));
  if (urls.length === 0) {
    return {
      status: "error",
      code: "no_sources",
      message: rejected.length ? `Not a usable link: ${rejected[0]}` : `Add one to ${OS_MAX_SOURCES} links.`,
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

  const fetched = await Promise.all(urls.map((url) => fetchSource(url)));
  const sources = fetched.filter((item): item is FetchedSource => !isFailure(item));
  if (sources.length === 0) {
    const first = fetched.find(isFailure);
    return { status: "error", code: "no_sources", message: first ? `${first.url}: ${first.reason}` : "None of those links could be read." };
  }

  const drafted = await draftFromSources(topic, shape, sources);
  if ("error" in drafted) {
    // Nothing was produced, so nothing is charged.
    await admin.from("os_runs").insert({
      user_id: userId,
      shape,
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
    shape,
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
