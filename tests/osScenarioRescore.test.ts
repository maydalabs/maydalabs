import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BASELINE_SOURCE_PATHS, rescoreBaseline, snapshotBaselineManifest, validateManifest, validateScenarioRequest } from "@/lib/osScenarioRescore";
import { parseReviewRequestIntent } from "@/lib/osReviewIntent";

/* Two hand-maintained lists of hashed sources are one list only while a test
 * says so: the persona module was missing from both until the persona slice. */
describe("the hashed sources", () => {
  it("are the same list in the runner and in the rescorer", () => {
    const runner = readFileSync("tests/cofounder.scenarios.test.ts", "utf8");
    for (const path of BASELINE_SOURCE_PATHS) expect(runner, path).toContain(`"${path}"`);
    expect(runner).toContain('"lib/osPersonaVariations.ts"');
    expect(BASELINE_SOURCE_PATHS).toContain("lib/osPersona.ts");
  });
});
import { JUDGE_VERSION, SCENARIOS, type Outcome } from "@/lib/osScenarios";

const hashText = (text: string) => createHash("sha256").update(text).digest("hex");
const sourceHashes = Object.fromEntries(BASELINE_SOURCE_PATHS.map((path) => [path, hashText(path)]));
const originalManifest = structuredClone(SCENARIOS);

function fixture(repeats = 3) {
  const outcome: Outcome = { reply: "Original recorded reply.", filed: [], remembered: [], statusesChanged: false };
  return {
    schemaVersion: 1, status: "completed", judgeVersion: "2026-09-22.1", settings: { repeats },
    source: { head: "original-head", sha256: { ...sourceHashes }, scenariosSha256: hashText(JSON.stringify(originalManifest)) },
    cases: Array.from({ length: repeats }, (_, index) => originalManifest.map((scenario) => ({
      key: scenario.key, repeat: index + 1, status: "deterministic_fail", humanReview: "pending", reviewCriteria: scenario.humanReviewCriteria,
      tokenAccounting: "complete", inputTokens: 12, outputTokens: 4, durationMs: 20, cleanup: "disposed_verified",
      failures: ["old failure"], outcome: structuredClone(outcome),
      transcript: scenario.says.map((person) => ({ person, context: "Original context.", reply: outcome.reply })),
    }))).flat(),
  };
}
function options(report = fixture()) {
  return {
    currentManifest: structuredClone(SCENARIOS), judgeVersion: "2026-09-22.2",
    sourceHashes: { ...sourceHashes, "lib/osScenarios.ts": hashText("corrected judge") } as Record<string, string>,
    originalReportPath: "/private/tmp/original-report.json", originalReportSha256: hashText(JSON.stringify(report)), generatedAt: "2026-09-22T12:00:00Z",
    hashText, judge: vi.fn((): string[] => []),
  };
}

describe("offline measurement correction", () => {
  it("requires a frozen completed original and matching original manifest/source/version for snapshot", () => {
    const report = fixture();
    const snapshot = snapshotBaselineManifest(report, originalManifest, { judgeVersion: report.judgeVersion, sourceHashes, hashText });
    expect(hashText(snapshot)).toBe(report.source.scenariosSha256);
    expect(() => snapshotBaselineManifest({ ...report, status: "running" }, originalManifest, { judgeVersion: report.judgeVersion, sourceHashes, hashText })).toThrow("completed");
    expect(() => snapshotBaselineManifest(report, originalManifest, { judgeVersion: "different", sourceHashes, hashText })).toThrow("Judge version");
    expect(() => snapshotBaselineManifest(report, originalManifest, { judgeVersion: report.judgeVersion, sourceHashes: { ...sourceHashes, "lib/osScenarios.ts": hashText("changed") }, hashText })).toThrow("Source changed");
  });

  it("rescores all 18 outcomes exactly once with original→corrected provenance and pending human review", () => {
    const report = fixture(); const opts = options(report);
    const originalBytes = JSON.stringify(report);
    const result = rescoreBaseline(report, originalManifest, opts);
    expect(opts.judge).toHaveBeenCalledTimes(18);
    expect(result.originalReport.sha256).toBe(hashText(originalBytes));
    expect(result.originalJudge.version).toBe("2026-09-22.1");
    expect(result.correctedJudge.version).toBe("2026-09-22.2");
    expect(result.originalSummary).toMatchObject({ planned: 18, deterministicFailures: 18 });
    expect(result.correctedSummary).toMatchObject({ planned: 18, checksPassedHumanReviewPending: 18, humanReviewed: 0 });
    expect(result.cases.every((entry) => entry.verdictChanged && entry.humanReview === "pending")).toBe(true);
    expect(result.modelCalls).toBe(0); expect(result.databaseCalls).toBe(0);
    expect(JSON.stringify(report)).toBe(originalBytes);
    expect(result.cases[0].originalVerdict.failures).toEqual(["old failure"]);
  });

  it("rejects unversioned source or manifest corrections while allowing identical-instrument validation", () => {
    const report = fixture();
    const changedSource = options(report); changedSource.judgeVersion = report.judgeVersion;
    expect(() => rescoreBaseline(report, originalManifest, changedSource)).toThrow("new judge version");
    const changedManifest = options(report); changedManifest.judgeVersion = report.judgeVersion; changedManifest.sourceHashes = { ...sourceHashes };
    changedManifest.currentManifest[0].humanReviewCriteria = ["Changed review criterion"];
    expect(() => rescoreBaseline(report, originalManifest, changedManifest)).toThrow("new judge version");
    const identical = options(report); identical.judgeVersion = report.judgeVersion; identical.sourceHashes = { ...sourceHashes };
    expect(rescoreBaseline(report, originalManifest, identical).correctedJudge.version).toBe(report.judgeVersion);
  });

  it("preserves runtime, timeout and unfinished cases without judging even a partial outcome", () => {
    const report = fixture(1);
    for (const [index, status] of ["runtime_error", "timed_out", "unfinished", "running"].entries()) {
      report.cases[index].status = status; report.cases[index].tokenAccounting = "partial";
    }
    const opts = options(report); const result = rescoreBaseline(report, originalManifest, opts);
    expect(opts.judge).toHaveBeenCalledTimes(2);
    for (let index = 0; index < 4; index++) {
      expect(result.cases[index]).toMatchObject({ status: report.cases[index].status, tokenAccounting: "partial", failures: ["old failure"], rescored: false, verdictChanged: false });
    }
    expect(result.correctedSummary).toMatchObject({ planned: 6, runtimeErrors: 1, timedOut: 1, unfinished: 2 });
  });

  it("allows changed expectations and review criteria, never changed questions or fixtures", () => {
    const report = fixture(); const opts = options(report);
    opts.currentManifest[0].expect = { filed: "none" };
    opts.currentManifest[0].humanReviewCriteria = ["New review note"];
    expect(rescoreBaseline(report, originalManifest, opts).cases[0].reviewCriteria).toEqual(["New review note"]);
    for (const changed of ["says", "memory", "openWork", "company", "request"] as const) {
      const altered = options(report);
      if (changed === "request") altered.currentManifest[0].request = { mode: "draft", intent: { draftFormat: "note", knowledgeAssertion: null } };
      if (changed === "says") altered.currentManifest[0].says = ["A different question"];
      if (changed === "memory") altered.currentManifest[0].memory = [{ fact: "Different floor", kind: "fact" }];
      if (changed === "openWork") altered.currentManifest[0].openWork = [{ title: "New", lane: "ops", kind: "note", status: "pending" }];
      if (changed === "company") altered.currentManifest[0].company = { name: "Different Company", whatWeDo: "A different synthetic business." };
      expect(() => rescoreBaseline(report, originalManifest, altered)).toThrow("Scenario inputs changed");
    }
  });

  it("validates explicit company identity and rejects later identity or business-context changes", () => {
    for (const company of [null, {}, { name: "Fictional", whatWeDo: "" }, { name: " ", whatWeDo: "Fictional operations." }]) {
      const manifest = structuredClone(originalManifest);
      Object.assign(manifest[0], { company });
      expect(() => validateManifest(manifest)).toThrow("Scenario company");
    }
    const report = fixture();
    const manifest = structuredClone(originalManifest);
    manifest[0].company = { name: "Fictional Company", whatWeDo: "Fictional operations." };
    report.source.scenariosSha256 = hashText(JSON.stringify(manifest));
    const opts = options(report);
    opts.currentManifest = structuredClone(manifest);
    expect(rescoreBaseline(report, manifest, opts).compatibility.inputsUnchanged).toBe(true);
    for (const field of ["name", "whatWeDo"] as const) {
      const changed = { ...opts, currentManifest: structuredClone(manifest) };
      changed.currentManifest[0].company![field] = "Changed context";
      expect(() => rescoreBaseline(report, manifest, changed)).toThrow("Scenario inputs changed");
    }
  });

  it.each(BASELINE_SOURCE_PATHS.filter((path) => path !== "lib/osScenarios.ts"))("rejects changed generation source %s", (path) => {
    const opts = options(); opts.sourceHashes[path] = hashText("changed");
    expect(() => rescoreBaseline(fixture(), originalManifest, opts)).toThrow("Source changed");
  });

  it("rejects tampered manifest, duplicate/missing cases, unknown keys and malformed completed outcomes", () => {
    const manifest = structuredClone(originalManifest); manifest[0].says[0] = "tampered";
    expect(() => rescoreBaseline(fixture(), manifest, options())).toThrow("manifest hash");
    const duplicate = fixture(); duplicate.cases[1] = structuredClone(duplicate.cases[0]);
    expect(() => rescoreBaseline(duplicate, originalManifest, options())).toThrow("Duplicate baseline");
    const missing = fixture(); missing.cases.pop();
    expect(() => rescoreBaseline(missing, originalManifest, options())).toThrow("case count");
    const unknown = fixture(); unknown.cases[0].key = "unknown";
    expect(() => rescoreBaseline(unknown, originalManifest, options())).toThrow("Unknown scenario");
    const malformed = fixture(); (malformed.cases[0].outcome as unknown as Record<string, unknown>).reply = 42;
    expect(() => rescoreBaseline(malformed, originalManifest, options())).toThrow("invalid reply");
    const alteredReply = fixture(); alteredReply.cases[0].outcome.reply = "not in transcript";
    expect(() => rescoreBaseline(alteredReply, originalManifest, options())).toThrow("differs from transcript");
  });

  it("does not change outcome, tokens, duration or cleanup when the corrected judge still rejects", () => {
    const report = fixture(1); report.cases[0].cleanup = "failed";
    const opts = options(report); opts.judge.mockReturnValue(["still wrong"]);
    const result = rescoreBaseline(report, originalManifest, opts);
    expect(result.cases[0]).toMatchObject({ status: "deterministic_fail", failures: ["still wrong"], verdictChanged: false, inputTokens: 12, outputTokens: 4, durationMs: 20, cleanup: "failed", outcome: report.cases[0].outcome });
  });

  it("keeps original inputs unchanged even if an injected judge mutates its outcome argument", () => {
    const report = fixture(1); const opts = options(report);
    const bytes = JSON.stringify(report);
    const result = rescoreBaseline(report, originalManifest, { ...opts, judge: (_, outcome) => { outcome.reply = "tampered"; return []; } });
    expect(JSON.stringify(report)).toBe(bytes);
    expect(result.cases[0].outcome).toEqual(report.cases[0].outcome);
  });
});

describe("offline command wrapper", () => {
  it("creates an exclusive snapshot and refuses overwrite without altering the original", () => {
    const directory = mkdtempSync(join(tmpdir(), "maydaos-rescore-test-"));
    try {
      const report = fixture(1); report.judgeVersion = JUDGE_VERSION;
      report.source.sha256 = Object.fromEntries(BASELINE_SOURCE_PATHS.map((path) => [path, createHash("sha256").update(readFileSync(resolve(path))).digest("hex")]));
      const input = join(directory, "report.json"); const output = join(directory, "manifest.json");
      const bytes = JSON.stringify(report); writeFileSync(input, bytes);
      const script = resolve("scripts/rescore-maydaos-baseline.mjs");
      execFileSync(process.execPath, [script, "--snapshot", input, output], { encoding: "utf8" });
      expect(hashText(readFileSync(output, "utf8"))).toBe(report.source.scenariosSha256);
      const overwrite = spawnSync(process.execPath, [script, "--snapshot", input, output], { encoding: "utf8" });
      expect(overwrite.status).toBe(1); expect(overwrite.stderr).toContain("EEXIST");
      const inputOverwrite = spawnSync(process.execPath, [script, "--snapshot", input, input], { encoding: "utf8" });
      expect(inputOverwrite.status).toBe(1); expect(inputOverwrite.stderr).toContain("never an input");
      expect(readFileSync(input, "utf8")).toBe(bytes);
      const rescored = join(directory, "rescored.json");
      execFileSync(process.execPath, [script, "--rescore", input, output, rescored], { encoding: "utf8" });
      expect(JSON.parse(readFileSync(rescored, "utf8"))).toMatchObject({ modelCalls: 0, databaseCalls: 0, originalReport: { sha256: hashText(bytes) } });
      expect(readFileSync(input, "utf8")).toBe(bytes);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  /* The person's selection, validated inline (the CLI loads this file under
   * plain Node) and by the route's own parser: the two must agree. */
  it("validates a scenario request exactly as the route parses an intent", () => {
    const cases: { mode: string; intent: { draftFormat: unknown; knowledgeAssertion: unknown } }[] = [
      { mode: "ask", intent: { draftFormat: null, knowledgeAssertion: null } },
      { mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null } },
      { mode: "knowledge", intent: { draftFormat: null, knowledgeAssertion: "Our carrier is Vos." } },
      { mode: "both", intent: { draftFormat: "post", knowledgeAssertion: "We close on Sundays." } },
      { mode: "draft", intent: { draftFormat: null, knowledgeAssertion: null } },
      { mode: "ask", intent: { draftFormat: null, knowledgeAssertion: "Not allowed here." } },
      { mode: "knowledge", intent: { draftFormat: null, knowledgeAssertion: " untrimmed " } },
      { mode: "knowledge", intent: { draftFormat: null, knowledgeAssertion: "ab" } },
      { mode: "draft", intent: { draftFormat: "memo", knowledgeAssertion: null } },
      { mode: "send", intent: { draftFormat: null, knowledgeAssertion: null } },
    ];
    for (const request of cases) {
      const route = parseReviewRequestIntent(request.intent, request.mode as never);
      if (route) expect(validateScenarioRequest(request, "test")).toEqual({ mode: request.mode, intent: route });
      else expect(() => validateScenarioRequest(request, "test")).toThrow("request");
    }
    expect(() => validateScenarioRequest({ mode: "ask", intent: { draftFormat: null, knowledgeAssertion: null }, extra: 1 }, "test")).toThrow("exactly mode and intent");
  });

  it("refuses a manifest whose request does not fit its mode", () => {
    const manifest = structuredClone(originalManifest);
    manifest[0].request = { mode: "draft", intent: { draftFormat: null, knowledgeAssertion: null } };
    expect(() => validateManifest(manifest)).toThrow("draftFormat does not fit its mode");
  });

  it("carries the reviewed and persona failures through a rescore, which re-judges the outcome alone", () => {
    const report = fixture(1); const opts = options(report);
    report.cases[0].failures = ["reviewed: attempted propose_work with no such tool offered"];
    report.cases[1].failures = ["persona: reply claims tenure or humanity", "old failure"];
    opts.judge.mockImplementation(() => []);
    const rescored = rescoreBaseline(report, originalManifest, opts);
    expect(rescored.cases[0].status).toBe("deterministic_fail");
    expect(rescored.cases[0].failures).toEqual(["reviewed: attempted propose_work with no such tool offered"]);
    expect(rescored.cases[0].verdictChanged).toBe(false);
    expect(rescored.cases[1].failures).toEqual(["persona: reply claims tenure or humanity"]);
    expect(rescored.cases[2].status).toBe("checks_passed_human_review_pending");
    expect(rescored.correctedSummary.failureKinds).toEqual({ judge: 0, reviewed: 1, persona: 1 });
    expect(rescored.originalSummary.failureKinds).toEqual({ judge: 5, reviewed: 1, persona: 1 });
  });
});
