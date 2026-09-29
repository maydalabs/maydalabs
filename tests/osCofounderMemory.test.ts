import { describe, expect, it, vi } from "vitest";
import { rememberFact, type Db, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { runCofounderTurn, type TurnEvent } from "@/lib/osCofounderRun";

type Input = Record<string, unknown>;
type WriteOutcome = "saved" | "returned" | "thrown";
const firstFact = "Friday is our regular collection day.";
const secondFact = "Every crate must carry the customer reference.";

// An insert-only fake makes extra reads fail. Failed attempts can have already
// persisted: loss of a receipt is not evidence that no write happened.
function database(outcomes: WriteOutcome[] = [], afterInsert?: () => void) {
  const persisted: { table: string; rows: Input[] }[] = [];
  const insert = vi.fn(async (table: string, input: Input | Input[]) => {
    persisted.push({ table, rows: structuredClone(Array.isArray(input) ? input : [input]) });
    afterInsert?.();
    const outcome = outcomes[insert.mock.calls.length - 1] ?? "saved";
    if (outcome === "thrown") throw new Error("PRIVATE_MEMORY_DATABASE_DETAIL");
    if (outcome === "returned") return { error: { message: "PRIVATE_MEMORY_DATABASE_DETAIL" } };
    return { error: null };
  });
  const from = vi.fn((table: string) => ({ insert: (input: Input | Input[]) => insert(table, input) }));
  return { db: { from } as unknown as Db, from, insert, persisted };
}

function remember(fact: unknown = firstFact, id = "memory-1", kind = "fact"): ModelEvent {
  return { type: "tool", id, name: "remember", input: { fact, kind } };
}

function round(events: ModelEvent[] = []): ModelEvent[] {
  return [
    ...events,
    { type: "done", stopReason: events.some((event) => event.type === "tool") ? "tool_use" : "end_turn", inputTokens: 10, outputTokens: 3 },
  ];
}

function scripted(rounds: ModelEvent[][]) {
  const calls: Parameters<ModelTurn>[0][] = [];
  const turn: ModelTurn = async function* (args) {
    const index = calls.length;
    calls.push({ ...args, messages: structuredClone(args.messages) });
    if (!rounds[index]) throw new Error("Unexpected additional model call");
    yield* rounds[index];
  };
  return { turn, calls };
}

async function collect(db: Db, turn: ModelTurn, signal?: AbortSignal, events: TurnEvent[] = []) {
  for await (const event of runCofounderTurn({
    supabase: db,
    companyId: "selected-company",
    system: "Synthetic memory-test instructions",
    history: [{ role: "person", body: "Remember these enduring company facts." }],
    turn,
    priced: false,
    signal,
  })) events.push(event);
  return events;
}

function done(events: TurnEvent[]) {
  const event = events.find((candidate) => candidate.type === "done");
  expect(event).toBeDefined();
  return event as Extract<TurnEvent, { type: "done" }>;
}

function results(call: Parameters<ModelTurn>[0]) {
  return call.messages.at(-1)?.content as { type: string; tool_use_id: string; content: string; is_error?: boolean }[];
}

describe("memory write outcome classification", () => {
  it.each([undefined, "", " \n\t "])("rejects invalid fact %j before attempting a write", async (fact) => {
    const fake = database();
    expect(await rememberFact(fake.db, "selected-company", { fact })).toMatchObject({ ok: false, retryable: true });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it.each(["returned", "thrown"] as const)("marks a %s database outcome uncertain without exposing database details", async (outcome) => {
    const fake = database([outcome]);
    const result = await rememberFact(fake.db, "selected-company", { fact: firstFact });
    expect(result).toMatchObject({ ok: false, retryable: false });
    expect(JSON.stringify(result)).toMatch(/confirm|uncertain/i);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_MEMORY_DATABASE_DETAIL");
    expect(fake.insert).toHaveBeenCalledTimes(1);
  });

  it("preserves a memory at the 2000-character limit without truncating it", async () => {
    const fake = database();
    const fact = "x".repeat(2000);
    expect(await rememberFact(fake.db, "selected-company", { fact })).toMatchObject({ ok: true, fact });
    expect(fake.persisted[0].rows[0].fact).toBe(fact);
  });

  it("rejects an overlong memory before attempting any write", async () => {
    const fake = database();
    const result = await rememberFact(fake.db, "selected-company", { fact: "x".repeat(2001) });
    expect(result).toMatchObject({ ok: false, retryable: true, error: expect.stringContaining("2000") });
    expect(fake.from).not.toHaveBeenCalled();
  });
});

describe("one write per normalized fact in a conversation turn", () => {
  it.each(["memory-1", "memory-2"])("acknowledges an already saved fact across rounds with tool ID %s", async (repeatId) => {
    const fake = database();
    const model = scripted([round([remember()]), round([remember(firstFact, repeatId)]), round()]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.persisted).toEqual([{ table: "os_company_memory", rows: [{ company_id: "selected-company", fact: firstFact, kind: "fact", source: "cofounder" }] }]);
    expect(events.filter((event) => event.type === "learned")).toEqual([{ type: "learned", fact: firstFact }]);
    expect(events.filter((event) => event.type === "refused")).toEqual([]);
    expect(results(model.calls[2])[0]).toMatchObject({ content: expect.stringMatching(/already saved/i) });
    expect(results(model.calls[2])[0].content).toContain(firstFact);
    expect(results(model.calls[2])[0].is_error).not.toBe(true);
    expect(done(events).text).toContain(firstFact);
    expect(done(events).text.split(firstFact)).toHaveLength(2);
    expect(done(events)).toMatchObject({ inputTokens: 30, outputTokens: 9, costUsd: 0 });
    expect(model.calls.every((call) => call.tools?.includes("remember"))).toBe(true);
  });

  it.each([
    ["exact duplicate", firstFact, "fact"],
    ["whitespace variant", " \n Friday\t is  our regular\ncollection day. \t", "fact"],
    ["different kind", firstFact, "constraint"],
  ])("saves one memory for a same-batch %s", async (_, repeatedFact, kind) => {
    const fake = database();
    const model = scripted([round([remember(), remember(repeatedFact, "memory-2", kind)]), round()]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "learned")).toHaveLength(1);
    expect(results(model.calls[1]).map((result) => result.tool_use_id)).toEqual(["memory-1", "memory-2"]);
    expect(results(model.calls[1])[1].content).toMatch(/already saved/i);
    expect(results(model.calls[1])[1].is_error).not.toBe(true);
    expect(fake.from.mock.calls.map(([table]) => table)).toEqual(["os_company_memory"]);
  });

  it.each(["same batch", "later round"])("allows two genuinely different facts in the %s", async (placement) => {
    const fake = database();
    const model = scripted(placement === "same batch"
      ? [round([remember(), remember(secondFact, "memory-2")]), round()]
      : [round([remember()]), round([remember(secondFact, "memory-2")]), round()]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(2);
    expect(fake.persisted.flatMap((write) => write.rows.map((row) => row.fact))).toEqual([firstFact, secondFact]);
    expect(events.filter((event) => event.type === "learned")).toEqual([{ type: "learned", fact: firstFact }, { type: "learned", fact: secondFact }]);
    expect(done(events).text).toContain(firstFact);
    expect(done(events).text).toContain(secondFact);
  });

  it("does not treat paraphrases as normalized-text duplicates", async () => {
    const fake = database();
    const model = scripted([round([remember(), remember("Our regular collection happens on Friday.", "memory-2")]), round()]);
    await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(2);
  });

  it("keeps its ledger local to one turn, without promising cross-request idempotency", async () => {
    const fake = database();
    for (let request = 0; request < 2; request += 1) {
      const model = scripted([round([remember()]), round()]);
      expect((await collect(fake.db, model.turn)).filter((event) => event.type === "learned")).toHaveLength(1);
    }
    expect(fake.insert).toHaveBeenCalledTimes(2);
  });

  it("allows a corrected validation-only failure because it made no write attempt", async () => {
    const fake = database();
    const model = scripted([round([remember(" \n ")]), round([remember()]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "learned")).toEqual([{ type: "learned", fact: firstFact }]);
    expect(results(model.calls[1])[0].is_error).toBe(true);
    expect(results(model.calls[2])[0].is_error).not.toBe(true);
    expect(done(events).text).toContain(firstFact);
    expect(done(events).text).not.toContain("a memory needs to say something");
  });

  it("allows an overlong fact to be repaired even when its normalized identity is unchanged", async () => {
    const fake = database();
    const model = scripted([round([remember(`Friday${" ".repeat(2000)}is our regular collection day.`)]), round([remember()]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.persisted[0].rows[0].fact).toBe(firstFact);
    expect(results(model.calls[1])[0]).toMatchObject({ is_error: true, content: expect.stringContaining("2000") });
    expect(results(model.calls[2])[0].is_error).not.toBe(true);
    expect(done(events).text).toContain(firstFact);
    expect(done(events).text).not.toContain("2000");
  });
});

describe("memory receipts alongside other tool outcomes", () => {
  const invalidWork: ModelEvent = { type: "tool", id: "work", name: "file_work", input: { title: "Collection note", notes: "" } };
  const validWork: ModelEvent = { type: "tool", id: "work", name: "file_work", input: { title: "Collection note", notes: "Prepare Friday's crates." } };
  const unknownTool: ModelEvent = { type: "tool", id: "unknown", name: "unsupported_tool", input: {} };

  it.each([
    ["work validation", invalidWork, "complete artifact"],
    ["unknown tool", unknownTool, "unsupported_tool"],
  ] as const)("retains an earlier %s error after a successful memory save", async (_, failedTool, errorFragment) => {
    const fake = database();
    const model = scripted([round([failedTool]), round([remember()]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(done(events).text).toContain(firstFact);
    expect(done(events).text).toContain(errorFragment);
  });

  it("retains a memory validation error after a successful work save", async () => {
    const fake = database();
    const model = scripted([round([remember("")]), round([validWork]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(done(events).text).toContain("Collection note");
    expect(done(events).text).toContain("a memory needs to say something");
  });

  it("retains memory uncertainty after a successful work save", async () => {
    const fake = database(["returned", "saved"]);
    const model = scripted([round([remember()]), round([validWork]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(2);
    expect(events.filter((event) => event.type === "learned")).toHaveLength(0);
    expect(events.filter((event) => event.type === "filed")).toHaveLength(1);
    expect(done(events).text).toContain("Collection note");
    expect(done(events).text).toMatch(/confirm whether the memory|uncertain/i);
  });

  it("reports an invalid first fact even when a different fact succeeds in the same batch", async () => {
    const fake = database();
    const model = scripted([round([remember("x".repeat(2001)), remember(secondFact, "memory-2")]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "learned")).toEqual([{ type: "learned", fact: secondFact }]);
    expect(done(events).text).toContain(secondFact);
    expect(done(events).text).toContain("2000");
  });
});

describe("uncertain memory writes and factual fallback receipts", () => {
  it.each(["returned", "thrown"] as const)("never repeats a possibly committed fact after a %s failure", async (outcome) => {
    const fake = database([outcome]);
    const model = scripted([
      round([remember()]),
      round([remember(" Friday\t is our regular collection day. ", "memory-2", "constraint")]),
      round(),
    ]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.persisted).toHaveLength(1);
    expect(events.filter((event) => event.type === "learned")).toEqual([]);
    expect(results(model.calls[2])[0].is_error).toBe(true);
    expect(results(model.calls[2])[0].content).toMatch(/confirm|uncertain/i);
    expect(results(model.calls[2])[0].content).not.toMatch(/already saved/i);
    expect(done(events).text).toMatch(/confirm|uncertain/i);
    expect(done(events).text).not.toMatch(/(?:added to your company memory|already saved)/i);
    expect(JSON.stringify({ events, calls: model.calls })).not.toContain("PRIVATE_MEMORY_DATABASE_DETAIL");
  });

  it("blocks a same-batch retry after an uncertain attempt but permits a different fact", async () => {
    const fake = database(["returned", "saved"]);
    const model = scripted([
      round([remember(), remember(firstFact, "memory-2"), remember(secondFact, "memory-3")]),
      round(),
    ]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(2);
    expect(fake.persisted.flatMap((write) => write.rows.map((row) => row.fact))).toEqual([firstFact, secondFact]);
    expect(events.filter((event) => event.type === "learned")).toEqual([{ type: "learned", fact: secondFact }]);
    expect(results(model.calls[1]).map((result) => result.tool_use_id)).toEqual(["memory-1", "memory-2", "memory-3"]);
    expect(results(model.calls[1])[1].is_error).toBe(true);
    expect(done(events).text).toContain(secondFact);
    expect(done(events).text).toMatch(/confirm|uncertain/i);
  });

  it.each(["blank", "exhausted"])("retains uncertainty after a later validation failure in a %s ending", async (ending) => {
    const fake = database(["returned"]);
    const model = scripted([
      round([remember(), remember("", "invalid")]),
      ...(ending === "blank" ? [round()] : [round([remember("", "invalid")]), round([remember("", "invalid")])]),
    ]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "learned")).toEqual([]);
    expect(done(events).text).toMatch(/confirm|uncertain/i);
    expect(done(events).text).toContain("a memory needs to say something");
    expect(done(events).text).not.toContain("PRIVATE_MEMORY_DATABASE_DETAIL");
  });

  it.each(["blank", "exhausted"])("gives one confirmed memory receipt after a %s model ending", async (ending) => {
    const fake = database();
    const model = scripted([
      round([{ type: "text", text: "I will remember that. " }, remember()]),
      ...(ending === "blank" ? [round()] : [round([remember()]), round([remember()])]),
    ]);
    const events = await collect(fake.db, model.turn);

    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "learned")).toHaveLength(1);
    expect(done(events).text).toContain(firstFact);
    expect(done(events).text.split(firstFact)).toHaveLength(2);
    expect(done(events).text).toMatch(/(?:added|saved|remembered)/i);
    expect(done(events).text).not.toMatch(/confirm whether|uncertain/i);
    expect(events.filter((event) => event.type === "text").map((event) => event.text).join("")).toBe(done(events).text);
  });
});

describe("cancelled memory writes", () => {
  it("does not write or acknowledge a memory after cancellation before tool execution", async () => {
    const fake = database();
    const controller = new AbortController();
    const events: TurnEvent[] = [];
    const turn: ModelTurn = async function* ({ signal }) {
      expect(signal).toBe(controller.signal);
      yield remember();
      controller.abort(new Error("measurement stopped"));
      yield { type: "done", stopReason: "tool_use", inputTokens: 10, outputTokens: 3 };
    };
    await expect(collect(fake.db, turn, controller.signal, events)).rejects.toThrow("measurement stopped");
    expect(fake.from).not.toHaveBeenCalled();
    expect(events.some((event) => event.type === "learned" || event.type === "done")).toBe(false);
  });

  it("does not claim a learned fact when cancellation happens during an already-started write", async () => {
    const controller = new AbortController();
    const fake = database([], () => controller.abort(new Error("measurement stopped")));
    const events: TurnEvent[] = [];
    const model = scripted([round([remember()])]);
    await expect(collect(fake.db, model.turn, controller.signal, events)).rejects.toThrow("measurement stopped");
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.persisted).toHaveLength(1);
    expect(events.some((event) => event.type === "learned" || event.type === "done")).toBe(false);
  });
});
