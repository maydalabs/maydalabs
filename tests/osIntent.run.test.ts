import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { it } from "vitest";
import { localTurn } from "../lib/osCofounderLocal";
import { OS_INTENT_CASES_VERSION } from "../lib/osIntentCases";
import { preflightLocalModel, scenarioSettings } from "../lib/osScenarioHarness";
import { modeForIntentCase, plannedIntentCases, runIntentAttempt, type IntentAttemptRecord } from "./helpers/osIntentHarness";

const sources = [
  "lib/os.ts", "lib/osCofounder.ts", "lib/osCofounderLocal.ts", "lib/osIntentCases.ts",
  "lib/osReviewBoundary.ts", "lib/osReviewCitation.ts", "lib/osReviewIntent.ts", "lib/osReviewedMemory.ts",
  "lib/osReviewedTurn.ts", "lib/osScenarioHarness.ts", "lib/osScenarios.ts",
  "tests/helpers/scenarioFixture.ts", "tests/helpers/osIntentHarness.ts",
  "tests/osIntentHarness.test.ts", "tests/osIntent.run.test.ts",
  "scripts/run-maydaos-intent-check.mjs",
];
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const dimensions = ["requested_outcome", "useful_content", "factual_faithfulness", "knowledge_boundary", "source_meaning", "honest_state", "clarity"];

it.skipIf(process.env.MAYDAOS_INTENT_CHECK_RUN !== "1")("opt-in frozen local intent check; no automatic semantic pass", async () => {
  if (process.env.VERCEL) throw new Error("Local-only intent check");
  const attempts = plannedIntentCases();
  const settings = scenarioSettings({
    ...process.env, MAYDAOS_SCENARIO_RUN: "1", MAYDAOS_SCENARIO_MODEL: "local",
    MAYDAOS_SCENARIO_REPEATS: "1", MAYDAOS_SCENARIO_TIMEOUT_MS: "600000",
  });
  if (settings.model !== "qwen3:14b") throw new Error("This frozen intent check uses only the already-installed qwen3:14b model");
  const abidin = resolve(process.cwd(), "../abidin");
  const parent = resolve(abidin, "output/mayda/maydaos-baselines");
  execFileSync("git", ["check-ignore", "--quiet", "output/mayda/maydaos-baselines/intent-check-test"], { cwd: abidin });
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  const folder = mkdtempSync(join(parent, "maydaos-intent-check-"));
  const reportPath = join(folder, "report.json");
  const eventsPath = join(folder, "events.jsonl");
  const reviewPath = join(folder, "review-sheet.json");
  const lockPath = join(tmpdir(), "maydaos-local-scenario-run.lock");
  const lockToken = `${process.pid}:${folder}`;
  let ownsLock = false;
  const report: Record<string, unknown> & { cases: IntentAttemptRecord[]; status: string } = {
    schemaVersion: 1, kind: "review_first_intent_check", intentCasesVersion: OS_INTENT_CASES_VERSION,
    scope: "One local-model pass over eleven fictional cases with selected review modes and in-memory proposals. Not SQL, auth, durable storage, external action or human acceptance.",
    status: "preflight", startedAt: new Date().toISOString(), fullPlanned: attempts.length,
    selectedPlanned: attempts.length, cases: [], databaseCalls: 0, paidProviderCalls: 0,
    humanConfirmationsSimulated: 0, humanReview: "pending",
    plannedAttempts: attempts.map((item, index) => ({ attempt: index + 1, caseId: item.id, intent: item.intent, mode: modeForIntentCase(item) })),
  };
  const save = () => {
    const temporary = `${reportPath}.tmp`;
    writeFileSync(temporary, JSON.stringify(report, null, 2), { mode: 0o600 });
    renameSync(temporary, reportPath);
  };
  const saveReviewSheet = () => {
    const rows = report.cases.map((row) => ({
      caseId: row.caseId, intent: row.intent, mode: row.mode, ownerAcceptance: "pending", reviewer: null,
      dimensions: Object.fromEntries(dimensions.map((key) => [key, { verdict: "unreviewed", excerpts: [], reason: "" }])),
      caseCriteria: row.reviewCriteria,
    }));
    const temporary = `${reviewPath}.tmp`;
    writeFileSync(temporary, JSON.stringify(rows, null, 2), { mode: 0o600 });
    renameSync(temporary, reviewPath);
  };
  save();
  console.log(`Intent-check evidence: ${folder}`);
  try {
    const descriptor = openSync(lockPath, "wx", 0o600);
    ownsLock = true;
    try {
      writeFileSync(descriptor, JSON.stringify({ token: lockToken, pid: process.pid, reportPath, startedAt: report.startedAt }));
    } finally { closeSync(descriptor); }
    const sourceHashes = Object.fromEntries(sources.map((path) => [path, sha(readFileSync(path))]));
    const unchanged = () => {
      for (const [path, digest] of Object.entries(sourceHashes)) {
        if (sha(readFileSync(path)) !== digest) throw new Error(`Frozen source changed during intent check: ${path}`);
      }
    };
    const model = await preflightLocalModel(settings);
    unchanged();
    const manifest = {
      version: OS_INTENT_CASES_VERSION, frozenAt: new Date().toISOString(),
      head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      workingTree: execFileSync("git", ["status", "--short"], { encoding: "utf8" }).trim(),
      sourceHashes, settings, model,
      generation: { num_predict: 2000, sampling: "Installed-model defaults; no fixed seed or automatic quality trend claim" },
      plannedAttempts: report.plannedAttempts, fullCases: attempts,
      coverageExtension: "Before the first model run, the read-only instrument review added explicit modes to the original nine cases and two independently authored cases: Draft mode with only an existing-item send request, and Both mode with one new draft plus one separately scoped durable fact. The original nine questions, expected counts and human criteria were not changed; the planned denominator is eleven.",
      disclosure: "Case IDs, expected counts and human rubrics are evaluator metadata only; generation receives only fictional question, selected review mode, opaque source ID and fictional company context.",
      protocol: "One predeclared serial pass; failures, timeouts and incomplete attempts retain their original denominator. No replacement retries or tuning between attempts.",
    };
    writeFileSync(join(folder, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx", mode: 0o600 });
    writeFileSync(eventsPath, "", { flag: "wx", mode: 0o600 });
    report.manifestSha256 = sha(readFileSync(join(folder, "manifest.json")));
    report.model = model;
    report.status = "running";
    save();
    const turn = localTurn(settings);
    for (const [index, item] of attempts.entries()) {
      unchanged();
      const result = await runIntentAttempt({
        item, attempt: index + 1, turn, timeoutMs: settings.timeoutMs,
        trace: (event) => appendFileSync(eventsPath, `${JSON.stringify({ attempt: index + 1, caseId: item.id, ...event })}\n`, { mode: 0o600 }),
      });
      report.cases.push(result);
      save();
      saveReviewSheet();
      console.log(`${item.id} (${result.mode}): ${result.status}; structural findings=${result.structuralFindings.length}; ${result.durationMs}ms; human review pending`);
      if (result.cleanup !== "disposed_verified" || result.writerCalls || result.blockedFixtureWrites || JSON.stringify(result.before) !== JSON.stringify(result.after)) {
        throw new Error("Intent fixture integrity failed; remaining cases not run");
      }
      unchanged();
    }
    report.status = "completed";
    report.finishedAt = new Date().toISOString();
    report.summary = {
      planned: attempts.length, completed: report.cases.filter((row) => row.status === "completed").length,
      runtimeErrors: report.cases.filter((row) => row.status === "runtime_error").length,
      timedOut: report.cases.filter((row) => row.status === "timed_out").length,
      unfinished: attempts.length - report.cases.length,
      structurallyClearHumanReviewPending: report.cases.filter((row) => row.status === "completed" && row.structuralFindings.length === 0).length,
      withStructuralFindings: report.cases.filter((row) => row.structuralFindings.length > 0).length,
      modelCalls: report.cases.reduce((sum, row) => sum + row.rawModelCalls.length, 0),
      attemptedTools: report.cases.reduce((sum, row) => sum + row.attemptedTools.length, 0),
      stagedProposals: report.cases.reduce((sum, row) => sum + row.proposals.length, 0),
      humanAccepted: 0,
    };
    report.eventsSha256 = sha(readFileSync(eventsPath));
    report.reviewSheetSha256 = sha(readFileSync(reviewPath));
    report.sourceHashesRechecked = true;
    save();
  } catch (error) {
    if (report.status !== "completed") {
      report.status = "runner_error_or_incomplete";
      report.error = error instanceof Error ? error.message : "Unknown error";
      report.finishedAt = new Date().toISOString();
      save();
      saveReviewSheet();
    }
    throw error;
  } finally {
    if (ownsLock) {
      const owner = JSON.parse(readFileSync(lockPath, "utf8")) as { token: string };
      if (owner.token !== lockToken) throw new Error("Model lock ownership changed; not removing it");
      unlinkSync(lockPath);
    }
    console.log(`Evidence retained: ${reportPath}. Structural results are not a semantic verdict; owner review remains pending.`);
  }
}, 2_000_000_000);
