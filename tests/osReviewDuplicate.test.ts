import { describe, expect, it, vi } from "vitest";
import type { Db, ModelTurn } from "@/lib/osCofounder";
import type { ProposalPayload } from "@/lib/osReviewBoundary";
import { rejectExistingOpenWork } from "@/lib/osReviewDuplicate";
import { runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import { OS_INTENT_CASES } from "@/lib/osIntentCases";
import { runIntentAttempt } from "./helpers/osIntentHarness";
import { scenarioFixture } from "./helpers/scenarioFixture";

type Work = Extract<ProposalPayload, { type: "work" }>;
const body = "Hi Amari, I will check the availability and reply once it is confirmed.";
const payload = (overrides: Partial<Work> = {}): Work => ({
  type: "work", title: "Amari draft", body, lane: "sales", kind: "reply", outwardAction: "send",
  citations: [{ sourceId: "person-message", quote: "Prepare the reply" }], ...overrides,
});
const existing = (overrides: Record<string, unknown> = {}) => ({
  title: "Original Amari draft", notes: body, lane: "sales", kind: "reply", status: "review", required_action: "send", ...overrides,
});
function fixture(rows: ReturnType<typeof existing>[]) {
  return scenarioFixture({ key: "duplicate_guard", title: "Fictional read check", says: [], expect: {}, humanReviewCriteria: [], openWork: rows });
}

function queryMock(result: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), not: vi.fn(), limit: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.not.mockReturnValue(query);
  query.limit.mockResolvedValue(result);
  const from = vi.fn(() => query);
  return { db: { from } as unknown as Db, from, query };
}

describe("exact existing open Work read preflight", () => {
  it("queries the selected company's exact notes bytes and excludes final statuses before limiting", async () => {
    const db = queryMock({ data: [{ id: "existing" }], error: null });
    const proposed = payload({ body: "  A draft\nwith exact whitespace.  " });
    expect(await rejectExistingOpenWork(db.db, "chosen-company", proposed)).toEqual({ rejected: "duplicate_work" });
    expect(db.from).toHaveBeenCalledExactlyOnceWith("os_work_items");
    expect(db.query.select).toHaveBeenCalledExactlyOnceWith("id");
    expect(db.query.eq.mock.calls).toEqual([["company_id", "chosen-company"], ["notes", proposed.body]]);
    expect(db.query.not).toHaveBeenCalledExactlyOnceWith("status", "in", "(completed,canceled)");
    expect(db.query.limit).toHaveBeenCalledExactlyOnceWith(1);
    expect(db.query.not.mock.invocationCallOrder[0]).toBeLessThan(db.query.limit.mock.invocationCallOrder[0]);
  });

  it.each(["pending", "review", "active", "blocked"])("refuses an exact same-company %s item without changing it", async (status) => {
    const db = fixture([existing({ status })]);
    const before = db.snapshot();
    expect(await rejectExistingOpenWork(db.db, db.companyId, payload())).toEqual({ rejected: "duplicate_work" });
    expect(db.snapshot()).toEqual(before);
    db.dispose();
  });

  it.each(["completed", "canceled"])("allows a fresh draft when only an identical %s item exists", async (status) => {
    const db = fixture([existing({ status })]);
    expect(await rejectExistingOpenWork(db.db, db.companyId, payload())).toBeNull();
    db.dispose();
  });

  it("does not let excluded or foreign rows hide a later matching open company item", async () => {
    const db = fixture([
      existing({ status: "completed" }), existing({ company_id: "other-company" }),
      existing({ status: "canceled" }), existing({ status: "review" }),
    ]);
    expect(await rejectExistingOpenWork(db.db, db.companyId, payload())).toEqual({ rejected: "duplicate_work" });
    db.dispose();
  });

  it("does not refuse a draft belonging only to a different company", async () => {
    const db = fixture([existing({ company_id: "other-company" })]);
    expect(await rejectExistingOpenWork(db.db, db.companyId, payload())).toBeNull();
    db.dispose();
  });

  it("uses body identity even when a duplicate has a different title, lane or kind", async () => {
    const db = fixture([existing({ title: "An existing note", kind: "note", lane: "internal" })]);
    expect(await rejectExistingOpenWork(db.db, db.companyId, payload({ title: "A new title" }))).toEqual({ rejected: "duplicate_work" });
    db.dispose();
  });

  it.each([`${body} `, body.toUpperCase(), body.replace("reply", "respond"), `${body}\n`])("does not claim semantic or whitespace deduplication for %s", async (newBody) => {
    const db = fixture([existing()]);
    expect(await rejectExistingOpenWork(db.db, db.companyId, payload({ body: newBody }))).toBeNull();
    db.dispose();
  });

  it("does not query Work for a Knowledge proposal", async () => {
    const db = queryMock({ data: [{ id: "anything" }], error: null });
    expect(await rejectExistingOpenWork(db.db, "chosen-company", {
      type: "knowledge", statement: "A recorded preference", kind: "preference",
      scope: { type: "company", label: "Fictional company" }, duration: { type: "until_changed" }, citations: payload().citations,
    })).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: { message: "PRIVATE_DATABASE_DETAIL" } },
    { data: [], error: { message: "PRIVATE_DATABASE_DETAIL" } },
    { data: null, error: null }, { data: {}, error: null }, { data: undefined, error: null },
  ])("closes the preflight on read failure or malformed data: %j", async (result) => {
    const db = queryMock(result);
    await expect(rejectExistingOpenWork(db.db, "chosen-company", payload())).rejects.toThrow("review_duplicate_check_unavailable");
  });

  it("closes subsequent staging and does not expose read failure details", async () => {
    const db = queryMock({ data: [], error: { message: "PRIVATE_DATABASE_DETAIL" } });
    const stage = vi.fn(async () => ({ id: "should-not-exist" }));
    const propose = vi.fn(async (value: ProposalPayload) => {
      const rejection = await rejectExistingOpenWork(db.db, "chosen-company", value);
      return rejection ?? stage();
    });
    let round = 0;
    const turn: ModelTurn = async function* () {
      if (++round === 1) {
        for (const id of ["first", "second"]) {
          const draft = payload({ title: id });
          const input = { title: draft.title, body: draft.body, lane: draft.lane };
          yield { type: "tool", name: "propose_work", id, input };
        }
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
    };
    const events: ReviewedTurnEvent[] = [];
    for await (const event of runReviewedTurn({ mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null }, source: { id: "person-message", text: "Prepare the reply" }, system: "Fictional check", history: [], turn, propose, priced: false })) events.push(event);
    expect(propose).toHaveBeenCalledTimes(1);
    expect(stage).not.toHaveBeenCalled();
    expect(events.some((event) => event.type === "proposal")).toBe(false);
    expect(JSON.stringify(events)).toContain("No automatic retry or further staging");
    expect(JSON.stringify(events)).not.toContain("PRIVATE_DATABASE_DETAIL");
  });

  it("keeps exact-body duplicate refusal after the app supplies kind, action and attribution", async () => {
    const db = fixture([existing({ title: "Existing note", lane: "internal", kind: "note", required_action: null })]);
    const before = db.snapshot();
    const stage = vi.fn(async () => ({ id: "new-review-only" }));
    const propose = vi.fn(async (value: ProposalPayload) => (await rejectExistingOpenWork(db.db, db.companyId, value)) ?? stage());
    let round = 0;
    const turn: ModelTurn = async function* () {
      if (++round === 1) {
        yield { type: "tool", name: "propose_work", id: "duplicate", input: { title: "Different title", body, lane: "sales" } };
        yield { type: "tool", name: "propose_work", id: "distinct", input: { title: "Separate requested reply", body: "Hello Amari, please confirm the required quantity.", lane: "sales" } };
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
    };
    const events: ReviewedTurnEvent[] = [];
    try {
      for await (const event of runReviewedTurn({
        mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null },
        source: { id: "person-message", text: "Prepare the reply" }, system: "Fictional check", history: [], turn, propose, priced: false,
      })) events.push(event);
      expect(propose).toHaveBeenCalledTimes(2);
      expect(propose.mock.calls[0][0]).toEqual(payload({ title: "Different title" }));
      expect(stage).toHaveBeenCalledTimes(1);
      expect(events.filter((event) => event.type === "proposal")).toEqual([{ type: "proposal", id: "new-review-only" }]);
      const refused = events.filter((event): event is Extract<ReviewedTurnEvent, { type: "refused" }> => event.type === "refused");
      expect(refused).toHaveLength(1);
      expect(refused[0].reason).toContain("No duplicate was staged or saved");
      const final = events.at(-1);
      if (final?.type !== "done") throw new Error("Missing trusted completion");
      expect(final.text).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0.");
      expect(final.text).toContain("Earlier rejected attempts — Work: 1.");
      expect(final.text).not.toContain(refused[0].reason);
      expect(db.snapshot()).toEqual(before);
    } finally { db.dispose(); }
  });
});

describe("fake-model evaluator mirrors the route's duplicate preflight", () => {
  it("refuses the existing outbound draft and retains a separate requested internal draft", async () => {
    const item = OS_INTENT_CASES.find((item) => item.id === "intent-07")!;
    const existingBody = item.fixture.openWork![0].notes!;
    let rounds = 0;
    const turn: ModelTurn = async function* ({ system }) {
      if (++rounds === 1) {
        const sourceId = /sourceId is "([^"]+)"/.exec(system)![1];
        for (const [id, draft] of [
          ["duplicate", payload({ body: existingBody })],
          ["new-note", payload({ title: "Compare demonstration formats", body: "Compare group demonstrations with individual calls. Attendance data is still missing.", lane: "internal", kind: "note", outwardAction: null })],
        ] as const) {
          const { type: _type, ...input } = draft;
          void _type;
          yield { type: "tool", name: "propose_work", id, input: { ...input, citations: [{ sourceId, quote: item.fixture.founderMessage }] } };
        }
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else {
        yield { type: "text", text: "I cannot send the existing reply. The separate note is ready for review; saving it stores it only." };
        yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
      }
    };
    const trace = vi.fn();
    const result = await runIntentAttempt({ item, attempt: 207, turn, timeoutMs: 1000, trace });
    expect(result.status).toBe("completed");
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].payload).toMatchObject({ type: "work", kind: "note", outwardAction: null });
    expect(result.reply).toContain("No duplicate was staged or saved");
    expect(result.reply).not.toContain("could not be confirmed");
    expect(trace.mock.calls.some(([event]) => event.kind === "proposal_rejected" && event.value.rejected === "duplicate_work")).toBe(true);
    expect(result.before).toEqual(result.after);
    expect(result.writerCalls).toBe(0);
    expect(result.blockedFixtureWrites).toBe(0);
    expect(result.cleanup).toBe("disposed_verified");
  });
});
