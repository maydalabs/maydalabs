#!/usr/bin/env node
/* Node 25 native TypeScript stripping; no model or database imports. */
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS, JUDGE_VERSION, judge } from "../lib/osScenarios.ts";
import { BASELINE_SOURCE_PATHS, rescoreBaseline, snapshotBaselineManifest } from "../lib/osScenarioRescore.ts";

const hashText = (text) => createHash("sha256").update(text).digest("hex");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceHashes = () => Object.fromEntries(BASELINE_SOURCE_PATHS.map((path) => [path, hashText(readFileSync(resolve(root, path)))]));

function exclusiveWrite(outputPath, text, inputPaths) {
  const destination = resolve(outputPath);
  if (inputPaths.some((input) => resolve(input) === destination || realpathSync(input) === destination)) throw new Error("Output must be a new artifact, never an input path.");
  // wx also rejects symlinks and existing files; there is no force option.
  writeFileSync(destination, text, { flag: "wx", mode: 0o600 });
  console.log(`Created ${destination}`);
}

try {
  const [mode, reportPath, manifestPath, outputPath, ...extras] = process.argv.slice(2);
  if (extras.length || !reportPath || !manifestPath || !["--snapshot", "--rescore"].includes(mode) || (mode === "--snapshot" ? outputPath !== undefined : !outputPath)) {
    throw new Error("Usage: node scripts/rescore-maydaos-baseline.mjs --snapshot report.json original-manifest.json\n   or: node scripts/rescore-maydaos-baseline.mjs --rescore report.json original-manifest.json new-rescore.json");
  }
  const originalBytes = readFileSync(reportPath);
  const originalSha256 = hashText(originalBytes);
  const report = JSON.parse(originalBytes.toString("utf8"));
  const hashes = sourceHashes();
  if (mode === "--snapshot") {
    const text = snapshotBaselineManifest(report, SCENARIOS, { judgeVersion: JUDGE_VERSION, sourceHashes: hashes, hashText });
    if (hashText(readFileSync(reportPath)) !== originalSha256) throw new Error("Baseline changed while reading; wait for a frozen completed report.");
    exclusiveWrite(manifestPath, text, [reportPath]);
    console.log(`Original report SHA-256: ${originalSha256}\nOriginal manifest SHA-256: ${hashText(text)}\nJudge: ${JUDGE_VERSION}`);
  } else {
    const manifestBytes = readFileSync(manifestPath);
    if (hashText(manifestBytes) !== report.source?.scenariosSha256) throw new Error("Original manifest file byte digest differs from baseline metadata.");
    const result = rescoreBaseline(report, JSON.parse(manifestBytes.toString("utf8")), {
      currentManifest: SCENARIOS, judgeVersion: JUDGE_VERSION, sourceHashes: hashes,
      originalReportPath: realpathSync(reportPath), originalReportSha256: originalSha256,
      generatedAt: new Date().toISOString(), hashText, judge,
    });
    if (hashText(readFileSync(reportPath)) !== originalSha256 || hashText(readFileSync(manifestPath)) !== hashText(manifestBytes)) throw new Error("An input changed while reading; refusing to write a derived artifact.");
    exclusiveWrite(outputPath, `${JSON.stringify(result, null, 2)}\n`, [reportPath, manifestPath]);
    console.log(JSON.stringify({ originalJudge: result.originalJudge.version, correctedJudge: result.correctedJudge.version, original: result.originalSummary, corrected: result.correctedSummary }));
    console.log("Identical saved outputs, corrected measurement only. No model or database calls; human review remains pending.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Offline rescore failed.");
  process.exitCode = 1;
}
