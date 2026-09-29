import { createHash } from "node:crypto";
import { buildCompanyContext, type Db, type ModelEvent, type ModelTurn } from "../../lib/osCofounder";
import { reviewedSystemFor } from "./osLegacyReviewedSystem";
import { OS_INTENT_CASES, type OsIntentCase } from "../../lib/osIntentCases";
import { createReviewBoundary, type ReviewSnapshot } from "../../lib/osReviewBoundary";
import { rejectUnavailableCurrentMessageCitation } from "../../lib/osReviewCitation";
import { rejectExistingOpenWork } from "../../lib/osReviewDuplicate";
import { type ReviewRequestMode, reviewToolsForMode } from "../../lib/osReviewIntent";
import { runReviewedTurn, ReviewedTurnError, type ReviewedTurnEvent } from "./osLegacyReviewedTurn";
import { withScenarioDeadline } from "../../lib/osScenarioHarness";
import type { Scenario } from "../../lib/osScenarios";
import { scenarioFixture } from "./scenarioFixture";

type Trace = { kind: string; at: string; value: unknown };
type ToolAttempt = { callIndex: number; eventIndex: number; id: string; name: string; input: Record<string, unknown>; offeredInMode: boolean };

/** Explicit evaluator choices from the frozen case pack. The selected mode is
 * shown to the model, while case ID, intent and expected result are not.
 */
export function modeForIntentCase(item: OsIntentCase): ReviewRequestMode {
  return item.mode;
}

export function plannedIntentCases(): readonly OsIntentCase[] {
  const ids = OS_INTENT_CASES.map((item) => item.id);
  if (ids.length !== 11 || ids.some((id, index) => id !== `intent-${String(index + 1).padStart(2, "0")}`)) {
    throw new Error("The frozen intent check must contain eleven ordered, distinct cases.");
  }
  return OS_INTENT_CASES;
}

export function opaqueIntentId(attempt: number, kind: string, ordinal = 0) {
  if (!Number.isSafeInteger(attempt) || attempt < 1 || !/^[a-z_]+$/.test(kind) || !Number.isSafeInteger(ordinal) || ordinal < 0) {
    throw new Error("Invalid synthetic identity request");
  }
  const hex = createHash("sha256").update(`intent-check/1/${attempt}/${kind}/${ordinal}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** The existing context builder reads only fictional in-memory rows. Every
 * model-visible identity is opaque and independent of case ID/expectations.
 * Unsupported reads and all business writes fail closed.
 */
export function intentContextFixture(item: OsIntentCase, attempt: number) {
  const scenario: Scenario = {
    key: "synthetic_intent_context", title: "", says: [item.fixture.founderMessage],
    company: { ...item.fixture.company },
    memory: item.fixture.memory?.map((row) => ({ ...row })),
    openWork: item.fixture.openWork?.map((row) => ({ ...row })),
    expect: {}, humanReviewCriteria: [],
  };
  const old = scenarioFixture(scenario);
  const ids = new Map<string, string>([[old.companyId, opaqueIntentId(attempt, "company")]]);
  for (const [table, rows] of Object.entries(old.snapshot())) {
    rows.forEach((row, index) => {
      if (typeof row.id === "string" && !ids.has(row.id)) ids.set(row.id, opaqueIntentId(attempt, table, index));
    });
  }
  const reverse = new Map([...ids].map(([original, opaque]) => [opaque, original]));
  const remap = (value: unknown): unknown => {
    if (typeof value === "string") return ids.get(value) ?? value;
    if (Array.isArray(value)) return value.map(remap);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, remap(entry)]));
    return value;
  };
  let blockedWrites = 0;
  const from = (table: string) => {
    const query = old.db.from(table as never) as unknown as Record<string, unknown>;
    const proxy: Record<string, unknown> = new Proxy(query, {
      get(target, property) {
        if (["insert", "update", "upsert", "delete"].includes(String(property))) return () => {
          blockedWrites += 1;
          throw new Error("Intent fixture is read-only");
        };
        if (property === "then") return (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
          Promise.resolve(query).then((result) => resolve(remap(result)), reject);
        const method = target[String(property)];
        if (typeof method !== "function") throw new Error(`Unsupported intent fixture operation: ${String(property)}`);
        return (...args: unknown[]) => {
          method.apply(target, args.map((arg) => typeof arg === "string" ? reverse.get(arg) ?? arg : arg));
          return proxy;
        };
      },
    });
    return proxy;
  };
  return {
    db: { from } as unknown as Db,
    companyId: ids.get(old.companyId)!,
    snapshot: () => remap(old.snapshot()),
    blockedWrites: () => blockedWrites,
    dispose: old.dispose,
    isDisposed: old.isDisposed,
  };
}

export type IntentAttemptRecord = {
  caseId: string; intent: OsIntentCase["intent"]; mode: ReviewRequestMode;
  status: "running" | "completed" | "runtime_error" | "timed_out";
  humanReview: "pending"; reviewCriteria: readonly string[];
  startedAt: string; finishedAt?: string; durationMs?: number;
  identity: { companyId: string; actorId: string; threadId: string; turnId: string; sourceId: string };
  input: { question: string; context: string; system: string };
  before: unknown; after?: unknown;
  rawModelCalls: { input: unknown; events: ModelEvent[]; error?: { name: string; message: string } }[];
  attemptedTools: ToolAttempt[]; loopEvents: ReviewedTurnEvent[]; proposals: ReviewSnapshot[];
  reply: string; rawModelText: string;
  inputTokens: number; outputTokens: number; usageCoverage: "partial" | "provider_completion_records";
  structuralFindings: string[]; error?: { name: string; message: string };
  humanConfirmationsSimulated: 0; writerCalls: number; blockedFixtureWrites: number;
  cleanup: "pending" | "disposed_verified" | "failed";
};

const safeError = (error: unknown) => ({
  name: error instanceof Error ? error.name : "UnknownError",
  message: error instanceof Error ? error.message.slice(0, 4000) : "Unknown local runner error",
});

export async function runIntentAttempt(options: {
  item: OsIntentCase; attempt: number; turn: ModelTurn; timeoutMs: number;
  trace?: (trace: Trace) => void;
}): Promise<IntentAttemptRecord> {
  const { item, attempt } = options;
  const mode = modeForIntentCase(item);
  const fixture = intentContextFixture(item, attempt);
  const started = Date.now();
  const identity = {
    companyId: fixture.companyId, actorId: opaqueIntentId(attempt, "actor"),
    threadId: opaqueIntentId(attempt, "thread"), turnId: opaqueIntentId(attempt, "turn"),
    sourceId: opaqueIntentId(attempt, "source"),
  };
  const record: IntentAttemptRecord = {
    caseId: item.id, intent: item.intent, mode, status: "running", humanReview: "pending",
    reviewCriteria: item.humanReview, startedAt: new Date(started).toISOString(), identity,
    input: { question: item.fixture.founderMessage, context: "", system: "" },
    before: fixture.snapshot(), rawModelCalls: [], attemptedTools: [], loopEvents: [], proposals: [],
    reply: "", rawModelText: "", inputTokens: 0, outputTokens: 0, usageCoverage: "partial",
    structuralFindings: [], humanConfirmationsSimulated: 0, writerCalls: 0,
    blockedFixtureWrites: 0, cleanup: "pending",
  };
  const trace = (kind: string, value: unknown) => options.trace?.({ kind, at: new Date().toISOString(), value: structuredClone(value) });
  trace("attempt_started", record);
  try {
    record.input.context = await buildCompanyContext(fixture.db, fixture.companyId);
    record.input.system = reviewedSystemFor(record.input.context, identity.sourceId, mode);
    const modelVisible = JSON.stringify(record.input);
    if (modelVisible.includes(item.id) || modelVisible.includes("synthetic_intent_context") || modelVisible.includes(JSON.stringify(item.expected))) {
      throw new Error("Evaluation metadata leaked into model input");
    }
    trace("generation_input", record.input);
    const boundary = createReviewBoundary({
      identity: { companyId: identity.companyId, actorId: identity.actorId, threadId: identity.threadId, turnId: identity.turnId },
      sources: [{ id: identity.sourceId, companyId: identity.companyId, revision: createHash("sha256").update(record.input.question).digest("hex"), text: record.input.question, origin: "founder" }],
      write: async () => { record.writerCalls += 1; throw new Error("Review confirmation is unavailable in an intent check"); },
    });
    const offered = reviewToolsForMode(mode);
    const measured: ModelTurn = async function* (args) {
      const callIndex = record.rawModelCalls.length;
      const call: IntentAttemptRecord["rawModelCalls"][number] = {
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
            const tool = { callIndex, eventIndex, id: event.id, name: event.name, input: structuredClone(event.input), offeredInMode: offered.includes(event.name as typeof offered[number]) };
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
        mode, system: record.input.system,
        history: [{ role: "person", body: record.input.question }],
        turn: measured, priced: false, signal,
        propose: async (payload) => {
          trace("proposal_attempt", payload);
          const refusal = rejectUnavailableCurrentMessageCitation(payload, { id: identity.sourceId, text: record.input.question });
          if (refusal) { trace("proposal_rejected", refusal); return refusal; }
          const duplicate = await rejectExistingOpenWork(fixture.db, identity.companyId, payload);
          if (duplicate) { trace("proposal_rejected", duplicate); return duplicate; }
          const result = boundary.model.propose(payload);
          if (!result.ok) { trace("proposal_rejected", result); throw new Error(result.reason); }
          const existing = record.proposals.findIndex((proposal) => proposal.id === result.proposal.id);
          if (existing === -1) record.proposals.push(result.proposal);
          else record.proposals[existing] = result.proposal;
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
    for (const tool of record.attemptedTools) if (!tool.offeredInMode) record.structuralFindings.push(`Unavailable tool attempted: ${tool.name}`);
    if (record.attemptedTools.length > 1) {
      const seen = new Set<string>();
      for (const tool of record.attemptedTools) {
        const key = JSON.stringify({ name: tool.name, input: tool.input });
        if (seen.has(key)) record.structuralFindings.push(`Repeated tool attempt: ${tool.name}`);
        seen.add(key);
      }
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
