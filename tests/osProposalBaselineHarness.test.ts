import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCompanyContext, type ModelTurn } from "../lib/osCofounder";
import { proposalBaselineArguments } from "../scripts/run-maydaos-proposal-baseline.mjs";
import { PROPOSAL_BASELINE_CASES } from "./helpers/osProposalBaselineCases";
import { opaqueFixtureId, plannedProposalAttempts, proposalContextFixture, runProposalAttempt } from "./helpers/osProposalBaselineHarness";

const find = (key: string) => PROPOSAL_BASELINE_CASES.find((item) => item.key === key)!;
const complete = { type: "done" as const, stopReason: "end_turn", inputTokens: 30, outputTokens: 10 };
afterEach(() => vi.unstubAllGlobals());

describe("safe proposal baseline launcher and plan", () => {
  it("requires explicit execution and validates bounds", () => {
    expect(() => proposalBaselineArguments([])).toThrow("--run");
    expect(() => proposalBaselineArguments(["--run", "--limit", "0"])).toThrow();
    expect(() => proposalBaselineArguments(["--run", "--timeout-ms", "1800001"])).toThrow();
    expect(() => proposalBaselineArguments(["--run", "--case", "x", "--case", "x"])).toThrow("Duplicate");
    expect(proposalBaselineArguments(["--run", "--case", "cannot-approve", "--limit", "1"])).toMatchObject({ cases: ["cannot-approve"], limit: 1 });
  });

  it("orders two entire historical passes, followed by four new cases", () => {
    const attempts = plannedProposalAttempts();
    expect(attempts).toHaveLength(16);
    expect(attempts.slice(0, 6).every((a) => a.item.group === "historical-six" && a.repeat === 1)).toBe(true);
    expect(attempts.slice(6, 12).every((a) => a.item.group === "historical-six" && a.repeat === 2)).toBe(true);
    expect(attempts.slice(12).every((a) => a.item.group === "new-wording" && a.repeat === 1)).toBe(true);
    expect(plannedProposalAttempts({ cases: ["cannot-approve"], limit: 1 })).toHaveLength(1);
    expect(() => plannedProposalAttempts({ cases: ["unknown"] })).toThrow();
    expect(() => plannedProposalAttempts({ cases: ["cannot-approve", "cannot-approve"] })).toThrow();
    expect(() => plannedProposalAttempts({ limit: 17 })).toThrow();
  });
});

describe("opaque, read-only fictional company context", () => {
  it("does not leak scenario key in model-visible company IDs", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed"); }));
    const fixture = proposalContextFixture(find("cannot-approve"), 1);
    const context = await buildCompanyContext(fixture.db, fixture.companyId);
    expect(context).toContain("Northwind Logistics");
    expect(context).toContain("Reply to the Bornova enquiry");
    expect(context).not.toContain("cannot-approve");
    expect(context).not.toContain("fixture-");
    expect(fixture.companyId).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-a[a-f\d]{3}-[a-f\d]{12}$/);
    expect(opaqueFixtureId(1, "company")).toBe(fixture.companyId);
    expect(opaqueFixtureId(2, "company")).not.toBe(fixture.companyId);
    expect(fetch).not.toHaveBeenCalled();
    fixture.dispose(); expect(fixture.isDisposed()).toBe(true);
  });

  it("blocks business writes and preserves snapshots", () => {
    const fixture = proposalContextFixture(find("answers-from-memory"), 2);
    const before = fixture.snapshot();
    expect(() => fixture.db.from("os_company_memory").insert({ company_id: fixture.companyId, fact: "Wrong" })).toThrow("read-only");
    expect(fixture.blockedWrites()).toBe(1);
    expect(fixture.snapshot()).toEqual(before);
    fixture.dispose();
  });
});

describe("proposal-only instrument against fake model events", () => {
  it("retains raw input/text/events/timing, without pretending structural checks are human acceptance", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No model network allowed"); }));
    const trace = vi.fn();
    const turn: ModelTurn = async function* () { yield { type: "text", text: "The recorded floor is 40 euros per pallet." }; yield complete; };
    const result = await runProposalAttempt({ item: find("answers-from-memory"), repeat: 1, attempt: 1, turn, timeoutMs: 1000, trace });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.humanReview).toBe("pending");
    expect(result.rawModelText).toBe("The recorded floor is 40 euros per pallet.");
    expect(result.reply).toContain("No Work or company knowledge was saved");
    expect(result.rawModelCalls[0].events).toHaveLength(2);
    expect(result.input.system).not.toContain("answers-from-memory");
    expect(result.before).toEqual(result.after);
    expect(result.writerCalls).toBe(0); expect(result.cleanup).toBe("disposed_verified");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(trace.mock.calls.some(([event]) => event.kind === "provider_event")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("stages a valid cited work preview only, never calls reviewer.save", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        const sourceId = /sourceId is "([^"]+)"/.exec(args.system)![1];
        yield { type: "tool", id: "a", name: "propose_work", input: { title: "Reply to Mr Aksoy", body: "Dear Mr Aksoy,\nWe can take twelve pallets a week to Hamburg from October, at 48 euros per pallet, with Tuesday collection.", lane: "sales", kind: "reply", outwardAction: "send", citations: [{ sourceId, quote: find("files-a-reply").fixture.says[0] }] } };
        yield { ...complete, stopReason: "tool_use" };
      } else { yield { type: "text", text: "The draft is ready for your review, not saved or sent." }; yield complete; }
    };
    const result = await runProposalAttempt({ item: find("files-a-reply"), repeat: 1, attempt: 2, turn, timeoutMs: 1000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].status).toBe("proposed");
    expect(result.proposals[0].payload.type).toBe("work");
    expect(result.writerCalls).toBe(0); expect(result.humanConfirmationsSimulated).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("keeps rejected citation attempts rather than reporting only accepted suggestions", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* () {
      if (++rounds === 1) {
        yield { type: "tool", id: "a", name: "propose_work", input: { title: "Invalid source", body: "Draft", lane: "sales", kind: "reply", outwardAction: "send", citations: [{ sourceId: "invented", quote: "invented" }] } };
        yield { ...complete, stopReason: "tool_use" };
      } else { yield { type: "text", text: "Could not stage that." }; yield complete; }
    };
    const result = await runProposalAttempt({ item: find("files-a-reply"), repeat: 1, attempt: 3, turn, timeoutMs: 1000 });
    expect(result.proposals).toHaveLength(0);
    expect(result.rawModelCalls[0].events[0].type).toBe("tool");
    expect(result.structuralFindings.some((text) => text.startsWith("Tool or proposal refused"))).toBe(true);
    expect(result.structuralFindings).toContain("work proposal count 0, expected 1..1");
  });

  it("retains false model prose separately so a true appended receipt cannot hide it", async () => {
    const turn: ModelTurn = async function* () { yield { type: "text", text: "I sent it." }; yield complete; };
    const result = await runProposalAttempt({ item: find("cannot-approve"), repeat: 1, attempt: 4, turn, timeoutMs: 1000 });
    expect(result.rawModelText).toBe("I sent it.");
    expect(result.reply).toContain("Nothing was approved or sent.");
    expect(result.structuralFindings).toEqual([]);
    expect(result.humanReview).toBe("pending"); // Deliberate: this is not a semantic judge.
  });

  it("records interrupted provider output as a failure with partial text and cleanup", async () => {
    const turn: ModelTurn = async function* () { yield { type: "text", text: "Partial answer" }; };
    const result = await runProposalAttempt({ item: find("answers-from-memory"), repeat: 1, attempt: 5, turn, timeoutMs: 1000 });
    expect(result.status).toBe("runtime_error");
    expect(result.error?.message).toBe("provider_incomplete");
    expect(result.rawModelText).toBe("Partial answer");
    expect(result.reply).toContain("Partial answer");
    expect(result.usageCoverage).toBe("partial");
    expect(result.cleanup).toBe("disposed_verified");
  });

  it("waits for cancellation and retains timeout in the denominator", async () => {
    const turn: ModelTurn = async function* ({ signal }) {
      yield { type: "text", text: "Starting" };
      await new Promise<void>((_, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
    };
    const result = await runProposalAttempt({ item: find("answers-from-memory"), repeat: 1, attempt: 6, turn, timeoutMs: 20 });
    expect(result.status).toBe("timed_out");
    expect(result.rawModelText).toBe("Starting");
    expect(result.rawModelCalls[0].error).toBeDefined();
    expect(result.cleanup).toBe("disposed_verified");
  });
});
