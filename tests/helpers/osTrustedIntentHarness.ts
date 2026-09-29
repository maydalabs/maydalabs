import { createHash } from "node:crypto";
import { buildCompanyContext, reviewedSystemFor, type ModelEvent, type ModelTurn } from "../../lib/osCofounder";
import { type OsTrustedIntentCase, OS_TRUSTED_INTENT_CASES } from "../../lib/osTrustedIntentCases";
import { createReviewBoundary, type ProposalPayload, type ReviewSnapshot } from "../../lib/osReviewBoundary";
import { rejectUnavailableCurrentMessageCitation } from "../../lib/osReviewCitation";
import { rejectExistingOpenWork } from "../../lib/osReviewDuplicate";
import { reviewIntentGuard, reviewSourceForIntent, reviewToolsForIntent } from "../../lib/osReviewIntent";
import { runReviewedTurn, ReviewedTurnError, type ReviewedTurnEvent } from "../../lib/osReviewedTurn";
import { withScenarioDeadline } from "../../lib/osScenarioHarness";
import { intentContextFixture, opaqueIntentId } from "./osIntentHarness";

type Trace = { kind: string; at: string; value: unknown };
type ToolAttempt = { callIndex: number; eventIndex: number; id: string; name: string; input: Record<string, unknown>; offered: boolean };
const safeError = (error: unknown) => ({
  name: error instanceof Error ? error.name : "UnknownError",
  message: error instanceof Error ? error.message.slice(0, 4000) : "Unknown local runner error",
});

/** Diagnostics compare the semantic JSON shape of model tool arguments, not
 * incidental object insertion order. Array order remains meaningful. */
export function canonicalToolAttemptKey(name: string, input: Record<string, unknown>): string {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value !== null && typeof value === "object") {
      const row = value as Record<string, unknown>;
      return Object.fromEntries(Object.keys(row).sort().map((key) => [key, normalize(row[key])]));
    }
    return value;
  };
  return JSON.stringify({ name, input: normalize(input) });
}

export function plannedTrustedIntentCases(): readonly OsTrustedIntentCase[] {
  const ids = OS_TRUSTED_INTENT_CASES.map((item) => item.id);
  if (ids.length !== 6 || ids.some((id, index) => id !== `trusted-${String(index + 1).padStart(2, "0")}`)) {
    throw new Error("The trusted intent check must contain six ordered, distinct cases.");
  }
  return OS_TRUSTED_INTENT_CASES;
}

export type TrustedIntentAttemptRecord = {
  caseId: string; intent: OsTrustedIntentCase["intent"]; mode: OsTrustedIntentCase["mode"];
  typedIntent: OsTrustedIntentCase["typedIntent"];
  status: "running" | "completed" | "runtime_error" | "timed_out";
  humanReview: "pending"; reviewCriteria: readonly string[];
  startedAt: string; finishedAt?: string; durationMs?: number;
  identity: { companyId: string; actorId: string; threadId: string; turnId: string; sourceId: string; assertionSourceId: string };
  input: { question: string; context: string; system: string; selectedMode: string; selectedFormat: string | null; founderAssertion: string | null };
  before: unknown; after?: unknown;
  rawModelCalls: { input: unknown; events: ModelEvent[]; error?: { name: string; message: string } }[];
  attemptedTools: ToolAttempt[]; loopEvents: ReviewedTurnEvent[]; proposals: ReviewSnapshot[];
  reply: string; rawModelText: string;
  inputTokens: number; outputTokens: number; usageCoverage: "partial" | "provider_completion_records";
  structuralFindings: string[]; error?: { name: string; message: string };
  humanConfirmationsSimulated: 0; writerCalls: number; blockedFixtureWrites: number;
  cleanup: "pending" | "disposed_verified" | "failed";
};

/** Synthetic, read-only instrument. The model sees the actual selected choices,
 * never case ID, expected counts or human rubric. Every proposal stays in RAM.
 */
export async function runTrustedIntentAttempt(options: {
  item: OsTrustedIntentCase; attempt: number; turn: ModelTurn; timeoutMs: number;
  trace?: (trace: Trace) => void;
}): Promise<TrustedIntentAttemptRecord> {
  const { item, attempt } = options;
  const fixture = intentContextFixture(item, attempt);
  const started = Date.now();
  const identity = {
    companyId: fixture.companyId, actorId: opaqueIntentId(attempt, "actor"),
    threadId: opaqueIntentId(attempt, "thread"), turnId: opaqueIntentId(attempt, "turn"),
    sourceId: opaqueIntentId(attempt, "source"), assertionSourceId: `${opaqueIntentId(attempt, "source")}:assertion`,
  };
  const record: TrustedIntentAttemptRecord = {
    caseId: item.id, intent: item.intent, mode: item.mode, typedIntent: item.typedIntent,
    status: "running", humanReview: "pending", reviewCriteria: item.humanReview,
    startedAt: new Date(started).toISOString(), identity,
    input: { question: item.fixture.founderMessage, context: "", system: "", selectedMode: item.mode,
      selectedFormat: item.typedIntent.draftFormat, founderAssertion: item.typedIntent.knowledgeAssertion },
    before: fixture.snapshot(), rawModelCalls: [], attemptedTools: [], loopEvents: [], proposals: [],
    reply: "", rawModelText: "", inputTokens: 0, outputTokens: 0, usageCoverage: "partial",
    structuralFindings: [], humanConfirmationsSimulated: 0, writerCalls: 0, blockedFixtureWrites: 0, cleanup: "pending",
  };
  const trace = (kind: string, value: unknown) => options.trace?.({ kind, at: new Date().toISOString(), value: structuredClone(value) });
  trace("attempt_started", record);
  try {
    record.input.context = await buildCompanyContext(fixture.db, fixture.companyId);
    record.input.system = reviewedSystemFor(record.input.context, item.mode, item.typedIntent);
    const modelVisible = JSON.stringify(record.input);
    if (modelVisible.includes(item.id) || modelVisible.includes("synthetic_intent_context") ||
      modelVisible.includes(identity.sourceId) || modelVisible.includes(identity.assertionSourceId) ||
      modelVisible.includes(JSON.stringify(item.expected))) {
      throw new Error("Evaluation metadata leaked into model input");
    }
    trace("generation_input", record.input);
    // The loop receives this founder source independently of the system text;
    // it is not reconstructed from model output or any tool argument.
    const current = Object.freeze({ id: identity.sourceId, text: record.input.question });
    const assertion = item.typedIntent.knowledgeAssertion;
    const boundary = createReviewBoundary({
      identity: { companyId: identity.companyId, actorId: identity.actorId, threadId: identity.threadId, turnId: identity.turnId },
      sources: [
        { id: current.id, companyId: identity.companyId, revision: createHash("sha256").update(current.text).digest("hex"), text: current.text, origin: "founder" },
        ...(assertion === null ? [] : [{ id: identity.assertionSourceId, companyId: identity.companyId,
          revision: createHash("sha256").update(assertion).digest("hex"), text: assertion, origin: "founder" as const }]),
      ],
      write: async () => { record.writerCalls += 1; throw new Error("Review confirmation is unavailable in an intent check"); },
    });
    const offered = reviewToolsForIntent(item.mode, item.typedIntent);
    const measured: ModelTurn = async function* (args) {
      const callIndex = record.rawModelCalls.length;
      const call: TrustedIntentAttemptRecord["rawModelCalls"][number] = {
        input: structuredClone({ system: args.system, messages: args.messages, tools: args.tools }), events: [],
      };
      record.rawModelCalls.push(call);
      trace("provider_input", { callIndex, input: call.input });
      try {
        for await (const event of options.turn(args)) {
          const eventIndex = call.events.length;
          call.events.push(structuredClone(event));
          if (event.type === "text") record.rawModelText += event.text;
          if (event.type === "tool") {
            const tool = { callIndex, eventIndex, id: event.id, name: event.name, input: structuredClone(event.input), offered: offered.includes(event.name as typeof offered[number]) };
            record.attemptedTools.push(tool);
            trace("tool_attempt", tool);
          }
          if (event.type === "done") { record.inputTokens += event.inputTokens; record.outputTokens += event.outputTokens; }
          trace("provider_event", { callIndex, event });
          yield event;
        }
      } catch (error) {
        call.error = safeError(error);
        trace("provider_error", { callIndex, error: call.error });
        throw error;
      }
    };
    await withScenarioDeadline(options.timeoutMs, async (signal) => {
      for await (const event of runReviewedTurn({
        mode: item.mode, intent: item.typedIntent, source: current, system: record.input.system,
        history: [{ role: "person", body: record.input.question }], turn: measured, priced: false, signal,
        propose: async (payload: ProposalPayload) => {
          trace("proposal_attempt", payload);
          const intentRefusal = reviewIntentGuard(payload, item.typedIntent);
          if (intentRefusal) { const refusal = { rejected: intentRefusal }; trace("proposal_rejected", refusal); return refusal; }
          const source = reviewSourceForIntent(payload.type, current, item.typedIntent);
          const citationRefusal = rejectUnavailableCurrentMessageCitation(payload, source);
          if (citationRefusal) { trace("proposal_rejected", citationRefusal); return citationRefusal; }
          const duplicate = await rejectExistingOpenWork(fixture.db, identity.companyId, payload);
          if (duplicate) { trace("proposal_rejected", duplicate); return duplicate; }
          const result = boundary.model.propose(payload);
          if (!result.ok) { trace("proposal_rejected", result); throw new Error(result.reason); }
          const index = record.proposals.findIndex((proposal) => proposal.id === result.proposal.id);
          if (index === -1) record.proposals.push(result.proposal);
          else record.proposals[index] = result.proposal;
          trace("proposal_staged_in_memory", result.proposal);
          return { id: result.proposal.id };
        },
      })) {
        record.loopEvents.push(structuredClone(event));
        if (event.type === "text") record.reply += event.text;
        trace("loop_event", event);
      }
    });
    record.status = "completed";
    record.usageCoverage = "provider_completion_records";
    for (const type of ["work", "knowledge"] as const) {
      const count = record.proposals.filter((proposal) => proposal.payload.type === type).length;
      const [minimum, maximum] = item.expected.proposalCounts[type];
      if (count < minimum || count > maximum) record.structuralFindings.push(`${type} proposal count ${count}, expected ${minimum}..${maximum}`);
    }
    for (const event of record.loopEvents) if (event.type === "refused") record.structuralFindings.push(`Tool or proposal refused: ${event.reason}`);
    for (const tool of record.attemptedTools) if (!tool.offered) record.structuralFindings.push(`Unavailable tool attempted: ${tool.name}`);
    const seen = new Set<string>();
    for (const tool of record.attemptedTools) {
      const key = canonicalToolAttemptKey(tool.name, tool.input);
      if (seen.has(key)) record.structuralFindings.push(`Repeated tool attempt: ${tool.name}`);
      seen.add(key);
    }
    if (!record.rawModelText.trim()) record.structuralFindings.push("No model-authored answer prose");
    if (record.loopEvents.filter((event) => event.type === "done").length !== 1) record.structuralFindings.push("Missing unique completed loop receipt");
  } catch (error) {
    record.status = error instanceof Error && error.name === "TimeoutError" ? "timed_out" : "runtime_error";
    record.error = safeError(error);
    if (error instanceof ReviewedTurnError) record.reply = error.text;
    trace("attempt_error", record.error);
  } finally {
    record.after = fixture.snapshot();
    record.blockedFixtureWrites = fixture.blockedWrites();
    if (JSON.stringify(record.before) !== JSON.stringify(record.after)) record.structuralFindings.push("Fixture records changed unexpectedly");
    if (record.writerCalls || record.blockedFixtureWrites) record.structuralFindings.push("Attempted a forbidden business-record write");
    fixture.dispose();
    record.cleanup = fixture.isDisposed() ? "disposed_verified" : "failed";
    record.finishedAt = new Date().toISOString();
    record.durationMs = Date.now() - started;
    trace("attempt_finished", record);
  }
  return record;
}
