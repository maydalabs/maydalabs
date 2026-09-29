#!/usr/bin/env node
/* Offline historical trace adapter. Node native TypeScript stripping only.
 * No DB, model, network, live route or prompt imports. No confirmation calls.
 */
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createReviewBoundary, REVIEW_CONTRACT_VERSION } from "../lib/osReviewBoundary.ts";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SCRIPT_PATH), "..");
const SOURCES = ["lib/osReviewBoundary.ts", "scripts/replay-maydaos-review.mjs"];
export const HISTORICAL_REPORTS = Object.freeze([
  { directory: "maydaos-baseline-pxTtiQ", sha256: "4c7a0b8ef1e92e8c97f4d457b47e5a10803d4ca128193b89643c5d544619fcc6", suite: "baseline", cases: 12 },
  { directory: "maydaos-baseline-PL8Q2a", sha256: "f41c28d2356f2ff503687ddcbdc26db7ed665c90c91173838abd6f84f3e03483", suite: "work-variations", cases: 4 },
  { directory: "maydaos-baseline-fsBP36", sha256: "9737d45fc6410a03ccebee29092204ea6e2152f0d2d9d792fcb8fd6404a1471f", suite: "faithfulness-variations", cases: 5 },
].map((entry) => Object.freeze(entry)));
export const hashBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const string = (value) => typeof value === "string" && value.trim().length > 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const timestamp = (value) => string(value) && Number.isFinite(Date.parse(value));
const fail = (message) => { throw new Error(message); };

function founderSource(call) {
  const founders = call.input.messages.flatMap((message, messageIndex) =>
    message.role === "user" && typeof message.content === "string" ? [{ text: message.content, messageIndex }] : []);
  const latest = founders.at(-1);
  return latest ? { ...latest, turn: founders.length } : null;
}

/** Strictly completed fixture reports only. This validator does not judge prose. */
export function validateHistoricalReport(report) {
  if (!record(report) || report.schemaVersion !== 1 || report.status !== "completed" ||
      !timestamp(report.startedAt) || !timestamp(report.finishedAt) || Date.parse(report.finishedAt) < Date.parse(report.startedAt)) {
    fail("Replay requires a completed, dated schemaVersion 1 report.");
  }
  if (report.databaseCalls !== 0 || report.paidProviderCalls !== 0 || !string(report.suite) ||
      !string(report.judgeVersion) || !string(report.fixtureContextVersion) || !record(report.source) ||
      !record(report.source.sha256) || !/^[a-f0-9]{64}$/.test(report.source.scenariosSha256 ?? "")) {
    fail("Replay requires isolated fixture provenance and zero original paid-provider/database calls.");
  }
  if (!Array.isArray(report.cases) || !report.cases.length || !record(report.summary) || report.summary.planned !== report.cases.length ||
      report.summary.runtimeErrors !== 0 || report.summary.timedOut !== 0 || report.summary.unfinished !== 0) {
    fail("Report case denominator or completion summary is invalid.");
  }
  const identities = new Set();
  for (const [caseIndex, item] of report.cases.entries()) {
    const at = `case ${caseIndex}`;
    if (!record(item) || !string(item.key) || !Number.isInteger(item.repeat) || item.repeat < 1 ||
        !["checks_passed_human_review_pending", "deterministic_fail"].includes(item.status) ||
        item.humanReview !== "pending" || item.cleanup !== "disposed_verified" || item.tokenAccounting !== "complete" ||
        !timestamp(item.startedAt) || !timestamp(item.finishedAt)) fail(`Incomplete or malformed ${at}.`);
    const identity = JSON.stringify([item.key, item.repeat]);
    if (identities.has(identity)) fail(`Duplicate ${at}.`);
    identities.add(identity);
    if (!Array.isArray(item.failures) || !item.failures.every((v) => typeof v === "string") ||
        !Array.isArray(item.transcript) || !item.transcript.length ||
        !item.transcript.every((v) => record(v) && string(v.person) && typeof v.context === "string" && typeof v.reply === "string") ||
        !record(item.outcome) || typeof item.outcome.reply !== "string" || !Array.isArray(item.outcome.filed) ||
        !Array.isArray(item.outcome.remembered) || typeof item.outcome.statusesChanged !== "boolean" || !Array.isArray(item.events)) {
      fail(`Missing historical text, events or outcome in ${at}.`);
    }
    if (!Array.isArray(item.modelCalls) || !item.modelCalls.length) fail(`No recorded model calls in ${at}.`);
    const founderTurns = new Map();
    for (const [callIndex, call] of item.modelCalls.entries()) {
      if (!record(call) || !record(call.input) || !Array.isArray(call.input.messages) || !call.input.messages.length ||
          !call.input.messages.every((m) => record(m) && ["user", "assistant"].includes(m.role) &&
            (typeof m.content === "string" || Array.isArray(m.content))) || !Array.isArray(call.events) || !call.events.length) {
        fail(`Malformed recorded model call ${callIndex} in ${at}.`);
      }
      const founder = founderSource(call);
      if (!founder || !string(founder.text)) fail(`Missing founder string in model call ${callIndex}, ${at}.`);
      if (founderTurns.has(founder.turn) && founderTurns.get(founder.turn) !== founder.text) fail(`Founder source changed within a historical turn in ${at}.`);
      founderTurns.set(founder.turn, founder.text);
      const toolIds = new Set();
      let doneCount = 0;
      for (const event of call.events) {
        if (!record(event) || !["text", "tool", "done"].includes(event.type)) fail(`Unknown or malformed model event in ${at}.`);
        if (event.type === "text" && typeof event.text !== "string") fail(`Malformed text event in ${at}.`);
        if (event.type === "done") doneCount += 1;
        if (event.type === "tool") {
          if (!string(event.id) || !string(event.name) || !Object.hasOwn(event, "input") || toolIds.has(event.id)) fail(`Malformed or duplicate tool event in model call ${callIndex}, ${at}.`);
          toolIds.add(event.id);
        }
      }
      if (doneCount !== 1 || call.events.at(-1).type !== "done") fail(`Unfinished model call ${callIndex} in ${at}.`);
    }
  }
  const passed = report.cases.filter((c) => c.status === "checks_passed_human_review_pending").length;
  if (report.summary.checksPassedHumanReviewPending !== passed || report.summary.deterministicFailures !== report.cases.length - passed ||
      report.summary.humanReviewed !== 0) fail("Historical summary disagrees with recorded cases.");
}

// Tool IDs repeat across rounds. Only use the immediate next call's appended
// exchange, not a global id search that could attach another tool's receipt.
function historicalReceipts(item, callIndex, event) {
  const call = item.modelCalls[callIndex];
  const next = item.modelCalls[callIndex + 1];
  if (!next || !same(next.input.messages.slice(0, call.input.messages.length), call.input.messages)) return [];
  const offset = call.input.messages.length;
  const invocation = next.input.messages[offset];
  if (invocation?.role !== "assistant" || !Array.isArray(invocation.content) || !invocation.content.some((part) =>
    record(part) && part.type === "tool_use" && part.id === event.id && part.name === event.name && same(part.input, event.input))) return [];
  const message = next.input.messages[offset + 1];
  if (message?.role !== "user" || !Array.isArray(message.content)) return [];
  return message.content.flatMap((part, partIndex) => record(part) && part.type === "tool_result" && part.tool_use_id === event.id
    ? [{ pointer: `/modelCalls/${callIndex + 1}/input/messages/${offset + 1}/content/${partIndex}`, raw: structuredClone(part) }] : []);
}

function counts() {
  return { cases: 0, recordedModelCalls: 0, toolAttempts: 0, workAttempts: 0, knowledgeAttempts: 0,
    workPreviewAttempts: 0, uniqueWorkPreviews: 0, needsReviewDetails: 0, rejectedAttempts: 0, fakeWriterCalls: 0 };
}

/** Pure in-memory replay, exported for synthetic tests. The CLI additionally
 * pins inputs to the three historical report byte hashes above.
 */
export function replayHistoricalReport(report, originalReport) {
  validateHistoricalReport(report);
  if (!record(originalReport) || !string(originalReport.path) || !/^[a-f0-9]{64}$/.test(originalReport.sha256 ?? "")) fail("Missing original report identity.");
  const totals = counts();
  const cases = report.cases.map((item, caseIndex) => {
    const metrics = counts();
    metrics.cases = 1;
    metrics.recordedModelCalls = item.modelCalls.length;
    const boundaries = new Map();
    const previewIdentities = new Set();
    const attempts = [];
    for (const [callIndex, call] of item.modelCalls.entries()) {
      const founder = founderSource(call);
      const identity = {
        actorId: "offline-replay-founder", companyId: `offline-${originalReport.sha256.slice(0, 12)}-${caseIndex}`,
        threadId: `historical-case-${caseIndex}`, turnId: `founder-turn-${founder.turn}`,
      };
      const source = { id: `founder-turn-${founder.turn}`, companyId: identity.companyId,
        revision: hashBytes(founder.text), text: founder.text, origin: "founder" };
      if (!boundaries.has(founder.turn)) boundaries.set(founder.turn, createReviewBoundary({
        identity, sources: [source], write: async () => { metrics.fakeWriterCalls += 1; throw new Error("Historical replay must never save"); },
      }).model);
      const modelCapability = boundaries.get(founder.turn);
      for (const [eventIndex, event] of call.events.entries()) {
        if (event.type !== "tool") continue;
        metrics.toolAttempts += 1;
        const attempt = {
          pointer: `/cases/${caseIndex}/modelCalls/${callIndex}/events/${eventIndex}`,
          modelCallIndex: callIndex, toolEventIndex: eventIndex, toolId: event.id, toolName: event.name,
          rawInput: structuredClone(event.input), historicalReceipts: historicalReceipts(item, callIndex, event).map((receipt) =>
            ({ ...receipt, pointer: `/cases/${caseIndex}${receipt.pointer}` })),
          founderSource: { pointer: `/cases/${caseIndex}/modelCalls/${callIndex}/input/messages/${founder.messageIndex}/content`,
            text: founder.text, sha256: hashBytes(founder.text) },
          humanConfirmationSimulated: false, fakeWriterCalls: 0,
        };
        if (event.name === "remember") {
          metrics.knowledgeAttempts += 1;
          metrics.needsReviewDetails += 1;
          attempts.push({ ...attempt, classification: "needs_review_details", missingFields: ["reviewed scope", "reviewed duration", "reviewed source citations"],
            reason: "Legacy remember input is retained as historical data, not promoted to company knowledge. No scope, duration or confirmation is invented.",
            boundaryInvoked: false });
          continue;
        }
        if (event.name !== "file_work") {
          metrics.rejectedAttempts += 1;
          attempts.push({ ...attempt, classification: "rejected", reason: "unsupported_historical_tool", boundaryInvoked: false });
          continue;
        }
        metrics.workAttempts += 1;
        const input = event.input;
        const allowedFields = ["title", "notes", "lane", "kind", "needs_approval_for"];
        if (!record(input) || Object.keys(input).some((key) => !allowedFields.includes(key))) {
          metrics.rejectedAttempts += 1;
          attempts.push({ ...attempt, classification: "rejected", reason: "unsupported_legacy_work_fields", boundaryInvoked: false });
          continue;
        }
        const adapted = { type: "work", title: input.title, body: input.notes, lane: input.lane, kind: input.kind,
          outwardAction: Object.hasOwn(input, "needs_approval_for") ? input.needs_approval_for : null,
          citations: [{ sourceId: source.id, quote: founder.text }] };
        const adapter = {
          fieldMapping: { title: "title", notes: "body", lane: "lane", kind: "kind", needs_approval_for: "outwardAction" },
          absentOutwardActionMappedToNull: !Object.hasOwn(input, "needs_approval_for"),
          citationAddedBy: "offline_adapter_not_historical_model",
          citationMeaning: "Latest founder string attributed verbatim. This does not establish that the draft claims follow from it or that the request authorized new work.",
          identityMeaning: "Synthetic replay identities only; not authenticated production identities.",
        };
        const result = modelCapability.propose(adapted);
        if (!result.ok) {
          metrics.rejectedAttempts += 1;
          attempts.push({ ...attempt, adapter, adapted, classification: "rejected", reason: result.reason, boundaryInvoked: true });
        } else {
          metrics.workPreviewAttempts += 1;
          previewIdentities.add(`${founder.turn}:${result.proposal.id}`);
          attempts.push({ ...attempt, adapter, adapted, classification: "preview_only", boundaryInvoked: true, preview: result.proposal,
            receipt: "Suggestion only. No Save to Work confirmation was simulated; nothing was saved, approved, sent or completed by this replay." });
        }
      }
    }
    metrics.uniqueWorkPreviews = previewIdentities.size;
    if (metrics.fakeWriterCalls !== 0) fail(`Replay attempted a write in historical case ${caseIndex}.`);
    for (const key of Object.keys(totals)) totals[key] += metrics[key];
    return { key: item.key, repeat: item.repeat,
      original: { reportPath: originalReport.path, reportSha256: originalReport.sha256, pointer: `/cases/${caseIndex}`,
        status: item.status, failures: structuredClone(item.failures), humanReview: item.humanReview,
        transcript: structuredClone(item.transcript), outcome: structuredClone(item.outcome),
        recordedEventsPointer: `/cases/${caseIndex}/events`, recordedEventsSha256: hashBytes(JSON.stringify(item.events)) },
      metrics, attempts };
  });
  return { originalReport: { ...originalReport, suite: report.suite, judgeVersion: report.judgeVersion,
    fixtureContextVersion: report.fixtureContextVersion, source: structuredClone(report.source), summary: structuredClone(report.summary) },
    denominatorMeaning: "All recorded completed cases in this report; tool attempts are counted from model-call events, not from final stored outcomes.",
    metrics: totals, cases };
}

export function exclusiveReportWrite(outputPath, report, inputPaths) {
  const destination = resolve(outputPath);
  if (inputPaths.some((path) => resolve(path) === destination || realpathSync(path) === destination)) fail("Output must never be an input path.");
  // wx also rejects existing symlinks and hard links. No overwrite/force mode.
  writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
}

export function runReplayCli(args) {
  if (args.length !== 5 || args[0] !== "-o" || !args[1] || args.slice(2).some((path) => path.startsWith("-"))) {
    fail("Usage: node scripts/replay-maydaos-review.mjs -o NEW_REPORT.json BASELINE_REPORT.json WORK_VARIATIONS_REPORT.json FAITHFULNESS_REPORT.json");
  }
  const outputPath = resolve(args[1]);
  const sourceHashes = Object.fromEntries(SOURCES.map((path) => [path, hashBytes(readFileSync(resolve(ROOT, path)))]));
  const inputs = args.slice(2).map((path, index) => {
    const absolutePath = realpathSync(path);
    if (absolutePath === outputPath) fail("Output must never be an input path.");
    const bytes = readFileSync(absolutePath);
    const sha256 = hashBytes(bytes);
    const expected = HISTORICAL_REPORTS[index];
    if (sha256 !== expected.sha256) fail(`Input ${index + 1} is not the pinned immutable ${expected.directory}/report.json.`);
    const report = JSON.parse(bytes.toString("utf8"));
    validateHistoricalReport(report);
    if (report.suite !== expected.suite || report.cases.length !== expected.cases) fail("Pinned report suite/denominator mismatch.");
    return { path: absolutePath, sha256, report };
  });
  const result = {
    schemaVersion: 1, kind: "adapted_offline_historical_proposal_boundary_replay", generatedAt: new Date().toISOString(),
    contractVersion: REVIEW_CONTRACT_VERSION, sourceHashes,
    scope: "Adapted replay of saved tool attempts through an isolated proposal-boundary prototype. NOT a new prompt/model loop, rescore, semantic-quality judgment, fine-tuning baseline or live enforcement test.",
    limitations: [
      "Historical replies and receipts describe the old behavior; they are retained, never rewritten as if generated under the new boundary.",
      "Work citations are added by the adapter from the latest founder string. Attribution is not semantic evidence or authorization to create work.",
      "Legacy remember calls lack reviewed knowledge scope/duration/citations and remain needs_review_details. No missing facts or human confirmations are invented.",
      "No model, database, network or paid provider is used. Fake writers must stay unused; reviewer.save is never invoked.",
      "Existing failures and unsupported claims remain unresolved. This replay supplies no readiness percentage or claim that a model learned the new contract.",
      "The in-memory boundary has no durable or restart guarantee and is not integrated into the live desk.",
    ],
    modelCalls: 0, databaseCalls: 0, networkCalls: 0, paidProviderCalls: 0, humanConfirmationsSimulated: 0,
    reports: inputs.map(({ path, sha256, report }) => replayHistoricalReport(report, { path, sha256 })),
    inputHashesRecheckedBeforeWrite: false, sourceHashesRecheckedBeforeWrite: false,
  };
  for (const input of inputs) if (hashBytes(readFileSync(input.path)) !== input.sha256) fail("An input changed during replay; no artifact written.");
  for (const [path, sha256] of Object.entries(sourceHashes)) if (hashBytes(readFileSync(resolve(ROOT, path))) !== sha256) fail("Replay source changed during execution; no artifact written.");
  result.inputHashesRecheckedBeforeWrite = true;
  result.sourceHashesRecheckedBeforeWrite = true;
  // Exclusive creation rejects existing files and symlinks. No mkdir, force,
  // overwrite, editing of originals, or deletion on failure is supported.
  exclusiveReportWrite(outputPath, result, inputs.map((input) => input.path));
  return { outputPath, reports: result.reports.map((report) => ({ suite: report.originalReport.suite, ...report.metrics })) };
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  try {
    console.log(JSON.stringify(runReplayCli(process.argv.slice(2)), null, 2));
    console.log("Offline adapted replay only; original failures unchanged. No human confirmation, model call or database write.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Offline proposal-boundary replay failed.");
    process.exitCode = 1;
  }
}
