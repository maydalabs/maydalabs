import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCompanyContext, type ModelTurn } from "../lib/osCofounder";
import { OS_INTENT_CASES } from "../lib/osIntentCases";
import { intentCheckArguments } from "../scripts/run-maydaos-intent-check.mjs";
import { intentContextFixture, modeForIntentCase, opaqueIntentId, plannedIntentCases, runIntentAttempt } from "./helpers/osIntentHarness";

const find = (id: string) => OS_INTENT_CASES.find((item) => item.id === id)!;
const complete = { type: "done" as const, stopReason: "end_turn", inputTokens: 30, outputTokens: 10 };
const sourceId = (system: string) => /sourceId is "([^"]+)"/.exec(system)![1];
afterEach(() => vi.unstubAllGlobals());

describe("frozen intent plan and launcher", () => {
  it("runs precisely eleven cases once with explicit preselected modes and no selection flags", () => {
    expect(plannedIntentCases().map((item) => item.id)).toEqual(Array.from({ length: 11 }, (_, index) => `intent-${String(index + 1).padStart(2, "0")}`));
    expect(plannedIntentCases().map(modeForIntentCase)).toEqual([
      "ask", "ask", "draft", "knowledge", "knowledge", "ask", "draft", "knowledge", "draft", "draft", "both",
    ]);
    expect(intentCheckArguments(["--run"])).toEqual({ fullRun: true });
    expect(() => intentCheckArguments([])).toThrow("--run");
    expect(() => intentCheckArguments(["--run", "--case", "intent-03"])).toThrow();
    expect(() => intentCheckArguments(["--run", "--limit", "1"])).toThrow();
  });
});

describe("opaque read-only fictional context", () => {
  it("uses company context without exposing case IDs, expectations or criteria", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in unit test"); }));
    const item = find("intent-06");
    const fixture = intentContextFixture(item, 6);
    const context = await buildCompanyContext(fixture.db, fixture.companyId);
    expect(context).toContain("Juniper Queue");
    expect(context).toContain("Reply to Cora about her warranty question");
    expect(context).not.toContain(item.id);
    expect(context).not.toContain("synthetic_intent_context");
    expect(context).not.toContain(item.humanReview[0]);
    expect(fixture.companyId).toBe(opaqueIntentId(6, "company"));
    expect(fixture.companyId).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-a[a-f\d]{3}-[a-f\d]{12}$/);
    expect(fetch).not.toHaveBeenCalled();
    fixture.dispose();
    expect(fixture.isDisposed()).toBe(true);
  });

  it("blocks every business-table write attempt and preserves the snapshot", () => {
    const fixture = intentContextFixture(find("intent-04"), 4);
    const before = fixture.snapshot();
    expect(() => fixture.db.from("os_company_memory").insert({ company_id: fixture.companyId, fact: "Wrong" })).toThrow("read-only");
    expect(() => fixture.db.from("os_work_items").update({ status: "completed" })).toThrow("read-only");
    expect(fixture.blockedWrites()).toBe(2);
    expect(fixture.snapshot()).toEqual(before);
    fixture.dispose();
  });
});

describe("proposal-only instrument against fake model turns", () => {
  it("retains model input, raw prose and trusted receipt separately for a direct answer", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No model network in unit test"); }));
    const trace = vi.fn();
    const turn: ModelTurn = async function* (args) {
      expect(args.tools).toEqual([]);
      yield { type: "text", text: "The recorded standard remote demonstration lasts 25 minutes." };
      yield complete;
    };
    const result = await runIntentAttempt({ item: find("intent-01"), attempt: 1, turn, timeoutMs: 1000, trace });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.rawModelText).toContain("25 minutes");
    expect(result.reply).toContain("No Work or company knowledge was saved");
    expect(result.rawModelCalls[0].input).toMatchObject({ tools: [] });
    expect(result.attemptedTools).toEqual([]);
    expect(result.input.system).not.toContain("intent-01");
    expect(result.humanReview).toBe("pending");
    expect(result.before).toEqual(result.after);
    expect(result.writerCalls).toBe(0);
    expect(result.cleanup).toBe("disposed_verified");
    expect(trace.mock.calls.some(([event]) => event.kind === "provider_event")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("captures a refused off-mode tool attempt even when no proposal was staged", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual([]);
        yield { type: "tool", id: "unwanted", name: "propose_work", input: {
          title: "Send Cora reply", body: "Send the existing message", lane: "sales", kind: "task",
          outwardAction: "send", citations: [{ sourceId: sourceId(args.system), quote: find("intent-06").fixture.founderMessage }],
        } };
        yield { ...complete, stopReason: "tool_use" };
      } else {
        yield { type: "text", text: "I cannot approve or send that existing reply." };
        yield complete;
      }
    };
    const result = await runIntentAttempt({ item: find("intent-06"), attempt: 6, turn, timeoutMs: 1000 });
    expect(result.status).toBe("completed");
    expect(result.proposals).toEqual([]);
    expect(result.attemptedTools).toHaveLength(1);
    expect(result.attemptedTools[0]).toMatchObject({ name: "propose_work", offeredInMode: false });
    expect(result.structuralFindings).toContain("Unavailable tool attempted: propose_work");
    expect(result.structuralFindings.some((finding) => finding.startsWith("Tool or proposal refused"))).toBe(true);
    expect(result.before).toEqual(result.after);
  });

  it("stages one reviewable draft but leaves semantic quality for transcript review", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_work"]);
        yield { type: "tool", id: "draft", name: "propose_work", input: {
          title: "Nessa demonstration reply", body: "Hi Nessa,\nOur 25-minute remote demonstration is booked for 18 November 2026 at 09:30 UTC. Does that time suit you?\nBest,\nJuniper Queue",
          lane: "sales", kind: "email", outwardAction: "send",
          citations: [{ sourceId: sourceId(args.system), quote: find("intent-03").fixture.founderMessage }],
        } };
        yield { ...complete, stopReason: "tool_use" };
      } else {
        expect(args.tools).toEqual(["propose_work"]);
        yield { type: "text", text: "The draft is ready for review; it is not saved or sent." };
        yield complete;
      }
    };
    const result = await runIntentAttempt({ item: find("intent-03"), attempt: 3, turn, timeoutMs: 1000 });
    expect(result.status).toBe("completed");
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].payload.type).toBe("work");
    expect(result.proposals[0].status).toBe("proposed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.humanReview).toBe("pending"); // "booked" is false; this is deliberately not a semantic judge.
    expect(result.writerCalls).toBe(0);
    expect(result.humanConfirmationsSimulated).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("mirrors the route's pre-storage citation refusal in the local evaluator", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        yield { type: "tool", id: "bad-citation", name: "propose_work", input: {
          title: "Nessa reply", body: "Hi Nessa, would the proposed time work?", lane: "sales", kind: "email", outwardAction: "send",
          citations: [{ sourceId: sourceId(args.system), quote: "a sentence absent from the founder message" }],
        } };
        yield { ...complete, stopReason: "tool_use" };
      } else {
        yield { type: "text", text: "I could not prepare that suggestion for review." };
        yield complete;
      }
    };
    const result = await runIntentAttempt({ item: find("intent-03"), attempt: 3, turn, timeoutMs: 1000 });
    expect(result.status).toBe("completed");
    expect(result.proposals).toEqual([]);
    expect(result.loopEvents).toContainEqual(expect.objectContaining({ type: "refused", reason: expect.stringContaining("permitted source") }));
    expect(result.reply).not.toContain("could not be confirmed");
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("stages a customer-scoped knowledge suggestion in knowledge mode only", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_knowledge"]);
        yield { type: "tool", id: "knowledge", name: "propose_knowledge", input: {
          statement: "Oak Lantern Cycles replacement-parts quotes require a manual stock check before a delivery date is given.",
          kind: "constraint", scope: { type: "customer", label: "Oak Lantern Cycles" },
          duration: { type: "until_date", date: "2026-11-30" },
          citations: [{ sourceId: sourceId(args.system), quote: find("intent-04").fixture.founderMessage }],
        } };
        yield { ...complete, stopReason: "tool_use" };
      } else {
        yield { type: "text", text: "This customer-specific knowledge is ready for your review; it is not saved." };
        yield complete;
      }
    };
    const result = await runIntentAttempt({ item: find("intent-04"), attempt: 4, turn, timeoutMs: 1000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].payload).toMatchObject({ type: "knowledge", scope: { type: "customer", label: "Oak Lantern Cycles" }, duration: { type: "until_date", date: "2026-11-30" } });
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("leaves existing Work alone in Draft mode even though a work-proposal tool is available", async () => {
    const turn: ModelTurn = async function* (args) {
      expect(args.tools).toEqual(["propose_work"]);
      yield { type: "text", text: "I cannot approve or send Farah's existing reply. It remains in Work for you to handle." };
      yield complete;
    };
    const result = await runIntentAttempt({ item: find("intent-10"), attempt: 10, turn, timeoutMs: 1000 });
    expect(result.mode).toBe("draft");
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.attemptedTools).toEqual([]);
    expect(result.proposals).toEqual([]);
    expect(result.before).toEqual(result.after);
  });

  it("refuses an exact duplicate of existing Work before staging a Draft-mode suggestion", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        yield { type: "tool", id: "copy", name: "propose_work", input: {
          title: "Reply to Farah about her repair estimate",
          body: "Hi Farah, I will check the repair estimate and get back to you with the confirmed figures.",
          lane: "sales", kind: "reply", outwardAction: "send",
          citations: [{ sourceId: sourceId(args.system), quote: find("intent-10").fixture.founderMessage }],
        } };
        yield { ...complete, stopReason: "tool_use" };
      } else {
        yield { type: "text", text: "Review the copied reply." };
        yield complete;
      }
    };
    const result = await runIntentAttempt({ item: find("intent-10"), attempt: 10, turn, timeoutMs: 1000 });
    expect(result.attemptedTools).toHaveLength(1);
    expect(result.proposals).toHaveLength(0);
    expect(result.structuralFindings).not.toContain("work proposal count 1, expected 0..0");
    expect(result.before).toEqual(result.after);
  });

  it("keeps Both-mode draft and scoped knowledge as separate unsaved suggestions", async () => {
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_work", "propose_knowledge"]);
        yield { type: "tool", id: "draft", name: "propose_work", input: {
          title: "Remote walkthrough note to Sela",
          body: "Hi Sela,\nCould we have a 20-minute remote walkthrough on 3 February 2027 at 14:00 UTC? Please let me know whether that time suits you.\nBest,\nJuniper Queue",
          lane: "sales", kind: "email", outwardAction: "send",
          citations: [{ sourceId: sourceId(args.system), quote: find("intent-11").fixture.founderMessage }],
        } };
        yield { type: "tool", id: "knowledge", name: "propose_knowledge", input: {
          statement: "For the Willow Parts Trial project, stock updates are reconciled manually each Friday.",
          kind: "constraint", scope: { type: "project", label: "Willow Parts Trial" },
          duration: { type: "until_date", date: "2027-01-31" },
          citations: [{ sourceId: sourceId(args.system), quote: find("intent-11").fixture.founderMessage }],
        } };
        yield { ...complete, stopReason: "tool_use" };
      } else {
        yield { type: "text", text: "The email draft and project rule are ready for separate review. Neither is saved, booked or sent." };
        yield complete;
      }
    };
    const result = await runIntentAttempt({ item: find("intent-11"), attempt: 11, turn, timeoutMs: 1000 });
    expect(result.mode).toBe("both");
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.attemptedTools.map((tool) => tool.name)).toEqual(["propose_work", "propose_knowledge"]);
    expect(result.proposals.map((proposal) => proposal.payload.type)).toEqual(["work", "knowledge"]);
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("records an incomplete provider turn and partial prose without turning it into success", async () => {
    const turn: ModelTurn = async function* () { yield { type: "text", text: "Partial answer" }; };
    const result = await runIntentAttempt({ item: find("intent-02"), attempt: 2, turn, timeoutMs: 1000 });
    expect(result.status).toBe("runtime_error");
    expect(result.error?.message).toBe("provider_incomplete");
    expect(result.rawModelText).toBe("Partial answer");
    expect(result.reply).toContain("Partial answer");
    expect(result.usageCoverage).toBe("partial");
    expect(result.cleanup).toBe("disposed_verified");
  });

  it("awaits cancellation and preserves timed-out attempts in the denominator", async () => {
    const turn: ModelTurn = async function* ({ signal }) {
      yield { type: "text", text: "Starting" };
      await new Promise<void>((_, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
    };
    const result = await runIntentAttempt({ item: find("intent-01"), attempt: 1, turn, timeoutMs: 20 });
    expect(result.status).toBe("timed_out");
    expect(result.rawModelText).toBe("Starting");
    expect(result.rawModelCalls[0].error).toBeDefined();
    expect(result.cleanup).toBe("disposed_verified");
  });
});
