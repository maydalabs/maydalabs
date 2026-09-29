import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { it } from "vitest";
import { localTurn } from "../lib/osCofounderLocal";
import { OS_TRUSTED_INTENT_VERSION } from "../lib/osTrustedIntentCases";
import { preflightLocalModel, scenarioSettings } from "../lib/osScenarioHarness";
import { assertTrustedIntentSourceSnapshot, TRUSTED_INTENT_INSTRUMENT_VERSION } from "../scripts/run-maydaos-trusted-intent.mjs";
import { plannedTrustedIntentCases, runTrustedIntentAttempt, type TrustedIntentAttemptRecord } from "./helpers/osTrustedIntentHarness";

const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const dimensions = ["requested_outcome", "useful_content", "factual_faithfulness", "knowledge_boundary", "source_meaning", "honest_state", "clarity"];
type Snapshot = { capturedAt: string; paths: string[]; hashes: Record<string, string> };
type ModelSnapshot = { runtime: string; version: string; model: string; digest: string; size: number };

function parseSnapshot<T>(value: string | undefined, label: string): T {
  if (!value) throw new Error(`Missing pre-import ${label} snapshot; use the opt-in launcher`);
  return JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;
}

it.skipIf(process.env.MAYDAOS_TRUSTED_INTENT_RUN !== "1")("opt-in fictional trusted-intent regression check; human judgment stays pending", async () => {
  if (process.env.VERCEL) throw new Error("Local-only trusted-intent check");
  const projectRoot = process.cwd();
  const source = parseSnapshot<Snapshot>(process.env.MAYDAOS_TRUSTED_INTENT_SOURCE, "source");
  const modelBeforeImport = parseSnapshot<ModelSnapshot>(process.env.MAYDAOS_TRUSTED_INTENT_MODEL, "model");
  assertTrustedIntentSourceSnapshot(projectRoot, source);
  const settings = scenarioSettings({
    ...process.env, MAYDAOS_SCENARIO_RUN: "1", MAYDAOS_SCENARIO_MODEL: "local",
    MAYDAOS_SCENARIO_REPEATS: "2", MAYDAOS_SCENARIO_TIMEOUT_MS: "600000",
  });
  if (settings.model !== "qwen3:14b" || modelBeforeImport.model !== settings.model) {
    throw new Error("Trusted-intent model changed from the pre-import local snapshot");
  }
  const cases = plannedTrustedIntentCases();
  const plan = [1, 2].flatMap((pass) => cases.map((item) => ({ pass, item })));
  if (cases.length !== 6 || plan.length !== 12) throw new Error("The trusted regression plan must be six cases run twice");

  const abidin = resolve(projectRoot, "../abidin");
  const parent = resolve(abidin, "output/mayda/maydaos-baselines");
  execFileSync("git", ["check-ignore", "--quiet", "output/mayda/maydaos-baselines/trusted-intent-check-test"], { cwd: abidin });
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  const folder = mkdtempSync(join(parent, "maydaos-trusted-intent-"));
  const reportPath = join(folder, "report.json");
  const eventsPath = join(folder, "events.jsonl");
  const reviewPath = join(folder, "review-sheet.json");
  const lockPath = join(tmpdir(), "maydaos-local-scenario-run.lock");
  const lockToken = `${process.pid}:${folder}`;
  let ownsLock = false;
  const report: Record<string, unknown> & { cases: TrustedIntentAttemptRecord[]; status: string } = {
    schemaVersion: 1, kind: "review_first_trusted_intent_regression", intentCasesVersion: OS_TRUSTED_INTENT_VERSION,
    instrumentVersion: TRUSTED_INTENT_INSTRUMENT_VERSION,
    scope: "Two predeclared serial passes of six previously exposed fictional S1i cases, reused unchanged as regressions. In-memory proposals only; not SQL, auth, durable storage, external action, or owner acceptance.",
    status: "preflight", startedAt: new Date().toISOString(), fullPlanned: plan.length,
    selectedPlanned: plan.length, cases: [], databaseCalls: 0, paidProviderCalls: 0,
    humanConfirmationsSimulated: 0, humanReview: "pending",
    plannedAttempts: plan.map(({ pass, item }, index) => ({ attempt: index + 1, pass, caseId: item.id, intent: item.intent, mode: item.mode, typedIntent: item.typedIntent })),
  };
  const save = () => {
    const temporary = `${reportPath}.tmp`;
    writeFileSync(temporary, JSON.stringify(report, null, 2), { mode: 0o600 });
    renameSync(temporary, reportPath);
  };
  const saveReviewSheet = () => {
    const rows = report.cases.map((row, index) => ({
      attempt: index + 1, pass: plan[index].pass, caseId: row.caseId, intent: row.intent,
      mode: row.mode, typedIntent: row.typedIntent, ownerAcceptance: "pending", reviewer: null,
      dimensions: Object.fromEntries(dimensions.map((key) => [key, { verdict: "unreviewed", excerpts: [], reason: "" }])),
      caseCriteria: row.reviewCriteria,
    }));
    const temporary = `${reviewPath}.tmp`;
    writeFileSync(temporary, JSON.stringify(rows, null, 2), { mode: 0o600 });
    renameSync(temporary, reviewPath);
  };
  save();
  console.log(`Trusted-intent evidence: ${folder}`);
  try {
    const descriptor = openSync(lockPath, "wx", 0o600);
    ownsLock = true;
    try { writeFileSync(descriptor, JSON.stringify({ token: lockToken, pid: process.pid, reportPath, startedAt: report.startedAt })); }
    finally { closeSync(descriptor); }
    const unchanged = () => assertTrustedIntentSourceSnapshot(projectRoot, source);
    unchanged();
    const model = await preflightLocalModel(settings);
    if (model.digest !== modelBeforeImport.digest || model.size !== modelBeforeImport.size || model.version !== modelBeforeImport.version) {
      throw new Error("Local model metadata changed since the pre-import snapshot");
    }
    unchanged();
    const manifest = {
      version: OS_TRUSTED_INTENT_VERSION, instrumentVersion: TRUSTED_INTENT_INSTRUMENT_VERSION, frozenAt: source.capturedAt,
      head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      workingTree: execFileSync("git", ["status", "--short"], { encoding: "utf8" }).trim(),
      sourceHashesPreImport: source.hashes, sourcePaths: source.paths,
      hashScope: "All lib/os*.ts; co-founder/review routes, composer, intent fields, copy and typed-intent migration; evaluator, fixtures, candidate and runner; TypeScript/Vitest config, dependency lockfile and Vitest entrypoint/package metadata. Not a bytewise audit of all installed node_modules.",
      settings, modelPreImport: modelBeforeImport, modelAtRunStart: model,
      generation: { num_predict: 2000, sampling: "Installed-model defaults; no fixed seed or quality-trend claim" },
      plannedAttempts: report.plannedAttempts, fullCases: cases,
      caseVersionNote: "Version .2 changes exposure metadata only; the six case objects match the frozen S1i .1 manifest.",
      disclosure: "Case IDs, expected counts and rubrics are evaluator metadata only. The model receives fictional context/question and selected controls, including a separate founder assertion when supplied; it receives no source ID. The trusted loop receives the opaque current-message source separately and builds citations on the host.",
      protocol: "Six exposed regression cases, two complete serial passes, no case selection, replacement retry or tuning between attempts. Any failure stays in its original denominator.",
      comparison: "This repair check reuses exposed S1i cases. It is not an unseen holdout, comparable success-rate trend, durable save test or sellability estimate.",
    };
    writeFileSync(join(folder, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx", mode: 0o600 });
    writeFileSync(eventsPath, "", { flag: "wx", mode: 0o600 });
    report.manifestSha256 = sha(readFileSync(join(folder, "manifest.json")));
    report.model = model;
    report.status = "running";
    save();
    const turn = localTurn(settings);
    for (const [index, { pass, item }] of plan.entries()) {
      unchanged();
      const currentModel = await preflightLocalModel(settings);
      if (currentModel.digest !== modelBeforeImport.digest || currentModel.size !== modelBeforeImport.size || currentModel.version !== modelBeforeImport.version) {
        throw new Error("Local model metadata changed before trusted-intent attempt");
      }
      unchanged();
      appendFileSync(eventsPath, `${JSON.stringify({ kind: "model_preflight", attempt: index + 1, pass, caseId: item.id, at: new Date().toISOString(), model: currentModel })}\n`, { mode: 0o600 });
      const result = await runTrustedIntentAttempt({
        item, attempt: index + 1, turn, timeoutMs: settings.timeoutMs,
        trace: (event) => appendFileSync(eventsPath, `${JSON.stringify({ attempt: index + 1, pass, caseId: item.id, ...event })}\n`, { mode: 0o600 }),
      });
      report.cases.push(result);
      save();
      saveReviewSheet();
      console.log(`${item.id} pass ${pass}: ${result.status}; structural findings=${result.structuralFindings.length}; ${result.durationMs}ms; human review pending`);
      if (result.cleanup !== "disposed_verified" || result.writerCalls || result.blockedFixtureWrites || JSON.stringify(result.before) !== JSON.stringify(result.after)) {
        throw new Error("Trusted-intent fixture integrity failed; remaining cases not run");
      }
      const afterModel = await preflightLocalModel(settings);
      if (afterModel.digest !== modelBeforeImport.digest || afterModel.size !== modelBeforeImport.size || afterModel.version !== modelBeforeImport.version) {
        throw new Error("Local model metadata changed during trusted-intent attempt");
      }
      appendFileSync(eventsPath, `${JSON.stringify({ kind: "model_postflight", attempt: index + 1, pass, caseId: item.id, at: new Date().toISOString(), model: afterModel })}\n`, { mode: 0o600 });
      unchanged();
    }
    report.status = "completed";
    report.finishedAt = new Date().toISOString();
    report.summary = {
      planned: plan.length, completed: report.cases.filter((row) => row.status === "completed").length,
      runtimeErrors: report.cases.filter((row) => row.status === "runtime_error").length,
      timedOut: report.cases.filter((row) => row.status === "timed_out").length,
      unfinished: plan.length - report.cases.length,
      structurallyClearHumanReviewPending: report.cases.filter((row) => row.status === "completed" && row.structuralFindings.length === 0).length,
      withStructuralFindings: report.cases.filter((row) => row.structuralFindings.length > 0).length,
      modelCalls: report.cases.reduce((sum, row) => sum + row.rawModelCalls.length, 0),
      attemptedTools: report.cases.reduce((sum, row) => sum + row.attemptedTools.length, 0),
      stagedProposals: report.cases.reduce((sum, row) => sum + row.proposals.length, 0), humanAccepted: 0,
    };
    report.eventsSha256 = sha(readFileSync(eventsPath));
    report.reviewSheetSha256 = sha(readFileSync(reviewPath));
    report.preImportSourceAndModelRechecked = true;
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
