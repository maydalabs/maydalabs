import { createHash } from "node:crypto";
import { buildCompanyContext, type Db, type ModelEvent, type ModelTurn } from "../../lib/osCofounder";
import { reviewedSystemFor } from "./osLegacyReviewedSystem";
import { createReviewBoundary, type ReviewSnapshot } from "../../lib/osReviewBoundary";
import { runReviewedTurn, ReviewedTurnError, type ReviewedTurnEvent } from "./osLegacyReviewedTurn";
import type { ReviewRequestMode } from "../../lib/osReviewIntent";
import { withScenarioDeadline } from "../../lib/osScenarioHarness";
import type { Scenario } from "../../lib/osScenarios";
import { PROPOSAL_BASELINE_CASES, type ProposalBaselineCase } from "./osProposalBaselineCases";
import { scenarioFixture } from "./scenarioFixture";

export function opaqueFixtureId(attempt: number, kind: string, ordinal = 0) {
  const hex = createHash("sha256").update(`proposal-baseline/1/${attempt}/${kind}/${ordinal}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function plannedProposalAttempts(selection: { cases?: string[]; limit?: number } = {}) {
  if (selection.cases && (!selection.cases.length || new Set(selection.cases).size !== selection.cases.length || selection.cases.some((key) => !PROPOSAL_BASELINE_CASES.some((item) => item.key === key)))) {
    throw new Error("Case selection contains duplicate or unknown case IDs.");
  }
  if (selection.limit !== undefined && (!Number.isInteger(selection.limit) || selection.limit < 1 || selection.limit > 16)) throw new Error("Limit must be an integer from 1 to 16.");
  const selected = PROPOSAL_BASELINE_CASES.filter((item) => !selection.cases || selection.cases.includes(item.key));
  const attempts = [1, 2].flatMap((repeat) => selected.filter((item) => item.group === "historical-six" && repeat <= item.repetitions).map((item) => ({ item, repeat })))
    .concat(selected.filter((item) => item.group === "new-wording").map((item) => ({ item, repeat: 1 })));
  return selection.limit === undefined ? attempts : attempts.slice(0, selection.limit);
}

/** Read-only wrapper around the narrow historical context-query fixture.
 * Identifiers presented to the model are opaque; evaluation keys remain only
 * in the report. No database library/client/credentials are created here.
 */
export function proposalContextFixture(item: ProposalBaselineCase, attempt: number) {
  const old = scenarioFixture({ ...item.fixture, title: "", expect: {}, humanReviewCriteria: [] } as Scenario);
  const ids = new Map<string, string>([[old.companyId, opaqueFixtureId(attempt, "company")]]);
  for (const [table, rows] of Object.entries(old.snapshot())) {
    rows.forEach((row, index) => { if (typeof row.id === "string" && !ids.has(row.id)) ids.set(row.id, opaqueFixtureId(attempt, table, index)); });
  }
  const reverse = new Map([...ids].map(([a, b]) => [b, a]));
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
        if (["insert", "update", "upsert", "delete"].includes(String(property))) return () => { blockedWrites += 1; throw new Error("Proposal fixture is read-only"); };
        if (property === "then") return (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
          Promise.resolve(query).then((result) => resolve(remap(result)), reject);
        const method = target[String(property)];
        if (typeof method !== "function") throw new Error(`Unsupported fixture operation: ${String(property)}`);
        return (...args: unknown[]) => {
          const mapped = args.map((arg) => typeof arg === "string" ? reverse.get(arg) ?? arg : arg);
          method.apply(target, mapped);
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

type Trace = { kind: string; at: string; value: unknown };
export type ProposalAttemptRecord = {
  key: string; group: string; repeat: number; status: "running" | "completed" | "runtime_error" | "timed_out";
  humanReview: "pending"; reviewCriteria: readonly string[];
  startedAt: string; finishedAt?: string; durationMs?: number;
  identity: { companyId: string; actorId: string; threadId: string; turnId: string; sourceId: string };
  input: { question: string; context: string; system: string };
  before: unknown; after?: unknown; rawModelCalls: { input: unknown; events: ModelEvent[]; error?: { name: string; message: string } }[];
  loopEvents: ReviewedTurnEvent[]; proposals: ReviewSnapshot[]; reply: string; rawModelText: string;
  inputTokens: number; outputTokens: number; usageCoverage: "partial" | "provider_completion_records";
  structuralFindings: string[]; error?: { name: string; message: string };
  humanConfirmationsSimulated: 0; writerCalls: number; blockedFixtureWrites: number; cleanup: "pending" | "disposed_verified" | "failed";
};

const safeError = (error: unknown) => ({ name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message.slice(0, 4000) : "Unknown local runner error" });

export async function runProposalAttempt(options: {
  item: ProposalBaselineCase; repeat: number; attempt: number; turn: ModelTurn; timeoutMs: number; mode?: ReviewRequestMode;
  trace?: (trace: Trace) => void;
}): Promise<ProposalAttemptRecord> {
  const { item, attempt } = options;
  const fixture = proposalContextFixture(item, attempt);
  const started = Date.now();
  const identity = { companyId: fixture.companyId, actorId: opaqueFixtureId(attempt, "actor"), threadId: opaqueFixtureId(attempt, "thread"), turnId: opaqueFixtureId(attempt, "turn"), sourceId: opaqueFixtureId(attempt, "source") };
  const record: ProposalAttemptRecord = {
    key: item.key, group: item.group, repeat: options.repeat, status: "running", humanReview: "pending", reviewCriteria: item.humanReview,
    startedAt: new Date(started).toISOString(), identity,
    input: { question: item.fixture.says[0], context: "", system: "" }, before: fixture.snapshot(), rawModelCalls: [], loopEvents: [], proposals: [], reply: "", rawModelText: "",
    inputTokens: 0, outputTokens: 0, usageCoverage: "partial", structuralFindings: [], humanConfirmationsSimulated: 0, writerCalls: 0, blockedFixtureWrites: 0, cleanup: "pending",
  };
  const trace = (kind: string, value: unknown) => options.trace?.({ kind, at: new Date().toISOString(), value: structuredClone(value) });
  trace("attempt_started", record);
  try {
    if (item.fixture.says.length !== 1) throw new Error("This baseline requires exactly one founder question per attempt.");
    record.input.context = await buildCompanyContext(fixture.db, fixture.companyId);
    if (record.input.context.includes(`fixture-${item.key}`)) throw new Error("Evaluation identity leaked into model context");
    // The archived pre-mode baseline exposed both review tools. Its harness
    // continues to replay that historical setting explicitly.
    const mode = options.mode ?? "both";
    record.input.system = reviewedSystemFor(record.input.context, identity.sourceId, mode);
    trace("generation_input", record.input);
    const boundary = createReviewBoundary({ identity: { companyId: identity.companyId, actorId: identity.actorId, threadId: identity.threadId, turnId: identity.turnId }, sources: [{ id: identity.sourceId, companyId: identity.companyId, revision: createHash("sha256").update(record.input.question).digest("hex"), text: record.input.question, origin: "founder" }],
      write: async () => { record.writerCalls += 1; throw new Error("Review confirmation is unavailable in a proposal-only measurement"); } });
    const measured: ModelTurn = async function* (args) {
      const call: ProposalAttemptRecord["rawModelCalls"][number] = { input: structuredClone({ system: args.system, messages: args.messages, tools: args.tools }), events: [] };
      record.rawModelCalls.push(call); trace("provider_input", { index: record.rawModelCalls.length - 1, input: call.input });
      try {
        for await (const event of options.turn(args)) {
          call.events.push(structuredClone(event));
          if (event.type === "text") record.rawModelText += event.text;
          if (event.type === "done") { record.inputTokens += event.inputTokens; record.outputTokens += event.outputTokens; }
          trace("provider_event", { call: record.rawModelCalls.length - 1, event });
          yield event;
        }
      } catch (error) { call.error = safeError(error); trace("provider_error", call.error); throw error; }
    };
    await withScenarioDeadline(options.timeoutMs, async (signal) => {
      for await (const event of runReviewedTurn({ mode, system: record.input.system, history: [{ role: "person", body: record.input.question }], turn: measured, priced: false, signal,
        propose: async (payload) => {
          trace("proposal_attempt", payload);
          const result = boundary.model.propose(payload);
          if (!result.ok) { trace("proposal_rejected", result); throw new Error(result.reason); }
          const existing = record.proposals.findIndex((p) => p.id === result.proposal.id);
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
      const [minimum, maximum] = item.proposalCounts[type];
      if (count < minimum || count > maximum) record.structuralFindings.push(`${type} proposal count ${count}, expected ${minimum}..${maximum}`);
    }
    for (const event of record.loopEvents) if (event.type === "refused") record.structuralFindings.push(`Tool or proposal refused: ${event.reason}`);
    for (const call of record.rawModelCalls) for (const event of call.events) if (event.type === "tool" && !["propose_work", "propose_knowledge"].includes(event.name)) record.structuralFindings.push(`Unavailable tool attempted: ${event.name}`);
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
    record.finishedAt = new Date().toISOString(); record.durationMs = Date.now() - started;
    trace("attempt_finished", record);
  }
  return record;
}
