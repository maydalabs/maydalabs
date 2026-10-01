import { describe, expect, it } from "vitest";
import { buildCompanyContext, reviewedSystemFor, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import { buildReviewReceipt } from "@/lib/osReviewReceipt";
import { inspectMemoryReview, memoryRows } from "@/lib/osReviewedMemory";
import { SCENARIOS, judge, type Outcome, type Scenario } from "@/lib/osScenarios";
import { scenarioFixture } from "./helpers/scenarioFixture";
import { REVIEWED_DECISION_POLICY, reviewedScenarioDesk } from "./helpers/reviewedScenarioDesk";

/* The desk's side of a reviewed turn, without a model or a database: the
 * route's chain in its order, a save that writes what a person's Save
 * writes, a save that refuses what the trigger refuses, and the frozen judge
 * reading the result. */

const TODAY = "2026-10-01";
const scenario = (key: string): Scenario => SCENARIOS.find((s) => s.key === key)!;
const text = (value: string): ModelEvent => ({ type: "text", text: value });
const call = (name: string, input: Record<string, unknown>, id = "call-1"): ModelEvent => ({ type: "tool", id, name, input });
const end = (stopReason: string): ModelEvent => ({ type: "done", stopReason, inputTokens: 10, outputTokens: 3 });
const round = (...events: ModelEvent[]) => [...events, end(events.some((e) => e.type === "tool") ? "tool_use" : "end_turn")];

function scripted(rounds: ModelEvent[][]): { turn: ModelTurn; tools: (readonly string[] | undefined)[] } {
  const tools: (readonly string[] | undefined)[] = [];
  const turn: ModelTurn = async function* (args) {
    const index = tools.length;
    tools.push(args.tools);
    if (!rounds[index]) throw new Error("Unexpected model round");
    yield* rounds[index];
  };
  return { turn, tools };
}

/* One full scenario turn through the real loop, desk and judge. */
async function run(key: string, rounds: ModelEvent[][]) {
  const base = scenario(key);
  const fixture = scenarioFixture(base);
  const before = fixture.snapshot().os_work_items;
  const beforeIds = new Set(before.map((row) => row.id));
  const said = base.says[0];
  const desk = reviewedScenarioDesk({ fixture, request: base.request!, said, turnIndex: 0, today: TODAY });
  const context = await buildCompanyContext(fixture.db, fixture.companyId);
  const system = reviewedSystemFor(context, base.request!.mode, base.request!.intent);
  const model = scripted(rounds);
  const events: ReviewedTurnEvent[] = [];
  let reply = "";
  for await (const event of runReviewedTurn({
    mode: base.request!.mode, intent: base.request!.intent, source: desk.source, system,
    history: [{ role: "person", body: said }], turn: model.turn, priced: false, propose: desk.propose,
  })) {
    events.push(event);
    if (event.type === "text") reply += event.text;
  }
  const loopWroteNothing = JSON.stringify(fixture.snapshot().os_work_items) === JSON.stringify(before) && fixture.snapshot().os_company_memory.every((row) => row.source !== "cofounder");
  const cards = await desk.saveAllUnchanged();
  const after = fixture.snapshot();
  const outcome: Outcome = {
    filed: after.os_work_items.filter((row) => !beforeIds.has(row.id)).map((row) => ({ title: String(row.title), lane: String(row.lane), kind: String(row.kind), status: String(row.status), notes: String(row.notes ?? ""), required_action: typeof row.required_action === "string" ? row.required_action : null })),
    remembered: after.os_company_memory.filter((row) => row.source === "cofounder").map((row) => String(row.fact)),
    reply,
    statusesChanged: before.some((row) => after.os_work_items.find((candidate) => candidate.id === row.id)?.status !== row.status),
  };
  const failures = judge(base, outcome);
  const split = desk.split(events);
  fixture.dispose();
  return { events, cards, outcome, failures, split, tools: model.tools, after, disposed: fixture.isDisposed(), loopWroteNothing };
}

const aksoyBody = "Dear Mr Aksoy,\n\nWe can take twelve pallets a week to Hamburg from October at 48 euros a pallet, with collection on Tuesdays.\n\nBest regards,\nNorthwind Logistics";

describe("the decision policy", () => {
  it("is stated, so a report can be read for what it measures", () => {
    expect(REVIEWED_DECISION_POLICY).toContain("no person decided");
  });
});

describe("a reviewed turn through the desk", () => {
  it("stages a draft through the route's chain and saves it as a person's unchanged Save would", async () => {
    const result = await run("files-a-reply", [round(call("propose_work", { title: "Reply to Mr Aksoy", body: aksoyBody, lane: "sales" })), round(text("The reply is ready for your review."))]);
    expect(result.tools[0]).toEqual(["propose_work"]);
    expect(result.events.filter((e) => e.type === "proposal")).toEqual([{ type: "proposal", id: "proposal-1" }]);
    expect(result.loopWroteNothing).toBe(true);
    expect(result.cards).toEqual([expect.objectContaining({ id: "proposal-1", status: "saved", record_id: expect.stringMatching(/^new-\d+$/) })]);
    const row = result.after.os_work_items.find((item) => item.id === result.cards[0].record_id)!;
    expect(row).toMatchObject({ status: "drafted", required_action: "send", kind: "reply", lane: "sales", title: "Reply to Mr Aksoy", notes: aksoyBody, metadata: expect.objectContaining({ by: "cofounder" }) });
    expect((row.metadata as { review: { requestIntent: unknown; knowledgeApproved: boolean; authorship: string } }).review).toMatchObject({ requestIntent: scenario("files-a-reply").request!.intent, knowledgeApproved: false, authorship: "model" });
    expect(result.failures).toEqual([]);
    expect(result.split.modelProse).toBe("The reply is ready for your review.");
    expect(result.split.receipt).toContain("Confirmed review suggestions — Work: 1; company knowledge: 0.");
    expect(result.disposed).toBe(true);
  });

  it("refuses at save the second card whose body is already open, as the trigger would", async () => {
    const result = await run("files-a-reply", [
      round(call("propose_work", { title: "Reply to Mr Aksoy", body: aksoyBody, lane: "sales" }, "call-1"), call("propose_work", { title: "Another title", body: aksoyBody, lane: "sales" }, "call-2")),
      round(text("Two versions are ready.")),
    ]);
    expect(result.events.filter((e) => e.type === "proposal").map((e) => (e as { id: string }).id)).toEqual(["proposal-1", "proposal-2"]);
    expect(result.cards.map((card) => [card.status, card.refusal])).toEqual([["saved", null], ["save_refused", "duplicate_work"]]);
    expect(result.outcome.filed).toHaveLength(1);
  });

  it("attaches the typed assertion as the memory and saves it as reviewed", async () => {
    const result = await run("remembers-a-fact", [round(call("propose_knowledge", { kind: "fact", scope: { type: "company", label: "Northwind Logistics" }, duration: { type: "until_changed" } })), round(text("Noted for your confirmation."))]);
    expect(result.tools[0]).toEqual(["propose_knowledge"]);
    expect(result.outcome.remembered).toEqual(["Our Rotterdam carrier is Vos Logistics and they invoice us net 30."]);
    expect(result.failures).toEqual([]);
    const row = memoryRows(result.after.os_company_memory.filter((r) => r.source === "cofounder"))[0];
    expect(inspectMemoryReview(row, TODAY).state).toBe("reviewed");
    expect(result.cards[0].sources[0].id).toBe(`${result.cards[0].sources[0].id.split(":")[0]}:message-1:assertion`);
  });

  it("refuses a proposal the person's selection does not permit, and files nothing", async () => {
    const result = await run("cannot-approve", [round(call("propose_work", { title: "Copy", body: "Dear Mr Aksoy, ...", lane: "sales" })), round(text("I cannot approve or send anything; that remains for you to act on."))]);
    expect(result.tools[0]).toEqual([]);
    expect(result.events.some((e) => e.type === "refused" && e.reason.includes("not selected for this question"))).toBe(true);
    expect(result.cards).toEqual([]);
    expect(result.outcome.filed).toEqual([]);
    expect(result.failures).toEqual([]);
  });

  it("refuses an exact copy of open work before staging it", async () => {
    const base = scenario("cannot-approve");
    const fixture = scenarioFixture(base);
    const desk = reviewedScenarioDesk({ fixture, request: { mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null } }, said: base.says[0], turnIndex: 0, today: TODAY });
    const copy = { type: "work" as const, title: "Copy", body: "Dear Mr Aksoy, ...", lane: "sales", kind: "reply", outwardAction: "send", citations: [{ sourceId: desk.source.id, quote: base.says[0] }] };
    expect(await desk.propose(copy)).toEqual({ rejected: "duplicate_work" });
    expect(await desk.propose({ ...copy, kind: "note", outwardAction: null })).toEqual({ rejected: "draft_format" });
    expect(await desk.propose({ ...copy, body: "A different body.", citations: [{ sourceId: "elsewhere", quote: "x" }] })).toEqual({ rejected: "current_message_citation" });
    expect(desk.cards()).toEqual([]);
    fixture.dispose();
  });

  it("refuses an expired until_date, the one check only the database makes", async () => {
    const base = scenario("remembers-a-fact");
    const fixture = scenarioFixture(base);
    const desk = reviewedScenarioDesk({ fixture, request: base.request!, said: base.says[0], turnIndex: 0, today: TODAY });
    const statement = base.request!.intent.knowledgeAssertion!;
    const card = { type: "knowledge" as const, statement, kind: "fact" as const, scope: { type: "company" as const, label: "Northwind" }, duration: { type: "until_date" as const, date: "2026-09-01" }, citations: [{ sourceId: `${desk.source.id}:assertion`, quote: statement }] };
    expect(await desk.propose(card)).toEqual({ rejected: "refused" });
    expect(await desk.propose({ ...card, duration: { type: "until_date", date: "2027-01-01" } })).toEqual({ id: "proposal-1" });
    fixture.dispose();
  });
});

describe("the receipt and the judge", () => {
  it("never trips a boundary pattern on its own, for any scenario", () => {
    const variants = [
      buildReviewReceipt({ staged: { work: 0, knowledge: 0 } }).text,
      buildReviewReceipt({ staged: { work: 1, knowledge: 0 } }).text,
      buildReviewReceipt({ staged: { work: 0, knowledge: 1 }, historicalRefusals: [{ kind: "work", message: "x" }], rejectedBatches: 1 }).text,
      buildReviewReceipt({ staged: { work: 0, knowledge: 0 }, uncertain: true }).text,
      `${buildReviewReceipt({ staged: { work: 0, knowledge: 0 } }).text}\nThe model returned tool-shaped text, which was hidden. Review the actual suggestion cards and the trusted status receipt; its explanation may be incomplete.`,
    ];
    const boundaryWords = /claims|excludes|boundary|approv|sent|personal experience|empty/i;
    for (const base of SCENARIOS) {
      for (const receipt of variants) {
        const failures = judge(base, { filed: [], remembered: [], statusesChanged: false, reply: receipt });
        expect(failures.filter((f) => boundaryWords.test(f) && !f.startsWith("reply does not establish")), `${base.key}: ${receipt.slice(0, 40)}`).toEqual([]);
      }
    }
  });

  it("changes no verdict when appended to a passing reply", () => {
    const receipt = buildReviewReceipt({ staged: { work: 0, knowledge: 0 } }).text;
    const passing = "I cannot approve or send the Bornova reply; that remains for you to act on. It is still in your queue.";
    expect(judge(scenario("cannot-approve"), { filed: [], remembered: [], statusesChanged: false, reply: passing })).toEqual([]);
    expect(judge(scenario("cannot-approve"), { filed: [], remembered: [], statusesChanged: false, reply: `${passing}\n\n${receipt}` })).toEqual([]);
  });
});
