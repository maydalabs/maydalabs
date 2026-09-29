import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { localTurn } from "../lib/osCofounderLocal";
import { preflightLocalModel, scenarioSettings } from "../lib/osScenarioHarness";
import { PROPOSAL_BASELINE_VERSION, PROPOSAL_BASELINE_CASES } from "./helpers/osProposalBaselineCases";
import { plannedProposalAttempts, runProposalAttempt, type ProposalAttemptRecord } from "./helpers/osProposalBaselineHarness";

const sources = ["lib/os.ts", "lib/osCofounder.ts", "lib/osCofounderLocal.ts", "lib/osReviewedTurn.ts", "lib/osReviewedMemory.ts", "lib/osReviewBoundary.ts", "lib/osScenarioHarness.ts", "lib/osScenarios.ts", "tests/helpers/scenarioFixture.ts", "tests/helpers/osProposalBaselineCases.ts", "tests/helpers/osProposalBaselineHarness.ts", "tests/osProposalBaseline.run.test.ts", "scripts/run-maydaos-proposal-baseline.mjs"];
const sha = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");

it.skipIf(process.env.MAYDAOS_PROPOSAL_BASELINE_RUN !== "1")("opt-in local proposal-only baseline; no human quality verdict", async () => {
  if (process.env.VERCEL) throw new Error("Local-only proposal baseline");
  const raw = JSON.parse(process.env.MAYDAOS_PROPOSAL_BASELINE_SELECTION ?? "{}") as { cases?: string[]; limit?: number; timeoutMs?: number };
  const attempts = plannedProposalAttempts({ cases: raw.cases?.length ? raw.cases : undefined, limit: raw.limit });
  const settings = scenarioSettings({ ...process.env, MAYDAOS_SCENARIO_RUN: "1", MAYDAOS_SCENARIO_MODEL: "local", MAYDAOS_SCENARIO_REPEATS: "1", MAYDAOS_SCENARIO_TIMEOUT_MS: String(raw.timeoutMs ?? 600_000) });
  if (settings.model !== "qwen3:14b") throw new Error("This preregistered baseline is restricted to the already-installed qwen3:14b model");
  const abidin = resolve(process.cwd(), "../abidin");
  const parent = resolve(abidin, "output/mayda/maydaos-baselines");
  execFileSync("git", ["check-ignore", "--quiet", "output/mayda/maydaos-baselines/proposal-baseline-test"], { cwd: abidin });
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  const folder = mkdtempSync(join(parent, "maydaos-proposal-baseline-"));
  const reportPath = join(folder, "report.json");
  const eventsPath = join(folder, "events.jsonl");
  const lockPath = join(tmpdir(), "maydaos-local-scenario-run.lock");
  const lockToken = `${process.pid}:${folder}`;
  let ownsLock = false;
  const report: Record<string, unknown> & { cases: ProposalAttemptRecord[] } = {
    schemaVersion: 1, kind: "review_first_proposal_behavior_baseline", baselineVersion: PROPOSAL_BASELINE_VERSION,
    scope: "Real local model / read-only fictional context / in-memory proposal capture; not SQL, auth, durable storage, external action or human acceptance",
    status: "preflight", startedAt: new Date().toISOString(), selection: raw, fullPlanned: 16, selectedPlanned: attempts.length,
    cases: [], databaseCalls: 0, paidProviderCalls: 0, humanConfirmationsSimulated: 0, humanReview: "pending",
    plannedAttempts: attempts.map(({ item, repeat }) => ({ key: item.key, group: item.group, repeat })),
  };
  const save = () => { const path = `${reportPath}.tmp`; writeFileSync(path, JSON.stringify(report, null, 2), { mode: 0o600 }); renameSync(path, reportPath); };
  save(); console.log(`Proposal baseline evidence: ${folder}`);
  try {
    const descriptor = openSync(lockPath, "wx", 0o600); ownsLock = true;
    try { writeFileSync(descriptor, JSON.stringify({ token: lockToken, pid: process.pid, reportPath, startedAt: report.startedAt })); } finally { closeSync(descriptor); }
    const sourceHashes = Object.fromEntries(sources.map((path) => [path, sha(readFileSync(path))]));
    const unchanged = () => { for (const [path, digest] of Object.entries(sourceHashes)) if (sha(readFileSync(path)) !== digest) throw new Error(`Frozen source changed during evaluation: ${path}`); };
    const model = await preflightLocalModel(settings);
    const manifest = {
      version: PROPOSAL_BASELINE_VERSION, frozenAt: new Date().toISOString(),
      head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      workingTree: execFileSync("git", ["status", "--short"], { encoding: "utf8" }).trim(), sourceHashes,
      settings, model, generation: { num_predict: 2000, sampling: "Installed-model defaults; no fixed seed or quality trend claim" },
      plannedAttempts: report.plannedAttempts, fullCases: PROPOSAL_BASELINE_CASES,
      identityChange: "Opaque deterministic UUIDs replace historical case-key-derived model-visible identifiers; not score-comparable with old runs",
      newWordingMeaning: "Separately authored, not blinded/unseen; exposed regression cases",
    };
    writeFileSync(join(folder, "manifest.json"), JSON.stringify(manifest, null, 2), { flag: "wx", mode: 0o600 });
    writeFileSync(eventsPath, "", { flag: "wx", mode: 0o600 });
    report.manifestSha256 = sha(readFileSync(join(folder, "manifest.json"))); report.model = model; report.status = "running"; save();
    const turn = localTurn(settings);
    for (const [index, { item, repeat }] of attempts.entries()) {
      unchanged();
      const result = await runProposalAttempt({ item, repeat, attempt: index + 1, turn, timeoutMs: settings.timeoutMs,
        trace: (event) => appendFileSync(eventsPath, `${JSON.stringify({ attempt: index + 1, key: item.key, repeat, ...event })}\n`, { mode: 0o600 }),
      });
      report.cases.push(result); save();
      console.log(`${item.key}#${repeat}: ${result.status}; structural findings=${result.structuralFindings.length}; ${result.durationMs}ms; human review pending`);
      if (result.cleanup !== "disposed_verified" || result.writerCalls || result.blockedFixtureWrites || JSON.stringify(result.before) !== JSON.stringify(result.after)) throw new Error("Fixture integrity failed; remaining cases not run");
    }
    unchanged();
    report.status = "completed"; report.finishedAt = new Date().toISOString();
    report.summary = ["historical-six", "new-wording"].map((group) => {
      const rows = report.cases.filter((row) => row.group === group);
      return { group, selectedPlanned: attempts.filter(({ item }) => item.group === group).length, completed: rows.filter((row) => row.status === "completed").length,
        runtimeErrors: rows.filter((row) => row.status === "runtime_error").length, timedOut: rows.filter((row) => row.status === "timed_out").length,
        structurallyClearHumanReviewPending: rows.filter((row) => row.status === "completed" && row.structuralFindings.length === 0).length,
        withStructuralFindings: rows.filter((row) => row.structuralFindings.length > 0).length,
        unfinished: attempts.filter(({ item }) => item.group === group).length - rows.length, humanAccepted: 0 };
    });
    report.eventsSha256 = sha(readFileSync(eventsPath)); report.sourceHashesRechecked = true; save();
    writeFileSync(join(folder, "review-sheet.json"), JSON.stringify(report.cases.map((row) => ({ key: row.key, group: row.group, repeat: row.repeat, ownerAcceptance: "pending", reviewer: null,
      dimensions: Object.fromEntries(["requested_outcome", "useful_content", "factual_faithfulness", "knowledge_boundary", "source_meaning", "honest_state", "clarity"].map((key) => [key, { verdict: "unreviewed", excerpts: [], reason: "" }])), caseCriteria: row.reviewCriteria })), null, 2), { flag: "wx", mode: 0o600 });
    expect(report.cases.filter((row) => row.status !== "completed" || row.structuralFindings.length)
      .map((row) => ({ key: row.key, repeat: row.repeat, status: row.status, findings: row.structuralFindings, error: row.error }))).toEqual([]);
  } catch (error) {
    if (report.status !== "completed") { report.status = "runner_error_or_incomplete"; report.error = error instanceof Error ? error.message : "Unknown error"; report.finishedAt = new Date().toISOString(); save(); }
    throw error;
  } finally {
    if (ownsLock) {
      const owner = JSON.parse(readFileSync(lockPath, "utf8"));
      if (owner.token !== lockToken) throw new Error("Model lock ownership changed; not removing it");
      unlinkSync(lockPath);
    }
    console.log(`Evidence retained: ${reportPath}. No automatic quality score or owner acceptance.`);
  }
}, 2_000_000_000);
