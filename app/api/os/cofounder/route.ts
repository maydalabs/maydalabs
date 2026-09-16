import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { buildCompanyContext, systemFor } from "@/lib/osCofounder";
import { runCofounderTurn } from "@/lib/osCofounderRun";
import { anthropicTurn, isCofounderConfigured } from "@/lib/osCofounderModel";
import { formatUsd } from "@/lib/os";

/* Talking to the co-founder.
 *
 * A route rather than a server action because the answer is streamed, and an
 * answer that appears all at once after ten seconds is a worse conversation
 * than the same words arriving as they are written.
 *
 * Both halves of the transcript are written here, by the server, inside the
 * request that called the model. Nobody holds an insert grant on os_messages:
 * a record whose subject can compose either side of it is not a record.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Line = Record<string, unknown>;

function ndjson(line: Line): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(line)}\n`);
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const claims = await getVerifiedClaims();
  if (!claims?.sub) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const said = typeof body?.message === "string" ? body.message.trim().slice(0, 8000) : "";
  if (!said) return NextResponse.json({ error: "empty" }, { status: 400 });

  /* Read through the caller's own client, so membership is decided by the
   * database rather than by this file. Everything after this point writes
   * with the service credential, and it may only do so because this returned
   * a row. */
  const supabase = await createSupabaseServerClient();
  const { data: company } = await supabase.from("os_companies").select("id, monthly_chat_usd").limit(1).maybeSingle();
  if (!company) return NextResponse.json({ error: "no_company" }, { status: 409 });

  if (!isCofounderConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: spent } = await supabase.rpc("os_chat_spent_this_month", { p_company_id: company.id });
  const budget = Number(company.monthly_chat_usd ?? 0);
  if (Number(spent ?? 0) >= budget) {
    return NextResponse.json(
      { error: "budget", message: `This month's conversation budget of ${formatUsd(budget)} is spent.` },
      { status: 402 },
    );
  }

  const admin = createSupabaseAdminClient();

  // One thread per company for now. Several is a later feature and an empty
  // thread list is a worse first impression than a single continuous one.
  let threadId: string;
  const { data: existing } = await admin
    .from("os_threads")
    .select("id")
    .eq("company_id", company.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    threadId = existing.id;
  } else {
    const { data: created, error } = await admin
      .from("os_threads")
      .insert({ company_id: company.id })
      .select("id")
      .single();
    if (error || !created) return NextResponse.json({ error: "thread_failed" }, { status: 500 });
    threadId = created.id;
  }

  const { data: history } = await admin
    .from("os_messages")
    .select("role, body")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(40);

  await admin.from("os_messages").insert({
    thread_id: threadId,
    role: "person",
    body: said,
    actor: claims.sub,
  });

  const context = await buildCompanyContext(supabase, company.id);
  const system = systemFor(context);
  const turn = anthropicTurn();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runCofounderTurn({
          supabase: admin,
          companyId: company.id,
          system,
          history: [
            ...(history ?? []).map((m) => ({ role: m.role as "person" | "cofounder", body: m.body })),
            { role: "person" as const, body: said },
          ],
          turn,
        })) {
          if (event.type === "done") {
            /* Written after the stream rather than during it: a half-finished
             * answer stored as if it were whole is worse than one that is
             * visibly missing, because only one of the two is obvious later. */
            await admin.from("os_messages").insert({
              thread_id: threadId,
              role: "cofounder",
              body: event.text || "(nothing said)",
              actor: null,
              input_tokens: event.inputTokens,
              output_tokens: event.outputTokens,
              cost_usd: event.costUsd,
            });
            await admin.from("os_threads").update({ title: "Conversation" }).eq("id", threadId);
            controller.enqueue(ndjson({ type: "done", costUsd: event.costUsd }));
          } else {
            controller.enqueue(ndjson(event));
          }
        }
      } catch (error) {
        controller.enqueue(
          ndjson({ type: "error", message: error instanceof Error ? error.message : "something broke" }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // Streaming through a proxy that buffers is streaming that does not
      // arrive until it is over.
      "x-accel-buffering": "no",
    },
  });
}
