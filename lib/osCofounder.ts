import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/* The co-founder.
 *
 * Two things make this not a chat window, and neither of them is the prompt.
 *
 * The first is that it reads the company's actual state before it says
 * anything — what you sell, what is open, what you decided and when. That is
 * the difference between "it knows your company" as a claim and as a fact a
 * person can check.
 *
 * The second is that the one thing it can do, it cannot finish. Filing work
 * puts it in the queue; the database refuses to let anything reach `approved`
 * without a person signing the exact action. A prompt can be argued with. A
 * trigger cannot.
 */

export type Db = SupabaseClient<Database>;

export type CofounderMessage = { role: "person" | "cofounder"; body: string };

export type ModelEvent =
  | { type: "text"; text: string }
  | { type: "tool"; id: string; name: string; input: Record<string, unknown> }
  | { type: "done"; stopReason: string | null; inputTokens: number; outputTokens: number };

/* The seam. One turn of the model, as events. Everything above this is
 * orchestration and everything below is the SDK, which means the loop — tool
 * calls included — can be exercised without a key and without spending
 * anything. */
export type ModelTurn = (args: {
  system: string;
  messages: { role: "user" | "assistant"; content: unknown }[];
}) => AsyncIterable<ModelEvent>;

export const FILE_WORK_TOOL = {
  name: "file_work",
  description:
    "Put a piece of work into the founder's queue. Use this when something should exist as a task or a draft rather than only as a sentence in this conversation. You cannot approve or send anything: whatever you file waits for a person.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Short, specific, and readable on its own in a list." },
      lane: { type: "string", description: "Which part of the business: content, sales, ops, finance, product." },
      kind: { type: "string", description: "What it is: note, post, reply, research, decision." },
      notes: { type: "string", description: "The draft or the detail. Everything the person needs to decide." },
      needs_approval_for: {
        type: ["string", "null"] as unknown as string,
        description:
          "The outward act this waits on, such as publish or send. Null when nothing leaves the company, in which case it is filed as a draft rather than as a decision.",
      },
    },
    required: ["title", "lane", "kind"],
  },
};

export const REMEMBER_TOOL = {
  name: "remember",
  description:
    "Write down something about this company that should still be true next month: how they price, who a person is, a constraint they work under, a preference you have learned. Do not use this for anything already in the context below, for a task (file_work is for those), or for something only true today.",
  input_schema: {
    type: "object" as const,
    properties: {
      fact: {
        type: "string",
        description: "One thing, in a plain sentence, readable on its own by someone who was not in this conversation.",
      },
      kind: {
        type: "string",
        enum: ["fact", "preference", "constraint", "person", "decision"],
        description: "What sort of thing it is.",
      },
    },
    required: ["fact"],
  },
};

const SYSTEM = `You are the co-founder inside MaydaOS, working with the person who owns this company.

What you are:
- You hold the company's state and you are expected to remember it. The context below is real, current, and read from the database — treat it as fact.
- You are a colleague, not an assistant. Have a view. Disagree when you disagree, and say why in a sentence rather than a paragraph.
- You are talking to the person who decides. Be direct. Short sentences, specific nouns, no preamble, no summarising what they just said back at them.

What you may do:
- Think, research what you are told to research, draft, and file work into their queue with the file_work tool.
- File work when something should outlive this conversation. Do not file a task for something you just answered.
- Remember things with the remember tool. Use it when you learn something about the company that will still be true next month — how they price, who someone is, a constraint, a preference. Do not use it for tasks, for anything already in the context below, or for something only true today. Remember quietly: one short line at most, and never a list of what you have stored.

What you may not do:
- You cannot approve, publish, send, or finish anything. Everything you file waits for a person, and the system enforces that regardless of what you or they say here. Do not offer to do it anyway.
- Do not invent facts about the company. If the context does not say, say it does not say and ask.
- Do not pad. No "Great question", no bullet lists where two sentences would do, no closing offers of further help.

If they ask what you know, answer from the context below and be specific about what is missing.

What you remember is shown to them in full and they can retire anything you got wrong, so write memories you would be content to have read back to you.`;

/* What the co-founder knows, assembled from what is actually stored.
 *
 * Deliberately narrow and recent rather than everything: a context that grows
 * without bound eventually costs more than the answer is worth, and a model
 * given a hundred stale rows reasons about the wrong five.
 */
export async function buildCompanyContext(supabase: Db, companyId: string): Promise<string> {
  const [company, items, approvals, workflows, events, memory] = await Promise.all([
    supabase.from("os_companies").select("name, what_we_do, created_at").eq("id", companyId).maybeSingle(),
    supabase
      .from("os_work_items")
      .select("title, lane, kind, status, required_action, notes, updated_at")
      .eq("company_id", companyId)
      .not("status", "in", "(completed,canceled)")
      .order("updated_at", { ascending: false })
      .limit(25),
    supabase
      .from("os_approvals")
      .select("action, notes, approved_at, os_work_items(title)")
      .order("approved_at", { ascending: false })
      .limit(10),
    supabase
      .from("os_workflows")
      .select("name, brief, cadence, next_run_at, paused_reason")
      .eq("company_id", companyId)
      .eq("active", true),
    supabase
      .from("os_work_item_events")
      .select("event, detail, at, os_work_items(title)")
      .order("at", { ascending: false })
      .limit(15),
    supabase
      .from("os_company_memory")
      .select("fact, kind, source, created_at")
      .eq("company_id", companyId)
      .is("retired_at", null)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const lines: string[] = [];

  lines.push("<company>");
  lines.push(`name: ${company.data?.name ?? "unknown"}`);
  lines.push(`what they do: ${company.data?.what_we_do || "not written down yet"}`);
  lines.push("</company>");

  /* What it has learned, first and in full. This is the part that makes the
   * conversation feel like a colleague rather than a competent stranger, and
   * it is cheap: eighty short lines cost less than one stale work item. */
  lines.push("<what_you_have_learned>");
  if (!memory.data?.length) {
    lines.push("nothing yet — you have not written anything down about this company");
  } else {
    for (const row of memory.data) {
      lines.push(`- [${row.kind}] ${row.fact}${row.source === "person" ? " (they told you this)" : ""}`);
    }
  }
  lines.push("</what_you_have_learned>");

  lines.push("<open_work>");
  if (!items.data?.length) {
    lines.push("nothing open");
  } else {
    for (const item of items.data) {
      const waiting = item.required_action ? ` waiting-on: ${item.required_action}` : "";
      lines.push(`- [${item.status}] ${item.lane}/${item.kind}: ${item.title}${waiting}`);
      if (item.notes) lines.push(`  notes: ${item.notes.slice(0, 600)}`);
    }
  }
  lines.push("</open_work>");

  lines.push("<decisions_already_made>");
  if (!approvals.data?.length) {
    lines.push("none yet");
  } else {
    for (const row of approvals.data) {
      const title = (row.os_work_items as { title?: string } | null)?.title ?? "an item";
      const note = row.notes ? ` — "${row.notes.slice(0, 200)}"` : "";
      lines.push(`- approved "${row.action}" on ${title} (${row.approved_at})${note}`);
    }
  }
  lines.push("</decisions_already_made>");

  lines.push("<what_runs_on_its_own>");
  if (!workflows.data?.length) {
    lines.push("nothing scheduled");
  } else {
    for (const w of workflows.data) {
      const paused = w.paused_reason ? ` PAUSED: ${w.paused_reason}` : "";
      lines.push(`- ${w.name} (${w.cadence}, next ${w.next_run_at ?? "n/a"}): ${w.brief.slice(0, 200)}${paused}`);
    }
  }
  lines.push("</what_runs_on_its_own>");

  lines.push("<recent_history>");
  if (!events.data?.length) {
    lines.push("nothing yet");
  } else {
    for (const e of events.data) {
      const title = (e.os_work_items as { title?: string } | null)?.title ?? "an item";
      lines.push(`- ${e.event} on ${title} (${e.at})`);
    }
  }
  lines.push("</recent_history>");

  return lines.join("\n");
}

export function systemFor(context: string): string {
  return `${SYSTEM}\n\nHere is the company, as the database has it right now.\n\n${context}`;
}

/* Filing work.
 *
 * Status follows the shape of what is being filed rather than anything the
 * model asserts: something with an outward act waiting on it goes to `review`
 * because a person has to settle it, and everything else is a draft. It
 * cannot be filed approved — the gate would refuse it — so there is nothing
 * to guard against here beyond writing the honest value.
 */
export async function fileWork(
  supabase: Db,
  companyId: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; title: string } | { ok: false; error: string }> {
  const text = (key: string, max: number) => {
    const value = input[key];
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  };

  const title = text("title", 200);
  if (!title) return { ok: false, error: "a work item needs a title" };

  const requiredAction = text("needs_approval_for", 60).toLowerCase() || null;

  const { error } = await supabase.from("os_work_items").insert({
    company_id: companyId,
    lane: text("lane", 40) || "ops",
    kind: text("kind", 40) || "note",
    title,
    // NOT NULL on the table: an item with nothing written is an item
    // with an empty note, not an item with a missing one.
    notes: text("notes", 20_000),
    status: requiredAction ? "review" : "drafted",
    required_action: requiredAction,
    metadata: { by: "cofounder" },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, title };
}

/* Writing something down.
 *
 * Deliberately narrow: one sentence, one kind, no structure. A memory the
 * co-founder can shape freely becomes a place to put whole conversations,
 * and the value of this list is that a person can read all of it.
 */
export async function rememberFact(
  supabase: Db,
  companyId: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; fact: string } | { ok: false; error: string }> {
  const raw = typeof input.fact === "string" ? input.fact.trim() : "";
  if (raw.length < 3) return { ok: false, error: "a memory needs to say something" };
  const fact = raw.slice(0, 2000);

  const kinds = ["fact", "preference", "constraint", "person", "decision"];
  const kindRaw = typeof input.kind === "string" ? input.kind : "fact";
  const kind = kinds.includes(kindRaw) ? kindRaw : "fact";

  /* Written by the server, so the guard leaves source alone: this is the
   * co-founder learning something, not a person typing it, and the list says
   * which is which because that changes how much to believe it. */
  const { error } = await supabase
    .from("os_company_memory")
    .insert({ company_id: companyId, fact, kind, source: "cofounder" });

  if (error) return { ok: false, error: error.message };
  return { ok: true, fact };
}
