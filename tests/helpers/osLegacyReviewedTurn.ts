/** ARCHIVED S1h loop for existing pre-format measurement regression tests only.
 * Production MUST use lib/osReviewedTurn.ts. This copy does not implement
 * founder format/assertion controls and cannot establish current readiness.
 * Retained to avoid silently inventing selections for old case packs.
 */
import type { CofounderMessage, ModelTurn } from "@/lib/osCofounder";
import { runCostUsd } from "@/lib/os";
import { parseReviewProposal, type ProposalPayload } from "@/lib/osReviewBoundary";
import { reviewProposalGuard, REVIEW_REFUSAL_MESSAGES, type ReviewProposalRefusal } from "@/lib/osReviewGuard";
import { reviewToolsForMode, type ReviewRequestMode } from "@/lib/osReviewIntent";
import { invalidKnowledgeProposalFeedback, invalidWorkProposalFeedback } from "@/lib/osReviewProposalFeedback";
import { ReviewedTextGate } from "@/lib/osReviewTextGate";

/** This loop can stage review proposals, never save Work or company knowledge.
 * The host owns identity, source resolution, durable turn IDs and transactions.
 * Historical measurement continues to use osCofounderRun; this is the desk's
 * review-first loop and requires its own behavioral baseline.
 */
export type ReviewedTurnEvent =
  | { type: "text"; text: string }
  | { type: "proposal"; id: string }
  | { type: "refused"; reason: string }
  | { type: "done"; text: string; inputTokens: number; outputTokens: number; costUsd: number };

export type ReviewedTurnOptions = {
  mode: ReviewRequestMode;
  system: string;
  history: CofounderMessage[];
  turn: ModelTurn;
  priced?: boolean;
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
const NO_SAVE = "No review suggestion was prepared. No Work or company knowledge was saved by this turn. Nothing was approved or sent.";
const READY = "Ready for review; not saved to Work/company knowledge, approved or sent.";
const UNCERTAIN = "A review proposal could not be confirmed. Refresh to check its status before trying again. No automatic retry or further staging was attempted.";

type ToolCall = { id: string; name: string; input: Record<string, unknown> };
type ToolResult = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

function proposalFor(call: ToolCall): ProposalPayload | null {
  if (!call.input || typeof call.input !== "object" || Array.isArray(call.input) || Object.hasOwn(call.input, "type")) return null;
  const type = call.name === "propose_work" ? "work" : call.name === "propose_knowledge" ? "knowledge" : null;
  return type ? parseReviewProposal({ type, ...call.input }) : null;
}

function validTokens(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

export async function* runReviewedTurn(options: ReviewedTurnOptions): AsyncGenerator<ReviewedTurnEvent> {
  const allowedTools = reviewToolsForMode(options.mode);
  const messages: { role: "user" | "assistant"; content: unknown }[] = options.history.map((message) => ({
    role: message.role === "person" ? "user" : "assistant", content: message.body,
  }));
  let spoken = "";
  let modelTextSize = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let stagingClosed = false;
  let stagingUncertain = false;
  const proposals = new Set<string>();
  // Only a within-turn optimization. Cross-request/reload deduplication is a
  // transaction-level responsibility of the durable proposer.
  const stagedPayloads = new Map<string, string>();
  const warnings = new Set<string>();
  const cost = () => options.priced === false ? 0 : runCostUsd(inputTokens, outputTokens);
  const summary = () => [proposals.size ? READY : NO_SAVE, ...warnings].join("\n");
  const failure = (reason: string, warning: string) => {
    warnings.add(warning);
    return new ReviewedTurnError(reason, `${spoken}${spoken ? "\n\n" : ""}${summary()}`, inputTokens, outputTokens, cost());
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
      warnings.add(reason);
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
      if (stagingClosed) {
        reason = stagingUncertain ? UNCERTAIN : "No further proposals may be staged in this turn.";
      } else if (call.name !== "propose_work" && call.name !== "propose_knowledge") {
        reason = "This action is unavailable. The co-founder can only prepare review proposals; it cannot save, approve, execute or send them.";
      } else if (!allowedTools.includes(call.name)) {
        reason = "This kind of suggestion was not selected for this question. No proposal was staged; choose the matching review mode and ask again if you want one.";
      }
      const payload = reason ? null : proposalFor(call);
      if (!reason && !payload) reason = call.name === "propose_knowledge"
        ? invalidKnowledgeProposalFeedback(call.input)
        : invalidWorkProposalFeedback(call.input);
      if (!reason && payload) {
      const guard = reviewProposalGuard(payload);
        if (guard) reason = REVIEW_REFUSAL_MESSAGES[guard];
      }
      if (reason || !payload) {
        const message = reason ?? "Invalid review proposal; nothing was staged.";
        warnings.add(message);
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
            warnings.add(message);
            results.push({ type: "tool_result", tool_use_id: call.id, content: message, is_error: true });
            yield { type: "refused", reason: message };
            continue;
          }
          if (!proposal || typeof proposal.id !== "string" || !proposal.id.trim() || proposal.id.length > 200) throw new Error("invalid_proposal_receipt");
          id = proposal.id;
          stagedPayloads.set(key, id);
          proposals.add(id);
        } catch {
          // A lost DB response is not proof of rollback. Block all subsequent
          // staging, even reworded or different proposal types, until reload.
          stagingClosed = true;
          stagingUncertain = true;
          warnings.add(UNCERTAIN);
          results.push({ type: "tool_result", tool_use_id: call.id, content: UNCERTAIN, is_error: true });
          yield { type: "refused", reason: UNCERTAIN };
          aborted();
          continue;
        }
      }
      aborted();
      results.push({ type: "tool_result", tool_use_id: call.id, content: `${READY} Proposal ID: ${id}. The person must review and use the explicit save control.` });
      yield { type: "proposal", id };
    }
    messages.push({ role: "user", content: results });
  }
  aborted();
  if (!spoken.trim() && proposals.size === 0 && warnings.size === 0) warnings.add("The model did not produce an answer.");
  // Always append a trusted receipt. Later fluent model prose, including a
  // false 'saved' claim, must not erase the actual boundary or uncertainty.
  const receipt = `${spoken ? "\n\n" : ""}${summary()}`;
  spoken += receipt;
  yield { type: "text", text: receipt };
  yield { type: "done", text: spoken, inputTokens, outputTokens, costUsd: cost() };
}
