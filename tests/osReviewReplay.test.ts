import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exclusiveReportWrite, hashBytes, HISTORICAL_REPORTS, replayHistoricalReport, runReplayCli, validateHistoricalReport } from "../scripts/replay-maydaos-review.mjs";

const founder = "Please draft a reply using the terms above. Do not save or send it.";
const work = { title: "Draft", notes: "Hello.\n\nThe price is $32.\n", lane: "sales", kind: "reply", needs_approval_for: "send" };
const tool = (name: string, input: Record<string, unknown>, id = "local-1") => ({ type: "tool", name, id, input: structuredClone(input) });
const done = { type: "done", stopReason: "end_turn", inputTokens: 10, outputTokens: 5 };
const original = { path: "/synthetic/original-report.json", sha256: hashBytes("synthetic input") };
type HistoricalModelCall = {
  input: { messages: { role: string; content: string | Record<string, unknown>[] }[] };
  events: (ReturnType<typeof tool> | typeof done | { type: string; text: string })[];
};

function fixture(tools = [tool("file_work", work)]) {
  const messages = [{ role: "user", content: founder }];
  const receipts = tools.map((event) => ({ type: "tool_result", tool_use_id: event.id, content: `Old receipt for ${event.name}.` }));
  const report = {
    schemaVersion: 1, status: "completed", startedAt: "2026-09-22T12:00:00Z", finishedAt: "2026-09-22T12:01:00Z",
    databaseCalls: 0, paidProviderCalls: 0, suite: "synthetic-only", judgeVersion: "old", fixtureContextVersion: "old",
    source: { sha256: { "old-source.ts": hashBytes("old-source") }, scenariosSha256: hashBytes("old-manifest") },
    summary: { planned: 1, checksPassedHumanReviewPending: 0, deterministicFailures: 1, runtimeErrors: 0, timedOut: 0, unfinished: 0, humanReviewed: 0 },
    cases: [{ key: "synthetic-failure", repeat: 1, status: "deterministic_fail", humanReview: "pending", cleanup: "disposed_verified",
      tokenAccounting: "complete", startedAt: "2026-09-22T12:00:00Z", finishedAt: "2026-09-22T12:01:00Z",
      failures: ["Invented claim remains a failure."], transcript: [{ person: founder, context: "Synthetic company only.", reply: "Old saved claim." }],
      outcome: { reply: "Old saved claim.", filed: [{ ...work, status: "review" }], remembered: [], statusesChanged: false },
      events: [{ type: "filed", title: work.title }, { type: "done", text: "Old saved claim." }],
      modelCalls: [
        { input: { messages: structuredClone(messages) }, events: [...tools, done] },
        { input: { messages: [...messages,
          { role: "assistant", content: tools.map((event) => ({ type: "tool_use", id: event.id, name: event.name, input: event.input })) },
          { role: "user", content: receipts }] }, events: [{ type: "text", text: "Old saved claim." }, done] },
      ] as HistoricalModelCall[],
    }],
  };
  return report;
}

describe("offline historical review-boundary adapter", () => {
  it("keeps original failure, exact draft, text and receipts; exposes only an unconfirmed preview", () => {
    const report = fixture();
    const bytes = JSON.stringify(report);
    const result = replayHistoricalReport(report, original);
    expect(JSON.stringify(report)).toBe(bytes);
    expect(result.metrics).toEqual({ cases: 1, recordedModelCalls: 2, toolAttempts: 1, workAttempts: 1, knowledgeAttempts: 0,
      workPreviewAttempts: 1, uniqueWorkPreviews: 1, needsReviewDetails: 0, rejectedAttempts: 0, fakeWriterCalls: 0 });
    expect(result.cases[0].original).toMatchObject({ status: "deterministic_fail", failures: report.cases[0].failures,
      transcript: report.cases[0].transcript, outcome: report.cases[0].outcome, reportSha256: original.sha256 });
    const attempt = result.cases[0].attempts[0];
    expect(attempt.preview.status).toBe("proposed");
    expect(attempt.preview.payload.body).toBe(work.notes);
    expect(attempt.preview.payload.outwardAction).toBe("send");
    expect(attempt.historicalReceipts[0]).toEqual({ pointer: "/cases/0/modelCalls/1/input/messages/2/content/0",
      raw: { type: "tool_result", tool_use_id: "local-1", content: "Old receipt for file_work." } });
    expect(attempt.adapter.citationAddedBy).toBe("offline_adapter_not_historical_model");
    expect(attempt.adapter.citationMeaning).toContain("does not establish");
    expect(attempt.humanConfirmationSimulated).toBe(false);
    expect(attempt.fakeWriterCalls).toBe(0);
  });

  it("does not convert a legacy memory to permanent knowledge or invent its scope/duration", () => {
    const raw = { fact: "A customer asked today.", kind: "fact" };
    const result = replayHistoricalReport(fixture([tool("remember", raw)]), original);
    expect(result.metrics).toMatchObject({ knowledgeAttempts: 1, needsReviewDetails: 1, uniqueWorkPreviews: 0, fakeWriterCalls: 0 });
    const attempt = result.cases[0].attempts[0];
    expect(attempt.rawInput).toEqual(raw);
    expect(attempt.classification).toBe("needs_review_details");
    expect(attempt.boundaryInvoked).toBe(false);
    expect(attempt).not.toHaveProperty("adapted");
    expect(attempt).not.toHaveProperty("preview");
  });

  it("rejects unsupported tools and privilege-like legacy fields instead of stripping them", () => {
    const result = replayHistoricalReport(fixture([tool("approve", { id: "work-1" }, "a"),
      tool("file_work", { ...work, approved: true }, "b")]), original);
    expect(result.metrics).toMatchObject({ toolAttempts: 2, workAttempts: 1, rejectedAttempts: 2, fakeWriterCalls: 0 });
    expect(result.cases[0].attempts.map((a: { reason: string }) => a.reason)).toEqual(["unsupported_historical_tool", "unsupported_legacy_work_fields"]);
    expect(result.cases[0].attempts[1].rawInput.approved).toBe(true);
  });

  it("preserves invalid payloads, never repairs/truncates them to make a preview pass", () => {
    const result = replayHistoricalReport(fixture([tool("file_work", { ...work, notes: "" })]), original);
    expect(result.metrics).toMatchObject({ rejectedAttempts: 1, uniqueWorkPreviews: 0, fakeWriterCalls: 0 });
    expect(result.cases[0].attempts[0]).toMatchObject({ classification: "rejected", reason: "invalid_proposal", rawInput: { notes: "" } });
  });

  it("counts repeated attempts separately but the same exact preview only once per founder turn", () => {
    const result = replayHistoricalReport(fixture([tool("file_work", work, "a"), tool("file_work", work, "b")]), original);
    expect(result.metrics).toMatchObject({ toolAttempts: 2, workPreviewAttempts: 2, uniqueWorkPreviews: 1, fakeWriterCalls: 0 });
  });

  it("uses the latest founder string, never a tool result masquerading as user-role text", () => {
    const report = fixture();
    const latest = "Now draft a different reply.";
    const prefix = [{ role: "user", content: "An earlier request." }, { role: "assistant", content: "Earlier answer." }];
    for (const call of report.cases[0].modelCalls) {
      call.input.messages[0].content = latest;
      call.input.messages.unshift(...prefix);
    }
    const attempt = replayHistoricalReport(report, original).cases[0].attempts[0];
    expect(attempt.founderSource.text).toBe(latest);
    expect(attempt.adapted.citations).toEqual([{ sourceId: "founder-turn-2", quote: latest }]);
  });

  it("does not attach an earlier receipt when tool IDs repeat across rounds", () => {
    const report = fixture();
    const calls = report.cases[0].modelCalls;
    const memory = tool("remember", { fact: "One-off quote.", kind: "fact" });
    calls[1].events = [memory, done];
    calls.push({ input: { messages: [...calls[1].input.messages,
      { role: "assistant", content: [{ type: "tool_use", id: memory.id, name: memory.name, input: memory.input }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: memory.id, content: "Old remember receipt." }] }] }, events: [done] });
    const attempts = replayHistoricalReport(report, original).cases[0].attempts;
    expect(attempts.map((a: { historicalReceipts: { raw: { content: string } }[] }) => a.historicalReceipts[0].raw.content)).toEqual(["Old receipt for file_work.", "Old remember receipt."]);
  });

  it.each<[string, (r: ReturnType<typeof fixture>) => void]>([
    ["in-progress report", (r) => { r.status = "running"; }],
    ["wrong denominator", (r) => { r.summary.planned = 2; }],
    ["unfinished case", (r) => { r.cases[0].status = "unfinished"; }],
    ["missing finish", (r) => { Reflect.deleteProperty(r, "finishedAt"); }],
    ["missing model trace", (r) => { Reflect.deleteProperty(r.cases[0], "modelCalls"); }],
    ["incomplete model call", (r) => { r.cases[0].modelCalls[0].events.pop(); }],
    ["missing founder source", (r) => { r.cases[0].modelCalls[0].input.messages = [{ role: "user", content: [] }]; }],
    ["duplicate tool id within a round", (r) => { r.cases[0].modelCalls[0].events.unshift(tool("file_work", work)); }],
    ["database calls", (r) => { r.databaseCalls = 1; }],
  ])("fails closed for %s", (_, mutate) => {
    const report = fixture(); mutate(report);
    expect(() => validateHistoricalReport(report)).toThrow();
  });

  it("pins CLI input hashes to the three named immutable reports and requires an explicit new output", () => {
    expect(HISTORICAL_REPORTS.map((r: { directory: string; cases: number }) => [r.directory, r.cases])).toEqual([
      ["maydaos-baseline-pxTtiQ", 12], ["maydaos-baseline-PL8Q2a", 4], ["maydaos-baseline-fsBP36", 5],
    ]);
    expect(HISTORICAL_REPORTS.every((r: { sha256: string }) => /^[a-f0-9]{64}$/.test(r.sha256))).toBe(true);
    expect(() => runReplayCli([])).toThrow("Usage");
    expect(() => runReplayCli(["--force", "output.json", "a", "b", "c"])).toThrow("Usage");
  });

  it("creates only a new derived file and refuses original/existing/symlink output targets", () => {
    const directory = mkdtempSync(join(tmpdir(), "maydaos-review-replay-test-"));
    try {
      const input = join(directory, "original.json");
      const output = join(directory, "derived.json");
      const symlink = join(directory, "alias.json");
      const bytes = JSON.stringify(fixture());
      writeFileSync(input, bytes, { flag: "wx" });
      symlinkSync(input, symlink);
      exclusiveReportWrite(output, { syntheticOnly: true }, [input]);
      expect(JSON.parse(readFileSync(output, "utf8"))).toEqual({ syntheticOnly: true });
      expect(() => exclusiveReportWrite(input, {}, [input])).toThrow("input path");
      expect(() => exclusiveReportWrite(output, {}, [input])).toThrow();
      expect(() => exclusiveReportWrite(symlink, {}, [input])).toThrow();
      expect(readFileSync(input, "utf8")).toBe(bytes);
      expect(() => runReplayCli(["-o", join(directory, "never-created.json"), input, input, input])).toThrow("not the pinned immutable");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
