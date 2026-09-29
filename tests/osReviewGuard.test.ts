import { describe, expect, it, vi } from "vitest";
import type { ModelEvent, ModelTurn } from "@/lib/osCofounder";
import { parseReviewProposal, type ProposalPayload } from "@/lib/osReviewBoundary";
import { ConfirmedReviewRejection, isReviewGuardReason, reviewProposalGuard } from "@/lib/osReviewGuard";
import { runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";

type Work = Extract<ProposalPayload, { type: "work" }>;
const work = (overrides: Partial<Work> = {}): Work => ({
  type: "work", title: "Reply to Rowan", body: "Hi Rowan, would a call on 12 January 2027 suit you?",
  lane: "sales", kind: "email", outwardAction: "send", citations: [{ sourceId: "founder", quote: "Draft a reply" }], ...overrides,
});
const knowledge = (statement: string): ProposalPayload => ({
  type: "knowledge", statement, kind: "decision", scope: { type: "project", label: "Fictional project" },
  duration: { type: "until_changed" }, citations: [{ sourceId: "founder", quote: "Draft a reply" }],
});
const done: ModelEvent = { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
function call(payload: Work, id: string, extra: Record<string, unknown> = {}): ModelEvent {
  return { type: "tool", name: "propose_work", id, input: { title: payload.title, body: payload.body, lane: payload.lane, ...extra } };
}

describe("new review proposal policy without historical DTO migration", () => {
  const kinds = ["email", "reply", "post", "note", "research", "decision"];
  const actions = ["send", "publish", null, "approve"];
  const expected: Record<string, string | null> = { email: "send", reply: "send", post: "publish", note: null, research: null, decision: null };
  it.each(kinds.flatMap((kind) => actions.map((outwardAction) => ({ kind, outwardAction }))))("requires coherent $kind / $outwardAction metadata", ({ kind, outwardAction }) => {
    expect(reviewProposalGuard(work({ kind, outwardAction }))).toBe(expected[kind] === outwardAction ? null : "work_action");
  });

  it.each(["task", "EMAIL", "email ", "letter", "__proto__", "constructor"])("refuses unsupported new work kind %s", (kind) => {
    expect(reviewProposalGuard(work({ kind }))).toBe("work_kind");
  });

  it("retains old enum strings in historical records without allowing new proposals with them", () => {
    const old = work({ kind: "follow-up", outwardAction: "manual_outreach" });
    expect(parseReviewProposal(old)).toEqual(old);
    expect(reviewProposalGuard(old)).toBe("work_kind");
    const oldAction = work({ outwardAction: "send_email" });
    expect(parseReviewProposal(oldAction)).toEqual(oldAction);
    expect(reviewProposalGuard(oldAction)).toBe("work_action");
  });

  it.each([
    work({ title: "Monday, 12 January 2027 meeting" }),
    work({ body: "Meet Monday, 12 January 2027." }),
    work({ body: "Meet on 31 February 2027." }),
    knowledge("Our project review is Monday, 12 January 2027."),
    knowledge("The project ends 31 June 2027."),
  ])("refuses an inconsistent or impossible date in the proposed artifact", (payload) => {
    const original = structuredClone(payload);
    expect(reviewProposalGuard(payload)).toBe("calendar_date");
    expect(payload).toEqual(original);
    expect(parseReviewProposal(payload)).toEqual(payload);
  });

  it("checks proposed content without treating quoted source text as a new calendar assertion", () => {
    expect(reviewProposalGuard(work({
      title: "Review the meeting date", body: "Please clarify which meeting day you meant.",
      citations: [{ sourceId: "founder", quote: "Monday, 12 January 2027" }],
    }))).toBeNull();
  });

  it("accepts correct calendar statements and preserves the limits of date recognition", () => {
    expect(reviewProposalGuard(work({ body: "Would Tuesday, 12 January 2027 suit you?" }))).toBeNull();
    expect(reviewProposalGuard(knowledge("The project review is mardi le 12 janvier 2027."))).toBeNull();
    expect(reviewProposalGuard(work({ body: "Would next Monday suit you?" }))).toBeNull();
  });

  it("does not pretend metadata consistency proves intended artifact type or claim accuracy", () => {
    expect(reviewProposalGuard(work({ kind: "note", outwardAction: null, body: "Dear customer, we guarantee a 90% reduction." }))).toBeNull();
  });

  it("recognizes only exact trusted refusal reasons", () => {
    for (const reason of ["work_kind", "work_action", "calendar_date", "duplicate_work"]) expect(isReviewGuardReason(reason)).toBe(true);
    for (const value of [undefined, null, {}, "", "__proto__", "current_message_citation", "CALENDAR_DATE"]) expect(isReviewGuardReason(value)).toBe(false);
    const refusal = new ConfirmedReviewRejection("work_action");
    expect(refusal).toBeInstanceOf(Error);
    expect(refusal.reason).toBe("work_action");
  });
});

describe("review loop enforces new proposal policy before staging", () => {
  it("refuses a model action override and calendar date, then stages a separately corrected draft", async () => {
    let round = 0;
    const turn: ModelTurn = async function* () {
      if (++round === 1) {
        yield call(work(), "wrong-action", { outwardAction: null });
        yield call(work({ body: "Meet Monday, 12 January 2027." }), "wrong-date");
        yield { ...done, stopReason: "tool_use" };
      } else if (round === 2) {
        yield call(work({ body: "Would 12 January 2027 suit you?" }), "corrected");
        yield { ...done, stopReason: "tool_use" };
      } else {
        yield { type: "text", text: "One draft is ready for review. Saving it does not send it." };
        yield done;
      }
    };
    const propose = vi.fn(async () => ({ id: "review-only" }));
    const events: ReviewedTurnEvent[] = [];
    for await (const event of runReviewedTurn({ mode: "draft", intent: { draftFormat: "email", knowledgeAssertion: null }, source: { id: "founder", text: "Draft a reply" }, system: "Fictional test", history: [], turn, propose, priced: false })) events.push(event);
    expect(propose).toHaveBeenCalledExactlyOnceWith(work({ body: "Would 12 January 2027 suit you?" }));
    expect(events.filter((event) => event.type === "refused")).toHaveLength(2);
    expect(events.filter((event) => event.type === "proposal")).toEqual([{ type: "proposal", id: "review-only" }]);
    const final = events.at(-1);
    expect(final).toMatchObject({ type: "done", costUsd: 0 });
    if (final?.type !== "done") throw new Error("Missing trusted completion");
    const refusals = events.filter((event): event is Extract<ReviewedTurnEvent, { type: "refused" }> => event.type === "refused");
    expect(refusals[0].reason).toMatch(/field|format|metadata/i);
    expect(refusals[1].reason).toContain("weekday that disagrees");
    expect(final.text).not.toContain(refusals[0].reason);
    expect(final.text).not.toContain(refusals[1].reason);
    expect(final.text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0.");
    expect(final.text).toContain("Earlier rejected attempts — Work: 2.");
    expect(final.text).toContain("not saved to Work/company knowledge, approved or sent");
    expect(final.text).not.toContain("could not be confirmed");
  });
});
