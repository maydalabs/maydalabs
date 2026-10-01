/* Offline artifact transformation only. The caller supplies immutable data,
 * a pure judge and a hash function. No model, database, network or file I/O. */
import type { Outcome, Scenario, ScenarioRequest } from "./osScenarios";

export const BASELINE_SOURCE_PATHS = [
  "lib/osCofounder.ts", "lib/osCofounderLocal.ts", "lib/osPersona.ts",
  "lib/osScenarioHarness.ts", "lib/osScenarios.ts",
  "lib/osReviewedTurn.ts", "lib/osReviewIntent.ts", "lib/osReviewEnvelope.ts", "lib/osReviewGuard.ts", "lib/osReviewDate.ts",
  "lib/osReviewProposalFeedback.ts", "lib/osReviewReceipt.ts", "lib/osReviewTextGate.ts", "lib/osReviewBoundary.ts",
  "lib/osReviewCitation.ts", "lib/osReviewDuplicate.ts", "lib/osReviewedMemory.ts", "lib/osReviewedScenarioChecks.ts",
  "tests/helpers/scenarioFixture.ts", "tests/helpers/reviewedScenarioDesk.ts", "tests/cofounder.scenarios.test.ts",
] as const;
/* Failures the judge does not own: side checks of the reviewed loop and the
 * persona judge. A rescore re-judges the outcome and carries these forward. */
const CARRIED_PREFIXES = ["reviewed: ", "persona: "];
const JUDGE_PATH = "lib/osScenarios.ts";
const ELIGIBLE = new Set(["deterministic_fail", "checks_passed_human_review_pending"]);
const STATUSES = new Set([...ELIGIBLE, "timed_out", "runtime_error", "unfinished", "running"]);
type ObjectValue = Record<string, unknown>;
type HashText = (text: string) => string;
type RescoredCase = ObjectValue & {
  originalVerdict: { status: unknown; failures: unknown; humanReview: unknown; reviewCriteria: unknown };
  rescored: boolean; verdictChanged: boolean; rescoreReason: string;
};

function object(value: unknown, label: string): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as ObjectValue;
}
function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) throw new Error(`${label} must be an array of strings.`);
  return value;
}
function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a nonempty string.`);
  return value;
}
function digest(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a SHA-256 digest.`);
  return value;
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(",")}}`;
  return JSON.stringify(value);
}
function inputShape(scenario: Scenario) {
  // A persona and the person's request selection are inputs too: an old
  // report must not be rescored against a manifest whose persona or mode
  // changed under the same key.
  const persona = (scenario as { persona?: unknown }).persona ?? null;
  return { key: scenario.key, company: scenario.company ?? null, says: scenario.says, memory: scenario.memory ?? [], openWork: scenario.openWork ?? [], persona, request: scenario.request ?? null };
}

const REQUEST_MODES = ["ask", "draft", "knowledge", "both"];
const DRAFT_FORMATS = ["email", "reply", "post", "note", "research", "decision"];

/* The same rules as parseReviewRequestIntent (lib/osReviewIntent.ts), inline
 * because this file must stay free of runtime imports for the offline CLI. */
export function validateScenarioRequest(value: unknown, label: string): ScenarioRequest {
  const request = object(value, `${label} request`);
  if (Object.keys(request).length !== 2 || !Object.hasOwn(request, "mode") || !Object.hasOwn(request, "intent")) throw new Error(`${label} request must have exactly mode and intent.`);
  const mode = request.mode;
  if (typeof mode !== "string" || !REQUEST_MODES.includes(mode)) throw new Error(`${label} request mode is invalid.`);
  const intent = object(request.intent, `${label} request intent`);
  if (Object.keys(intent).length !== 2 || !Object.hasOwn(intent, "draftFormat") || !Object.hasOwn(intent, "knowledgeAssertion")) throw new Error(`${label} request intent must have exactly draftFormat and knowledgeAssertion.`);
  const format = intent.draftFormat;
  const assertion = intent.knowledgeAssertion;
  if (format !== null && (typeof format !== "string" || !DRAFT_FORMATS.includes(format))) throw new Error(`${label} request draftFormat is invalid.`);
  if (assertion !== null && (typeof assertion !== "string" || assertion.trim() !== assertion || Array.from(assertion).length < 3 || assertion.length > 2000)) throw new Error(`${label} request knowledgeAssertion is invalid.`);
  if ((mode === "draft" || mode === "both") ? format === null : format !== null) throw new Error(`${label} request draftFormat does not fit its mode.`);
  if ((mode === "ask" || mode === "draft") && assertion !== null) throw new Error(`${label} request knowledgeAssertion does not fit its mode.`);
  return { mode: mode as ScenarioRequest["mode"], intent: { draftFormat: format as ScenarioRequest["intent"]["draftFormat"], knowledgeAssertion: assertion as string | null } };
}

export function validateManifest(value: unknown): Scenario[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Scenario manifest must be a nonempty array.");
  const keys = new Set<string>();
  for (const entry of value) {
    const scenario = object(entry, "Scenario");
    const key = nonempty(scenario.key, "Scenario key");
    if (keys.has(key)) throw new Error(`Duplicate scenario key: ${key}`);
    keys.add(key);
    nonempty(scenario.title, "Scenario title");
    const says = strings(scenario.says, "Scenario questions");
    if (!says.length || says.some((question) => !question.trim())) throw new Error(`Scenario ${key} has no question.`);
    strings(scenario.humanReviewCriteria, "Human review criteria");
    object(scenario.expect, "Scenario expectations");
    if (scenario.request !== undefined) validateScenarioRequest(scenario.request, `Scenario ${key}`);
    if (scenario.company !== undefined) {
      const company = object(scenario.company, "Scenario company");
      nonempty(company.name, "Scenario company.name");
      nonempty(company.whatWeDo, "Scenario company.whatWeDo");
    }
    for (const property of ["memory", "openWork"]) {
      if (scenario[property] === undefined) continue;
      if (!Array.isArray(scenario[property])) throw new Error(`Scenario ${property} must be an array.`);
      for (const raw of scenario[property] as unknown[]) {
        const row = object(raw, `Scenario ${property} row`);
        for (const field of property === "memory" ? ["fact", "kind"] : ["title", "lane", "kind", "status"]) nonempty(row[field], `Scenario ${property}.${field}`);
      }
    }
  }
  return value as Scenario[];
}

function baseline(value: unknown, manifest: Scenario[], hashText: HashText) {
  const report = object(value, "Baseline report");
  if (report.schemaVersion !== 1 || report.status !== "completed") throw new Error("Only a completed schemaVersion 1 baseline may be snapshotted or rescored.");
  const judgeVersion = nonempty(report.judgeVersion, "Original judge version");
  const source = object(report.source, "Original source metadata");
  const hashes = object(source.sha256, "Original source hashes");
  for (const path of BASELINE_SOURCE_PATHS) digest(hashes[path], `Original source ${path}`);
  const manifestDigest = digest(source.scenariosSha256, "Original scenario manifest hash");
  if (hashText(JSON.stringify(manifest)) !== manifestDigest) throw new Error("Original scenario manifest hash does not match the immutable baseline.");
  const repeats = object(report.settings, "Original settings").repeats;
  if (typeof repeats !== "number" || !Number.isInteger(repeats) || repeats < 1 || repeats > 20) throw new Error("Original repetition count is invalid.");
  if (!Array.isArray(report.cases) || report.cases.length !== repeats * manifest.length) throw new Error("Baseline case count does not match manifest × repetitions.");
  const seen = new Set<string>();
  const cases = report.cases.map((raw) => {
    const record = object(raw, "Baseline case");
    const scenario = manifest.find((entry) => entry.key === record.key);
    if (!scenario || typeof record.repeat !== "number" || !Number.isInteger(record.repeat) || record.repeat < 1 || record.repeat > repeats) throw new Error("Unknown scenario or invalid repetition in baseline.");
    const identity = `${record.key}#${record.repeat}`;
    if (seen.has(identity)) throw new Error(`Duplicate baseline case: ${identity}`);
    seen.add(identity);
    if (!STATUSES.has(String(record.status))) throw new Error(`Unknown baseline status: ${identity}`);
    strings(record.failures, "Original failures");
    strings(record.reviewCriteria, "Original review criteria");
    if (record.humanReview !== "pending") throw new Error("Offline automatic rescoring cannot replace a human review.");
    if (!Array.isArray(record.transcript)) throw new Error(`Missing transcript: ${identity}`);
    if (record.transcript.length > scenario.says.length) throw new Error(`Too many transcript turns: ${identity}`);
    record.transcript.forEach((turn, index) => {
      if (object(turn, "Transcript turn").person !== scenario.says[index]) throw new Error(`Question differs from original scenario: ${identity}`);
    });
    if (ELIGIBLE.has(String(record.status))) {
      if (record.tokenAccounting !== "complete" || record.transcript.length !== scenario.says.length) throw new Error(`Completed case has incomplete accounting/transcript: ${identity}`);
      validateOutcome(record.outcome);
      const reply = record.transcript.map((turn) => {
        const body = object(turn, "Transcript turn").reply;
        if (typeof body !== "string") throw new Error("Transcript reply must be a string.");
        return body;
      }).join("\n");
      if (reply !== (record.outcome as Outcome).reply) throw new Error(`Outcome reply differs from transcript: ${identity}`);
    }
    return record;
  });
  return { report, source, hashes, manifestDigest, judgeVersion, repeats, cases };
}

function validateOutcome(value: unknown): asserts value is Outcome {
  const outcome = object(value, "Completed outcome");
  if (typeof outcome.reply !== "string" || typeof outcome.statusesChanged !== "boolean") throw new Error("Completed outcome has invalid reply/status data.");
  strings(outcome.remembered, "Remembered facts");
  if (!Array.isArray(outcome.filed)) throw new Error("Filed outcome must be an array.");
  for (const entry of outcome.filed) {
    const item = object(entry, "Filed outcome");
    for (const field of ["title", "lane"]) if (typeof item[field] !== "string") throw new Error(`Filed outcome ${field} must be a string.`);
    if (item.required_action !== null && typeof item.required_action !== "string") throw new Error("Filed action must be a string or null.");
    for (const field of ["notes", "kind", "status"]) if (item[field] !== undefined && typeof item[field] !== "string") throw new Error(`Filed outcome ${field} is invalid.`);
  }
}

function checkSources(original: ObjectValue, current: Record<string, string>, includeJudge: boolean) {
  const checked: Record<string, string> = {};
  for (const path of BASELINE_SOURCE_PATHS) {
    digest(current[path], `Current source ${path}`);
    if (path === JUDGE_PATH && !includeJudge) continue;
    if (original[path] !== current[path]) throw new Error(`Source changed since generation: ${path}`);
    checked[path] = current[path];
  }
  return checked;
}

export function snapshotBaselineManifest(report: unknown, manifestValue: unknown, options: { judgeVersion: string; sourceHashes: Record<string, string>; hashText: HashText }): string {
  const manifest = validateManifest(manifestValue);
  const original = baseline(report, manifest, options.hashText);
  if (original.judgeVersion !== options.judgeVersion) throw new Error("Judge version changed before the original manifest was captured.");
  checkSources(original.hashes, options.sourceHashes, true);
  // Exact serialization: adding pretty-printing/newline changes this file's
  // byte digest, which intentionally equals source.scenariosSha256.
  return JSON.stringify(manifest);
}

function failureKinds(cases: ObjectValue[]) {
  const has = (record: ObjectValue, test: (failure: string) => boolean) => Array.isArray(record.failures) && record.failures.some((f) => typeof f === "string" && test(f));
  return {
    judge: cases.filter((record) => has(record, (f) => !CARRIED_PREFIXES.some((prefix) => f.startsWith(prefix)))).length,
    reviewed: cases.filter((record) => has(record, (f) => f.startsWith("reviewed: "))).length,
    persona: cases.filter((record) => has(record, (f) => f.startsWith("persona: "))).length,
  };
}

function summary(cases: ObjectValue[]) {
  return {
    planned: cases.length,
    checksPassedHumanReviewPending: cases.filter((record) => record.status === "checks_passed_human_review_pending").length,
    deterministicFailures: cases.filter((record) => record.status === "deterministic_fail").length,
    runtimeErrors: cases.filter((record) => record.status === "runtime_error").length,
    timedOut: cases.filter((record) => record.status === "timed_out").length,
    unfinished: cases.filter((record) => ["unfinished", "running"].includes(String(record.status))).length,
    humanReviewed: 0,
    failureKinds: failureKinds(cases),
  };
}

export function rescoreBaseline(reportValue: unknown, originalManifestValue: unknown, options: {
  currentManifest: unknown; judgeVersion: string; sourceHashes: Record<string, string>;
  originalReportPath: string; originalReportSha256: string; generatedAt: string;
  hashText: HashText; judge: (scenario: Scenario, outcome: Outcome) => string[];
}) {
  const originalManifest = validateManifest(originalManifestValue);
  const currentManifest = validateManifest(options.currentManifest);
  const original = baseline(reportValue, originalManifest, options.hashText);
  const checkedSources = checkSources(original.hashes, options.sourceHashes, false);
  if (originalManifest.length !== currentManifest.length) throw new Error("Scenario inputs changed: manifest size differs.");
  for (const scenario of originalManifest) {
    const current = currentManifest.find((entry) => entry.key === scenario.key);
    if (!current || stable(inputShape(scenario)) !== stable(inputShape(current))) throw new Error(`Scenario inputs changed: ${scenario.key}`);
  }
  digest(options.originalReportSha256, "Original report hash");
  nonempty(options.judgeVersion, "Current judge version");
  const currentManifestHash = options.hashText(JSON.stringify(currentManifest));
  const instrumentChanged = original.hashes[JUDGE_PATH] !== options.sourceHashes[JUDGE_PATH] || original.manifestDigest !== currentManifestHash;
  if (instrumentChanged && original.judgeVersion === options.judgeVersion) throw new Error("Changed measuring instrument requires a new judge version.");
  const cases = original.cases.map((sourceCase): RescoredCase => {
    const record = structuredClone(sourceCase);
    const current = currentManifest.find((scenario) => scenario.key === record.key)!;
    const eligible = ELIGIBLE.has(String(record.status));
    const previous = { status: record.status, failures: structuredClone(record.failures), humanReview: record.humanReview, reviewCriteria: structuredClone(record.reviewCriteria) };
    if (eligible) {
      // The judge's verdict is recomputed; the side checks' are carried: they
      // were made on the saved outcome too, by instruments this file does not hold.
      const carried = strings(previous.failures, "Original failures").filter((f) => CARRIED_PREFIXES.some((prefix) => f.startsWith(prefix)));
      const failures = [...strings(options.judge(structuredClone(current), structuredClone(record.outcome as Outcome)), "Corrected judge failures"), ...carried];
      record.status = failures.length ? "deterministic_fail" : "checks_passed_human_review_pending";
      record.failures = failures;
      record.reviewCriteria = structuredClone(current.humanReviewCriteria);
      record.humanReview = "pending";
    }
    return {
      ...record,
      originalVerdict: previous,
      rescored: eligible,
      verdictChanged: eligible && previous.status !== record.status,
      rescoreReason: eligible ? "Corrected measuring instrument applied to identical saved outcome; no new generation." : "Original runtime/timeout/unfinished state preserved; no automatic verdict created.",
    };
  });
  return {
    schemaVersion: 1, artifactType: "offline_baseline_rescore", generatedAt: options.generatedAt,
    interpretation: "Measurement correction on identical saved outputs. Not a new run, model improvement, training result, human review or production validation.",
    modelCalls: 0, databaseCalls: 0,
    originalReport: { path: options.originalReportPath, sha256: options.originalReportSha256 },
    originalJudge: { version: original.judgeVersion, sourceSha256: original.hashes[JUDGE_PATH], manifestSha256: original.manifestDigest },
    correctedJudge: { version: options.judgeVersion, sourceSha256: options.sourceHashes[JUDGE_PATH], manifestSha256: currentManifestHash },
    compatibility: { inputsUnchanged: true, checkedSourceHashes: checkedSources, originalManifest, currentManifest },
    originalRun: { startedAt: original.report.startedAt, finishedAt: original.report.finishedAt, settings: original.report.settings, model: original.report.model, generation: original.report.generation, source: original.source, scope: original.report.scope },
    originalSummary: summary(original.cases), correctedSummary: summary(cases), cases,
  };
}
