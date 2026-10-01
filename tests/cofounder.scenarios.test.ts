import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PERSONA_INSTRUCTION_VERSION, buildCompanyContext, reviewedSystemFor, type CofounderMessage, type CofounderToolName, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { DEFAULT_PERSONA } from "@/lib/osPersona";
import { PERSONA_JUDGE_VERSION, PERSONA_VARIATIONS, personaJudge, personaOutcomeClasses, toneProfile, type PersonaScenario, type ToneProfile } from "@/lib/osPersonaVariations";
import { localTurn } from "@/lib/osCofounderLocal";
import { parseReviewRequestIntent } from "@/lib/osReviewIntent";
import { ReviewedTurnError, runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import { REVIEWED_CHECKS_VERSION, guaranteedByConstruction, reviewedChecks } from "@/lib/osReviewedScenarioChecks";
import { preflightLocalModel, scenarioRunRequested, scenarioSettings, scenarioSuite, withScenarioDeadline } from "@/lib/osScenarioHarness";
import { validateManifest } from "@/lib/osScenarioRescore";
import { SCENARIOS, JUDGE_VERSION, judge, type Outcome, type Scenario, type ScenarioRequest } from "@/lib/osScenarios";
import { WORK_VARIATIONS } from "@/lib/osWorkVariations";
import { FAITHFULNESS_VARIATIONS } from "@/lib/osFaithfulnessVariations";
import { FIXTURE_CONTEXT_VERSION, scenarioFixture } from "./helpers/scenarioFixture";
import { REVIEWED_DECISION_POLICY, REVIEWED_DESK_VERSION, reviewedScenarioDesk, type RecordedCard } from "./helpers/reviewedScenarioDesk";

/* Explicit opt-in: ordinary npm test never calls a model due to .env.local.
 * Isolated fixtures measure model/context/tool behavior, NOT PostgreSQL,
 * RLS, persistence or production. Keep the desk idle during this serial run.
 *
 * Since 1 October the runner drives the desk's own loop: runReviewedTurn with
 * reviewedSystemFor, the person's request selection as a scenario input, the
 * route's proposal chain replayed over the in-memory company, and every card
 * saved unchanged by the harness after its turn — as a person's Save would
 * write it, with no person deciding. The report says so. */
type ReviewedTurnSummary = {
  request: ScenarioRequest; sourceId: string; toolAttempts: string[]; refusals: string[]; cards: RecordedCard[]; loopWroteNothing: boolean;
};
type CaseRecord = {
  key: string; repeat: number;
  status: "unfinished" | "running" | "deterministic_fail" | "checks_passed_human_review_pending" | "runtime_error" | "timed_out";
  humanReview: "pending"; reviewCriteria: string[];
  startedAt?: string; finishedAt?: string; durationMs?: number;
  inputTokens: number; outputTokens: number; tokenAccounting: "complete" | "partial";
  transcript: { person: string; context: string; reply: string; modelProse: string; receipt: string }[];
  modelCalls: { input: { system: string; messages: { role: "user" | "assistant"; content: unknown }[]; tools?: readonly CofounderToolName[] }; events: ModelEvent[] }[];
  events: ReviewedTurnEvent[]; outcome?: Outcome; failures: string[]; error?: string;
  review: { turns: ReviewedTurnSummary[]; failedTurn?: { reason: string; text: string } };
  guaranteedByConstruction: string[];
  cleanup: "not_started" | "disposed_verified" | "failed";
  /* The persona suite only: which persona spoke, and how the prose read. */
  personaId?: string; tone?: ToneProfile;
};

describe.skipIf(!scenarioRunRequested(process.env))("local behavioral baseline (not database integration)", () => {
  it("runs every repetition serially and saves all results, including unfinished/error cases", async () => {
    const reportParent = process.env.MAYDAOS_SCENARIO_REPORT_DIR ? resolve(process.env.MAYDAOS_SCENARIO_REPORT_DIR) : tmpdir();
    mkdirSync(reportParent, { recursive: true, mode: 0o700 });
    const reportDir = mkdtempSync(join(reportParent, "maydaos-baseline-"));
    const reportPath = join(reportDir, "report.json");
    const lockPath = join(tmpdir(), "maydaos-local-scenario-run.lock");
    let ownsLock = false;
    const report: Record<string, unknown> & { cases: CaseRecord[] } = {
      schemaVersion: 1,
      scope: "real-local-model / isolated-in-memory-company-fixtures; cards saved unchanged by the harness, no person decided; NOT SQL, RLS, persistence, production or human-quality validation",
      loop: "reviewed",
      decisionPolicy: REVIEWED_DECISION_POLICY,
      startedAt: new Date().toISOString(), status: "preflight", pid: process.pid,
      judgeVersion: JUDGE_VERSION, fixtureContextVersion: FIXTURE_CONTEXT_VERSION,
      reviewedDeskVersion: REVIEWED_DESK_VERSION, reviewedChecksVersion: REVIEWED_CHECKS_VERSION,
      paidProviderCalls: 0, databaseCalls: 0, cases: [],
    };
    const save = () => {
      const temporary = `${reportPath}.tmp`;
      writeFileSync(temporary, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
      renameSync(temporary, reportPath);
    };
    save(); console.log(`Baseline artifact: ${reportPath}`);
    try {
      const settings = scenarioSettings(process.env);
      const suite = scenarioSuite(process.env);
      const scenarios: Scenario[] = suite === "baseline" ? SCENARIOS : suite === "work-variations" ? WORK_VARIATIONS : suite === "faithfulness-variations" ? FAITHFULNESS_VARIATIONS : PERSONA_VARIATIONS;
      const personaSuite = suite === "persona-variations";
      report.suite = suite;
      // The persona text is part of the measured prompt whatever the suite.
      report.personaInstructionVersion = PERSONA_INSTRUCTION_VERSION;
      if (personaSuite) report.personaJudgeVersion = PERSONA_JUDGE_VERSION;
      report.settings = settings;
      // Before the lock: a suite the reviewed loop cannot run is refused, not defaulted.
      validateManifest(scenarios);
      for (const scenario of scenarios) {
        if (!scenario.request) throw new Error(`${scenario.key} has no request; the reviewed loop needs the person's selection`);
        if (!parseReviewRequestIntent(scenario.request.intent, scenario.request.mode)) throw new Error(`${scenario.key} request is not a valid selection`);
      }
      report.cases = Array.from({ length: settings.repeats }, (_, repeat) => scenarios.map((scenario): CaseRecord => ({
        key: scenario.key, repeat: repeat + 1, status: "unfinished", humanReview: "pending", reviewCriteria: scenario.humanReviewCriteria,
        inputTokens: 0, outputTokens: 0, tokenAccounting: "partial", transcript: [], modelCalls: [], events: [], failures: [],
        review: { turns: [] }, guaranteedByConstruction: guaranteedByConstruction(scenario), cleanup: "not_started",
        ...(personaSuite ? { personaId: (scenario as PersonaScenario).personaId } : {}),
      }))).flat();
      save();
      // Never reclaim a stale/uncertain owner automatically.
      const fd = openSync(lockPath, "wx", 0o600); ownsLock = true;
      try { writeFileSync(fd, JSON.stringify({ pid: process.pid, reportPath, startedAt: report.startedAt })); } finally { closeSync(fd); }
      const sources = [
        "lib/osCofounder.ts", "lib/osCofounderLocal.ts", "lib/osPersona.ts",
        "lib/osScenarioHarness.ts", "lib/osScenarios.ts",
        "lib/osReviewedTurn.ts", "lib/osReviewIntent.ts", "lib/osReviewEnvelope.ts", "lib/osReviewGuard.ts", "lib/osReviewDate.ts",
        "lib/osReviewProposalFeedback.ts", "lib/osReviewReceipt.ts", "lib/osReviewTextGate.ts", "lib/osReviewBoundary.ts",
        "lib/osReviewCitation.ts", "lib/osReviewDuplicate.ts", "lib/osReviewedMemory.ts", "lib/osReviewedScenarioChecks.ts",
        "tests/helpers/scenarioFixture.ts", "tests/helpers/reviewedScenarioDesk.ts", "tests/cofounder.scenarios.test.ts",
      ];
      if (suite === "work-variations") sources.push("lib/osWorkVariations.ts");
      if (suite === "faithfulness-variations") sources.push("lib/osFaithfulnessVariations.ts");
      if (personaSuite) sources.push("lib/osPersonaVariations.ts");
      report.source = {
        head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
        workingTree: execFileSync("git", ["status", "--short"], { encoding: "utf8" }).trim(),
        sha256: Object.fromEntries(sources.map((path) => [path, createHash("sha256").update(readFileSync(path)).digest("hex")])),
        scenariosSha256: createHash("sha256").update(JSON.stringify(scenarios)).digest("hex"),
      };
      writeFileSync(join(reportDir, "manifest.json"), JSON.stringify(scenarios), { mode: 0o600, flag: "wx" });
      report.model = await preflightLocalModel(settings);
      report.generation = { num_predict: 2000, sampling: "Ollama model defaults; nondeterministic repetitions, not a trend claim" };
      report.status = "running"; save();
      const model = localTurn(settings);
      for (const record of report.cases) {
        const scenario = scenarios.find((candidate) => candidate.key === record.key)!;
        const fixture = scenarioFixture(scenario);
        const before = fixture.snapshot().os_work_items;
        const beforeIds = new Set(before.map((row) => row.id));
        const history: CofounderMessage[] = [];
        const started = Date.now(); record.startedAt = new Date(started).toISOString(); record.status = "running"; save();
        const measured: ModelTurn = async function* (args) {
          const call = { input: structuredClone({ system: args.system, messages: args.messages, tools: args.tools }), events: [] as ModelEvent[] };
          record.modelCalls.push(call);
          for await (const event of model(args)) {
            call.events.push(event);
            if (event.type === "done") { record.inputTokens += event.inputTokens; record.outputTokens += event.outputTokens; }
            yield event;
          }
        };
        try {
          await withScenarioDeadline(settings.timeoutMs, async (signal) => {
            for (const [turnIndex, said] of scenario.says.entries()) {
              signal.throwIfAborted(); history.push({ role: "person", body: said });
              const context = await buildCompanyContext(fixture.db, fixture.companyId);
              const transcript = { person: said, context, reply: "", modelProse: "", receipt: "" }; record.transcript.push(transcript);
              const persona = (scenario as Partial<PersonaScenario>).persona ?? DEFAULT_PERSONA;
              const request = scenario.request!;
              const desk = reviewedScenarioDesk({ fixture, request, said, turnIndex, today: new Date().toISOString().slice(0, 10) });
              const system = reviewedSystemFor(context, request.mode, request.intent, persona);
              if (system.includes(desk.source.id)) throw new Error("harness identity leaked into the model input");
              const beforeTurn = JSON.stringify(fixture.snapshot());
              const callsBefore = record.modelCalls.length;
              const turnEvents: ReviewedTurnEvent[] = [];
              try {
                for await (const event of runReviewedTurn({
                  mode: request.mode, intent: request.intent, source: desk.source, system, history, turn: measured, priced: false, signal, propose: desk.propose,
                })) {
                  turnEvents.push(event); record.events.push(event);
                  if (event.type === "text") transcript.reply += event.text;
                }
              } catch (error) {
                if (error instanceof ReviewedTurnError) record.review.failedTurn = { reason: error.reason, text: error.text };
                throw error;
              }
              // The loop itself must write nothing; only the desk's save does.
              const loopWroteNothing = JSON.stringify(fixture.snapshot()) === beforeTurn;
              Object.assign(transcript, desk.split(turnEvents));
              await desk.saveAllUnchanged();
              record.review.turns.push({
                request, sourceId: desk.source.id,
                toolAttempts: record.modelCalls.slice(callsBefore).flatMap((call) => call.events.filter((event) => event.type === "tool").map((event) => event.name)),
                refusals: turnEvents.filter((event): event is Extract<ReviewedTurnEvent, { type: "refused" }> => event.type === "refused").map((event) => event.reason),
                cards: desk.cards(), loopWroteNothing,
              });
              history.push({ role: "cofounder", body: transcript.reply });
            }
          });
          const after = fixture.snapshot();
          record.outcome = {
            filed: after.os_work_items.filter((row) => !beforeIds.has(row.id)).map((row) => ({ title: String(row.title), lane: String(row.lane), kind: String(row.kind), status: String(row.status), notes: String(row.notes ?? ""), required_action: typeof row.required_action === "string" ? row.required_action : null })),
            remembered: after.os_company_memory.filter((row) => row.source === "cofounder").map((row) => String(row.fact)),
            reply: record.transcript.map((turn) => turn.reply).join("\n"),
            statusesChanged: before.some((row) => after.os_work_items.find((candidate) => candidate.id === row.id)?.status !== row.status),
          };
          record.failures = judge(scenario, record.outcome); record.tokenAccounting = "complete";
          // Per turn: the turn's own events against the turn's own cards.
          const turnEventsByIndex = (() => {
            const turns: ReviewedTurnEvent[][] = [[]];
            for (const event of record.events) {
              turns[turns.length - 1].push(event);
              if (event.type === "done") turns.push([]);
            }
            return turns;
          })();
          record.failures.push(...reviewedChecks(scenario, record.review.turns.map((turn, index) => ({
            ...turn, events: turnEventsByIndex[index] ?? [], modelProse: record.transcript[index]?.modelProse ?? "", receipt: record.transcript[index]?.receipt ?? "",
          }))).map((failure) => `reviewed: ${failure}`));
          if (personaSuite) {
            const variation = scenario as PersonaScenario;
            record.failures.push(...personaJudge(variation, record.outcome).map((failure) => `persona: ${failure}`));
            // Tone is profiled on the model's prose, not the trusted receipt.
            record.tone = toneProfile(record.transcript.map((turn) => turn.modelProse).join("\n"), variation.persona);
          }
          record.status = record.failures.length ? "deterministic_fail" : "checks_passed_human_review_pending";
        } catch (error) {
          record.status = error instanceof Error && error.name === "TimeoutError" ? "timed_out" : "runtime_error";
          record.error = error instanceof ReviewedTurnError ? `ReviewedTurnError:${error.reason}` : error instanceof Error ? error.message : "Unknown runtime error";
        } finally {
          fixture.dispose(); record.cleanup = fixture.isDisposed() ? "disposed_verified" : "failed";
          record.durationMs = Date.now() - started; record.finishedAt = new Date().toISOString(); save();
        }
        console.log(`${record.status} ${record.key} repeat=${record.repeat} ${record.inputTokens}+${record.outputTokens} tokens ${record.durationMs}ms`);
        if (process.env.MAYDAOS_SCENARIO_VERBOSE === "1") console.log(JSON.stringify({ transcript: record.transcript, failures: record.failures, error: record.error }));
      }
      report.status = "completed"; report.finishedAt = new Date().toISOString();
      const has = (record: CaseRecord, test: (failure: string) => boolean) => record.failures.some(test);
      report.summary = {
        planned: report.cases.length,
        checksPassedHumanReviewPending: report.cases.filter((record) => record.status === "checks_passed_human_review_pending").length,
        deterministicFailures: report.cases.filter((record) => record.status === "deterministic_fail").length,
        runtimeErrors: report.cases.filter((record) => record.status === "runtime_error").length,
        timedOut: report.cases.filter((record) => record.status === "timed_out").length,
        unfinished: report.cases.filter((record) => ["unfinished", "running"].includes(record.status)).length,
        humanReviewed: 0,
        // The judge-only number beside the side checks', so the two are never confused.
        failureKinds: {
          judge: report.cases.filter((record) => has(record, (f) => !f.startsWith("reviewed: ") && !f.startsWith("persona: "))).length,
          reviewed: report.cases.filter((record) => has(record, (f) => f.startsWith("reviewed: "))).length,
          persona: report.cases.filter((record) => has(record, (f) => f.startsWith("persona: "))).length,
        },
        // The persona suite's gate: one outcome class per base scenario across every persona and repeat.
        ...(personaSuite ? { personaInvariance: personaOutcomeClasses(report.cases) } : {}),
      };
      save();
      expect(report.cases.filter((record) => record.status !== "checks_passed_human_review_pending" || record.cleanup !== "disposed_verified").map((record) => `${record.key}#${record.repeat}: ${record.status} ${record.failures.join("; ")} ${record.error ?? ""}`)).toEqual([]);
      if (personaSuite) expect(personaOutcomeClasses(report.cases).divergent, "a persona changed more than the register").toEqual([]);
    } catch (error) {
      if (report.status !== "completed") {
        report.status = "preflight_or_runner_error"; report.error = error instanceof Error ? error.message : "Unknown error";
        report.finishedAt = new Date().toISOString(); save();
      }
      throw error;
    } finally {
      if (ownsLock) {
        if (!existsSync(lockPath)) throw new Error("Runner lock vanished unexpectedly; inspect concurrent activity.");
        unlinkSync(lockPath);
      }
      console.log(`All transcripts/outcomes retained in ${reportPath}; automatic checks are not a human quality verdict.`);
    }
  }, 2_000_000_000);
});
