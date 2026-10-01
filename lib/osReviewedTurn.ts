import type { CofounderMessage, ModelTurn } from "@/lib/osCofounder";
import { runCostUsd } from "@/lib/os";
import { costUsdAt, type ModelPrice } from "@/lib/osModelSettings";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { reviewProposalGuard, REVIEW_REFUSAL_MESSAGES, type ReviewProposalRefusal } from "@/lib/osReviewGuard";
import { reviewToolsForIntent, reviewIntentGuard, parseReviewRequestIntent, type ReviewRequestMode, type ReviewRequestIntent } from "@/lib/osReviewIntent";
import { invalidKnowledgeToolFeedback, invalidDraftToolFeedback } from "@/lib/osReviewProposalFeedback";
import { reviewProposalEnvelope, validReviewCurrentSource, type ReviewCurrentSource } from "@/lib/osReviewEnvelope";
import { buildReviewReceipt, REVIEW_RECEIPT_READY, type ReviewReceiptRefusal } from "@/lib/osReviewReceipt";
import { ReviewedTextGate } from "@/lib/osReviewTextGate";

/** This loop can stage review proposals, never save Work or company knowledge.
 * The host owns identity, source resolution, durable turn IDs and transactions.
 * This is the desk's loop, and the one the scenario harness measures
 * (tests/cofounder.scenarios.test.ts) with the person's selection as a
 * scenario input; the legacy loop in osCofounderRun is measured only from
 * history.
 */
export type ReviewedTurnEvent =
  | { type: "text"; text: string }
  | { type: "proposal"; id: string }
  | { type: "refused"; reason: string }
  | { type: "done"; text: string; inputTokens: number; outputTokens: number; costUsd: number };

export type ReviewedTurnOptions = {
  mode: ReviewRequestMode;
  intent: ReviewRequestIntent;
  source: ReviewCurrentSource;
  system: string;
  history: CofounderMessage[];
  turn: ModelTurn;
  priced?: boolean;
  /** The company's own rates; absent means the platform model's. */
  price?: ModelPrice;
  signal?: AbortSignal;
  propose: (payload: ProposalPayload) => Promise<{ id: string } | ReviewProposalRefusal>;
};

/** The route must record a failed turn, with this partial reply and usage, not
 * manufacture a completed receipt when the model stream ended unexpectedly.
 * Provider exception strings are deliberately not exposed to the client.
 */
export class ReviewedTurnError extends Error {
  constructor(
    public readonly reason: string,
    public readonly text: string,
    public readonly inputTokens: number,
    public readonly outputTokens: number,
    public readonly costUsd: number,
  ) {
    super(reason);
    this.name = "ReviewedTurnError";
  }
}

const MAX_ROUNDS = 3;
const MAX_CALLS = 8;
const MAX_MODEL_TEXT = 32_000;
const UNCERTAIN = "A review proposal could not be confirmed. Refresh to check its status before trying again. No automatic retry or further staging was attempted.";

type ToolCall = { id: string; name: string; input: Record<string, unknown> };
type ToolResult = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

function validTokens(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

export async function* runReviewedTurn(options: ReviewedTurnOptions): AsyncGenerator<ReviewedTurnEvent> {
  const parsedIntent = parseReviewRequestIntent(options.intent, options.mode);
  if (!parsedIntent) throw new ReviewedTurnError("intent_required", "Explicit request choices are required. Nothing was generated or saved.", 0, 0, 0);
  if (!validReviewCurrentSource(options.source)) throw new ReviewedTurnError("source_required", "The stored request could not be read. Nothing was generated or saved.", 0, 0, 0);
  // Snapshot before the first await; a later mutation of caller data cannot
  // change what this turn was allowed to propose or attribute.
  const intent = Object.freeze(parsedIntent);
  const source = Object.freeze({ id: options.source.id, text: options.source.text });
  const allowedTools = reviewToolsForIntent(options.mode, intent);
  const messages: { role: "user" | "assistant"; content: unknown }[] = options.history.map((message) => ({
    role: message.role === "person" ? "user" : "assistant", content: message.body,
  }));
  let spoken = "";
  let modelTextSize = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let stagingClosed = false;
  let stagingUncertain = false;
  const proposals = new Map<string, ProposalPayload["type"]>();
  // Only a within-turn optimization. Cross-request/reload deduplication is a
  // transaction-level responsibility of the durable proposer.
  const stagedPayloads = new Map<string, string>();
  const warnings = new Set<string>();
  const refusals: ReviewReceiptRefusal[] = [];
  let rejectedBatches = 0;
  const cost = () => options.priced === false ? 0 : options.price ? costUsdAt(options.price, inputTokens, outputTokens) : runCostUsd(inputTokens, outputTokens);
  const summary = (fatalWarnings: string[] = []) => [buildReviewReceipt({
    staged: {
      work: [...proposals.values()].filter((type) => type === "work").length,
      knowledge: [...proposals.values()].filter((type) => type === "knowledge").length,
    }, historicalRefusals: refusals, rejectedBatches, uncertain: stagingUncertain, fatalWarnings,
  }).text, ...warnings].join("\n");
  const failure = (reason: string, warning: string) => {
    return new ReviewedTurnError(reason, `${spoken}${spoken ? "\n\n" : ""}${summary([warning])}`, inputTokens, outputTokens, cost());
  };
  const aborted = () => {
    if (options.signal?.aborted) throw failure("aborted", "The reply was interrupted. Refresh to check any review proposals already prepared.");
  };

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    aborted();
    let visibleRoundText = "";
    const textGate = new ReviewedTextGate();
    const calls: ToolCall[] = [];
    const callIds = new Set<string>();
    let terminal = false;
    let stopReason: string | null = null;
    let invalidCalls = false;

    try {
      for await (const event of options.turn({
        system: options.system, messages,
        tools: stagingClosed ? [] : allowedTools,
        signal: options.signal,
      })) {
        aborted();
        if (terminal) throw failure("provider_incomplete", "The model returned an inconsistent reply. No pending tool calls from that reply were staged.");
        if (event.type === "text") {
          if (typeof event.text !== "string" || modelTextSize + event.text.length > MAX_MODEL_TEXT) {
            throw failure("reply_limit", "The reply exceeded its safe size limit and was interrupted. No pending tool calls from that reply were staged.");
          }
          modelTextSize += event.text.length;
          for (const visible of textGate.feed(event.text)) {
            spoken += visible;
            visibleRoundText += visible;
            yield { type: "text", text: visible };
          }
        } else if (event.type === "tool") {
          if (calls.length >= MAX_CALLS || typeof event.id !== "string" || !event.id.trim() || event.id.length > 200 || callIds.has(event.id)) {
            invalidCalls = true;
            continue;
          }
          callIds.add(event.id);
          calls.push({ id: event.id, name: event.name, input: event.input });
        } else {
          if (!validTokens(event.inputTokens) || !validTokens(event.outputTokens) ||
              !Number.isSafeInteger(inputTokens + event.inputTokens) || !Number.isSafeInteger(outputTokens + event.outputTokens)) {
            throw failure("provider_usage_invalid", "The model did not return valid usage information. No pending tool calls from that reply were staged.");
          }
          inputTokens += event.inputTokens;
          outputTokens += event.outputTokens;
          terminal = true;
          stopReason = event.stopReason;
        }
      }
    } catch (error) {
      if (error instanceof ReviewedTurnError) throw error;
      aborted();
      throw failure("provider_failed", "The model reply could not finish. Refresh to check any review proposals already prepared.");
    }
    aborted();
    for (const visible of textGate.finish()) {
      spoken += visible;
      visibleRoundText += visible;
      yield { type: "text", text: visible };
    }
    if (textGate.suppressedToolEcho) {
      warnings.add("The model returned tool-shaped text, which was hidden. Review the actual suggestion cards and the trusted status receipt; its explanation may be incomplete.");
    }
    if (!terminal || !["end_turn", "tool_use"].includes(stopReason ?? "") ||
        (calls.length > 0 && stopReason !== "tool_use") || (calls.length === 0 && stopReason === "tool_use" && !invalidCalls)) {
      throw failure("provider_incomplete", "The model reply was incomplete. No pending tool calls from that reply were staged.");
    }
    if (invalidCalls) {
      const reason = "The reply exceeded the eight-proposal limit or contained invalid tool identities. None of its pending proposals were staged.";
      rejectedBatches++;
      yield { type: "refused", reason };
      break;
    }
    if (!calls.length) break;

    messages.push({ role: "assistant", content: [
      ...(visibleRoundText ? [{ type: "text", text: visibleRoundText }] : []),
      ...calls.map((call) => ({ type: "tool_use", ...call })),
    ] });
    const results: ToolResult[] = [];
    for (const call of calls) {
      aborted();
      let reason: string | null = null;
      const unavailable = call.name !== "propose_work" && call.name !== "propose_knowledge";
      if (unavailable) {
        reason = "This action is unavailable. The co-founder can only prepare review proposals; it cannot save, approve, execute or send them.";
      } else if (stagingClosed) {
        reason = stagingUncertain ? UNCERTAIN : "No further proposals may be staged in this turn.";
      } else if (!allowedTools.some((name) => name === call.name)) {
        reason = "This kind of suggestion was not selected for this question. No proposal was staged; choose the matching review mode and ask again if you want one.";
      }
      const payload = reason ? null : reviewProposalEnvelope(call.name, call.input, intent, source);
      if (!reason && !payload) reason = call.name === "propose_knowledge"
        ? invalidKnowledgeToolFeedback(call.input)
        : invalidDraftToolFeedback(call.input);
      if (!reason && payload) {
        const guard = reviewIntentGuard(payload, intent) ?? reviewProposalGuard(payload);
        if (guard) reason = REVIEW_REFUSAL_MESSAGES[guard];
      }
      if (reason || !payload) {
        const message = reason ?? "Invalid review proposal; nothing was staged.";
        if (!stagingUncertain || unavailable) refusals.push({ kind: call.name === "propose_work" ? "work" : call.name === "propose_knowledge" ? "knowledge" : "action", message });
        results.push({ type: "tool_result", tool_use_id: call.id, content: message, is_error: true });
        yield { type: "refused", reason: message };
        continue;
      }
      const key = JSON.stringify(payload);
      let id = stagedPayloads.get(key);
      if (!id) {
        try {
          const proposal = await options.propose(payload);
          if (proposal && "rejected" in proposal) {
            if (!Object.hasOwn(REVIEW_REFUSAL_MESSAGES, proposal.rejected)) throw new Error("invalid_proposal_refusal");
            const message = REVIEW_REFUSAL_MESSAGES[proposal.rejected];
            refusals.push({ kind: payload.type, message });
            results.push({ type: "tool_result", tool_use_id: call.id, content: message, is_error: true });
            yield { type: "refused", reason: message };
            continue;
          }
          if (!proposal || typeof proposal.id !== "string" || !proposal.id.trim() || proposal.id.length > 200) throw new Error("invalid_proposal_receipt");
          id = proposal.id;
          stagedPayloads.set(key, id);
          proposals.set(id, payload.type);
        } catch {
          // A lost DB response is not proof of rollback. Block all subsequent
          // staging, even reworded or different proposal types, until reload.
          stagingClosed = true;
          stagingUncertain = true;
          results.push({ type: "tool_result", tool_use_id: call.id, content: UNCERTAIN, is_error: true });
          yield { type: "refused", reason: UNCERTAIN };
          aborted();
          continue;
        }
      }
      aborted();
      results.push({ type: "tool_result", tool_use_id: call.id, content: `${payload.type === "work" ? "Work" : "Company knowledge"} suggestion: ${REVIEW_RECEIPT_READY} The person must review and use the explicit save control. Do not repeat this suggestion.` });
      yield { type: "proposal", id };
    }
    messages.push({ role: "user", content: results });
  }
  aborted();
  if (!spoken.trim()) warnings.add("The model did not produce an explanation; use the confirmed card counts above to check what is ready for review.");
  // Always append a trusted receipt. Later fluent model prose, including a
  // false 'saved' claim, must not erase the actual boundary or uncertainty.
  const receipt = `${spoken ? "\n\n" : ""}${summary()}`;
  spoken += receipt;
  yield { type: "text", text: receipt };
  yield { type: "done", text: spoken, inputTokens, outputTokens, costUsd: cost() };
}
