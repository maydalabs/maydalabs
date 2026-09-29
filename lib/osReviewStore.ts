import "server-only";
import type { Db } from "@/lib/osCofounder";
import { parseReviewProposal, type ProposalPayload, type ReviewSource } from "@/lib/osReviewBoundary";
import { isReviewRequestMode, parseReviewRequestIntent, reviewIntentEquals, type ReviewRequestMode, type ReviewRequestIntent } from "@/lib/osReviewIntent";
import type { DurableProposal, DurableTurn, ReviewSnapshot } from "@/lib/osReviewTypes";
import type { Database } from "@/lib/supabase/database.types";
import { ConfirmedReviewRejection, reviewProposalGuard } from "@/lib/osReviewGuard";

type Identity = { companyId: string; actorId: string };
type Functions = Database["public"]["Functions"];
type ReviewRpc = Extract<keyof Functions, `os_review_${string}`>;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function message(value: unknown): value is DurableTurn["history"][number] {
  return record(value) && text(value.id) && (value.role === "person" || value.role === "cofounder") && typeof value.body === "string";
}
function source(value: unknown): value is ReviewSource {
  return record(value) && text(value.id) && text(value.companyId) && text(value.revision) && typeof value.text === "string" &&
    (value.origin === "founder" || value.origin === "record" || value.origin === "quoted" || value.origin === "model");
}

// Generated types cover SQL columns and RPC arguments. JSON and text CHECK
// constraints still need runtime narrowing before a durable receipt is trusted.
function turnReceipt(value: unknown, who: Pick<Identity, "companyId"> & Partial<Pick<Identity, "actorId">>, id?: string): DurableTurn {
  if (!record(value) || !text(value.id) || (id !== undefined && value.id !== id) || value.company_id !== who.companyId ||
    !text(value.actor_id) || (who.actorId !== undefined && value.actor_id !== who.actorId) ||
    !text(value.thread_id) || !text(value.person_message_id) || !text(value.question) ||
    !isReviewRequestMode(value.request_mode) ||
    !text(value.created_at) || !text(value.updated_at) ||
    (value.status !== "running" && value.status !== "completed" && value.status !== "failed") ||
    !(value.reply === null || typeof value.reply === "string") ||
    (value.status === "running" ? value.reply !== null : typeof value.reply !== "string") ||
    !Array.isArray(value.history) || value.history.length > 40 || !value.history.every(message)) {
    throw new Error("review_storage_unconfirmed");
  }
  const intent = value.request_intent === null ? null : parseReviewRequestIntent(value.request_intent, value.request_mode);
  if (value.request_intent !== null && !intent) throw new Error("review_storage_unconfirmed");
  return {
    id: value.id, company_id: value.company_id, actor_id: value.actor_id, thread_id: value.thread_id,
    person_message_id: value.person_message_id, question: value.question, mode: value.request_mode, intent, status: value.status,
    reply: value.reply, created_at: value.created_at, updated_at: value.updated_at,
    history: value.history.map(({ id, role, body }) => ({ id, role, body })),
  };
}
function proposalReceipt(value: unknown, who: Identity, id?: string): DurableProposal {
  if (!record(value) || !text(value.id) || (id !== undefined && value.id !== id) || value.company_id !== who.companyId ||
    value.actor_id !== who.actorId || !text(value.turn_id) || typeof value.revision !== "number" || !Number.isInteger(value.revision) || value.revision < 1 ||
    typeof value.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(value.fingerprint) ||
    (value.status !== "proposed" && value.status !== "saved" && value.status !== "dismissed") ||
    !(value.record_id === null || text(value.record_id)) ||
    (value.status === "saved" ? !text(value.record_id) : value.record_id !== null) ||
    !Array.isArray(value.sources) || !value.sources.every(source)) throw new Error("review_storage_unconfirmed");
  const payload = parseReviewProposal(value.payload);
  const sources: ReviewSource[] = value.sources;
  if (!payload || sources.some((item) => item.companyId !== who.companyId) ||
    new Set(sources.map((item) => item.id)).size !== sources.length ||
    payload.citations.some((citation) => !sources.some((item) => item.id === citation.sourceId && item.text.includes(citation.quote)))) {
    throw new Error("review_storage_unconfirmed");
  }
  return {
    id: value.id, company_id: value.company_id, actor_id: value.actor_id, turn_id: value.turn_id,
    revision: value.revision, fingerprint: value.fingerprint, payload,
    sources: sources.map(({ id, companyId, revision, text, origin }) => ({ id, companyId, revision, text, origin })),
    status: value.status, record_id: value.record_id,
  };
}
/* Belonging to the company is the entitlement — the same rule as
 * lib/osBetaAccess.ts, and the same one internal.os_review_access enforces
 * under a lock. A founder who came in through the front door is a member and
 * is not on any beta list; the list was already the wrong question once. */
export async function hasReviewAccess(db: Db, companyId: string, actorId: string) {
  const { data, error } = await db.from("os_company_members").select("user_id")
    .eq("company_id", companyId).eq("user_id", actorId).maybeSingle();
  return !error && !!data;
}
async function rpc<Name extends ReviewRpc>(db: Db, name: Name, args: Functions[Name]["Args"]) {
  const { data, error } = await db.rpc(name, args);
  // Only these explicit PostgreSQL exceptions prove this statement rolled
  // back. Transport, gateway and unknown DB errors remain unconfirmed.
  if ((name === "os_review_propose" || name === "os_review_decide") && error?.code === "P0001") {
    if (error.message === "review_duplicate_work") throw new ConfirmedReviewRejection("duplicate_work");
    if (error.message === "review_work_action_mismatch") throw new ConfirmedReviewRejection("work_action");
    if (error.message === "review_intent_required") throw new ConfirmedReviewRejection("intent_required");
    if (error.message === "review_draft_format") throw new ConfirmedReviewRejection("draft_format");
    if (error.message === "review_knowledge_assertion") throw new ConfirmedReviewRejection("knowledge_assertion");
    if (error.message === "review_knowledge_approval") throw new ConfirmedReviewRejection("knowledge_approval");
  }
  // Any other error PostgreSQL raised inside these two RPCs rolled the whole
  // statement back: data (22), constraint (23), access (42) and plpgsql (P0)
  // classes cannot follow a commit. Connection, resource and internal classes
  // can, and stay unconfirmed. The message is not forwarded.
  if ((name === "os_review_propose" || name === "os_review_decide") && typeof error?.code === "string" && /^(22|23|42|P0)[0-9A-Z]{3}$/.test(error.code)) {
    throw new ConfirmedReviewRejection("refused");
  }
  if (error || !data) throw new Error("review_storage_unconfirmed");
  return data;
}
export async function beginReviewTurn(db: Db, who: Identity, id: string, question: string, mode: ReviewRequestMode, intent: ReviewRequestIntent) {
  if (!parseReviewRequestIntent(intent, mode)) throw new Error("invalid_request_intent");
  const result = await rpc(db, "os_review_begin", {
    p_id: id, p_company: who.companyId, p_actor: who.actorId, p_question: question, p_mode: mode, p_intent: intent,
  });
  if (!record(result) || typeof result.created !== "boolean") throw new Error("review_storage_unconfirmed");
  const turn = turnReceipt(result.turn, who, id);
  if (turn.mode !== mode || turn.question !== question || !reviewIntentEquals(turn.intent, intent)) throw new Error("review_storage_unconfirmed");
  return { created: result.created, turn };
}
export async function finishReviewTurn(db: Db, who: Identity, id: string, reply: string,
  status: "completed" | "failed", usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 }) {
  return turnReceipt(await rpc(db, "os_review_finish", {
    p_id: id, p_company: who.companyId, p_actor: who.actorId, p_reply: reply, p_status: status,
    p_input_tokens: usage.inputTokens, p_output_tokens: usage.outputTokens, p_cost: usage.costUsd,
  }), who, id);
}
export async function proposeReview(db: Db, who: Identity, turnId: string, payload: ProposalPayload) {
  const reason = reviewProposalGuard(payload);
  if (reason) throw new ConfirmedReviewRejection(reason);
  const proposal = proposalReceipt(await rpc(db, "os_review_propose", {
    p_id: crypto.randomUUID(), p_turn: turnId, p_company: who.companyId, p_actor: who.actorId, p_payload: payload,
  }), who);
  if (proposal.turn_id !== turnId) throw new Error("review_storage_unconfirmed");
  return proposal;
}
export async function decideReview(db: Db, who: Identity, input: {
  proposalId: string; revision: number; fingerprint: string; action: string; payload?: ProposalPayload; knowledgeApproved?: true;
}) {
  if (input.action === "add_to_company_knowledge" && input.knowledgeApproved !== true) throw new ConfirmedReviewRejection("knowledge_approval");
  if (input.action === "revise" && input.payload) {
    const reason = reviewProposalGuard(input.payload);
    if (reason) throw new ConfirmedReviewRejection(reason);
  }
  if (input.action === "save_to_work" || input.action === "add_to_company_knowledge") {
    // The browser never supplies the content being saved. Check the stored,
    // exact reviewed revision; SQL rechecks identity/revision under its lock.
    const { data, error } = await db.from("os_review_proposals").select("*")
      .eq("id", input.proposalId).eq("company_id", who.companyId).eq("actor_id", who.actorId).maybeSingle();
    if (error || !data) throw new Error("review_storage_unconfirmed");
    const current = proposalReceipt(data, who, input.proposalId);
    if (current.status === "proposed" && current.revision === input.revision && current.fingerprint === input.fingerprint) {
      const reason = reviewProposalGuard(current.payload);
      if (reason) throw new ConfirmedReviewRejection(reason);
    }
    // Already-saved and stale attempts still reach SQL's existing replay/
    // conflict handling. New policy must not erase a historical saved receipt.
  }
  return proposalReceipt(await rpc(db, "os_review_decide", {
    p_id: input.proposalId, p_company: who.companyId, p_actor: who.actorId,
    p_revision: input.revision, p_fingerprint: input.fingerprint,
    p_action: input.action, p_payload: input.payload ?? null, p_knowledge_approved: input.knowledgeApproved === true,
  }), who, input.proposalId);
}

// All reads use the signed-in client's RLS, never an admin broad snapshot.
export async function loadReviewSnapshot(db: Db, companyId: string, actorId: string, requestId?: string): Promise<ReviewSnapshot> {
  if (!await hasReviewAccess(db, companyId, actorId)) throw new Error("review_access_denied");
  const { data: thread, error: threadError } = await db.from("os_threads").select("id")
    .eq("company_id", companyId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (threadError) throw new Error("review_read_unavailable");
  const [messages, proposals, turns] = await Promise.all([
    thread ? db.from("os_messages").select("id,role,body").eq("thread_id", thread.id)
      .order("created_at", { ascending: false }).limit(60) : Promise.resolve({ data: [], error: null }),
    db.from("os_review_proposals").select("*").eq("company_id", companyId).eq("actor_id", actorId)
      .order("created_at", { ascending: false }).limit(100),
    db.from("os_review_turns").select("*").eq("company_id", companyId)
      .order("created_at", { ascending: false }).limit(20),
  ]);
  if ([messages, proposals, turns].some((r) => r.error || !r.data)) throw new Error("review_read_unavailable");
  // A proposal may outlive the twenty-message turn window. Its original
  // request choices must remain available for review, never be guessed.
  const missingTurnIds = [...new Set(proposals.data!.map((proposal) => proposal.turn_id))]
    .filter((id) => !turns.data!.some((turn) => turn.id === id));
  if (missingTurnIds.length) {
    const linked = await db.from("os_review_turns").select("*")
      .eq("company_id", companyId).eq("actor_id", actorId).in("id", missingTurnIds);
    if (linked.error || !Array.isArray(linked.data) || missingTurnIds.some((id) => !linked.data.some((turn) => turn.id === id))) throw new Error("review_read_unavailable");
    turns.data!.push(...linked.data);
  }
  if (requestId && !turns.data!.some((turn) => turn.id === requestId)) {
    const target = await db.from("os_review_turns").select("*")
      .eq("id", requestId).eq("company_id", companyId).eq("actor_id", actorId).maybeSingle();
    if (target.error) throw new Error("review_read_unavailable");
    if (target.data) turns.data!.push(target.data);
  }
  const chat = messages.data!.map((m): ReviewSnapshot["messages"][number] => {
    if (m.role !== "person" && m.role !== "cofounder") throw new Error("review_invalid_transcript");
    return { id: m.id, role: m.role, body: m.body };
  }).reverse();
  return { companyId, actorId, messages: chat,
    proposals: proposals.data!.map((item) => proposalReceipt(item, { companyId, actorId })),
    turns: turns.data!.map((item) => turnReceipt(item, { companyId })),
  };
}

export async function interruptReviewTurn(db: Db, who: Identity, id: string) {
  return turnReceipt(await rpc(db, "os_review_interrupt", { p_id: id, p_company: who.companyId, p_actor: who.actorId }), who, id);
}
