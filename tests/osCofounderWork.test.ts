import { describe, expect, it, vi } from "vitest";
import { fileWork, fileWorkBatch, type Db, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { runCofounderTurn, type TurnEvent } from "@/lib/osCofounderRun";

type Input = Record<string, unknown>;

const draft = (overrides: Input = {}): Input => ({
  title: "Reply to Deniz",
  lane: "sales",
  kind: "reply",
  notes: "Dear Deniz, we can collect your six crates on Friday at 25 euros per crate.",
  needs_approval_for: "send",
  ...overrides,
});

// This fake has no query/update/delete surface. Every permitted write is
// recorded, including attempts whose persistence outcome is uncertain.
function database(failure?: "returned" | "thrown") {
  const persisted: { table: string; rows: Input[] }[] = [];
  const insert = vi.fn(async (table: string, input: Input | Input[]) => {
    if (failure === "thrown") throw new Error("PRIVATE_DATABASE_DETAIL");
    if (failure === "returned") return { error: { message: "PRIVATE_DATABASE_DETAIL" } };
    persisted.push({ table, rows: structuredClone(Array.isArray(input) ? input : [input]) });
    return { error: null };
  });
  const from = vi.fn((table: string) => ({ insert: (input: Input | Input[]) => insert(table, input) }));
  return { db: { from } as unknown as Db, from, insert, persisted };
}

function round(events: ModelEvent[] = []): ModelEvent[] {
  return [
    ...events,
    { type: "done", stopReason: events.some((event) => event.type === "tool") ? "tool_use" : "end_turn", inputTokens: 10, outputTokens: 3 },
  ];
}

function file(input: Input = draft(), id = "local-1"): ModelEvent {
  return { type: "tool", id, name: "file_work", input };
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

async function collect(db: Db, turn: ModelTurn, signal?: AbortSignal) {
  const events: TurnEvent[] = [];
  for await (const event of runCofounderTurn({
    supabase: db,
    companyId: "selected-company",
    system: "Synthetic test instructions",
    history: [{ role: "person", body: "Prepare the requested drafts and put them in my queue." }],
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

describe("work batch validation before persistence", () => {
  it("preserves a complete body exactly, including surrounding whitespace, and derives review status", async () => {
    const fake = database();
    const notes = "  Dear Deniz,\n\nSix crates on Friday.\n  ";
    const result = await fileWorkBatch(fake.db, "selected-company", [draft({ notes, needs_approval_for: " SEND ", status: "approved" })]);
    expect(result).toMatchObject({ ok: true, titles: ["Reply to Deniz"] });
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.insert.mock.calls[0][1]).toEqual([expect.objectContaining({
      company_id: "selected-company", notes, status: "review", required_action: "send", metadata: { by: "cofounder" },
    })]);
    expect(fake.from.mock.calls.map(([table]) => table)).toEqual(["os_work_items"]);
  });

  it("retains the single-item wrapper and internal-work defaults", async () => {
    const fake = database();
    expect(await fileWork(fake.db, "selected-company", { title: "Pricing note", notes: "Keep the existing floor." })).toMatchObject({ ok: true, title: "Pricing note" });
    expect(fake.persisted[0].rows).toEqual([expect.objectContaining({ lane: "ops", kind: "note", status: "drafted", required_action: null })]);
  });

  it.each([null, "", "   "])("treats approval %j as internal draft work", async (needs_approval_for) => {
    const fake = database();
    expect(await fileWorkBatch(fake.db, "selected-company", [draft({ needs_approval_for })])).toMatchObject({ ok: true });
    expect(fake.persisted[0].rows[0]).toMatchObject({ status: "drafted", required_action: null });
  });

  it("accepts boundary lengths without changing the draft", async () => {
    const fake = database();
    const input = draft({ title: "t".repeat(200), notes: "n".repeat(8_000), lane: "l".repeat(40), kind: "k".repeat(40), needs_approval_for: "a".repeat(60) });
    expect(await fileWorkBatch(fake.db, "selected-company", [input])).toMatchObject({ ok: true });
    expect(fake.persisted[0].rows[0]).toMatchObject({ title: input.title, notes: input.notes, lane: input.lane, kind: input.kind, required_action: input.needs_approval_for });
  });

  it.each([
    ["missing title", { title: undefined }],
    ["blank title", { title: "  " }],
    ["non-string title", { title: 1 }],
    ["long title", { title: "t".repeat(201) }],
    ["missing body", { notes: undefined }],
    ["blank body", { notes: " \n " }],
    ["non-string body", { notes: ["Draft"] }],
    ["long body", { notes: "n".repeat(8_001) }],
    ["non-string lane", { lane: false }],
    ["long lane", { lane: "l".repeat(41) }],
    ["non-string kind", { kind: {} }],
    ["long kind", { kind: "k".repeat(41) }],
    ["non-string approval", { needs_approval_for: true }],
    ["long approval", { needs_approval_for: "a".repeat(61) }],
  ] satisfies [string, Input][])("rejects %s without writing any item in a mixed batch", async (_, invalid) => {
    const fake = database();
    const result = await fileWorkBatch(fake.db, "selected-company", [draft(), draft({ title: "Second draft", ...invalid })]);
    expect(result).toMatchObject({ ok: false, retryable: true, error: expect.any(String) });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("rejects malformed items and empty or excessive batches before touching the database", async () => {
    for (const inputs of [[], [null], ["draft"], Array.from({ length: 9 }, (_, index) => draft({ title: `Draft ${index}` }))]) {
      const fake = database();
      expect(await fileWorkBatch(fake.db, "selected-company", inputs as Input[])).toMatchObject({ ok: false, retryable: true });
      expect(fake.from).not.toHaveBeenCalled();
    }
  });

  it("allows eight distinct items in one array insert", async () => {
    const fake = database();
    const inputs = Array.from({ length: 8 }, (_, index) => draft({ title: `Draft ${index}` }));
    expect(await fileWorkBatch(fake.db, "selected-company", inputs)).toMatchObject({ ok: true, titles: inputs.map((input) => input.title) });
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.insert.mock.calls[0][1]).toHaveLength(8);
  });

  it("rejects identical normalized rows instead of writing duplicate artifacts", async () => {
    const fake = database();
    const first = draft({ title: "  Same note  ", lane: undefined, kind: undefined, needs_approval_for: " SEND " });
    const second = draft({ title: "Same note", lane: "ops", kind: "note", needs_approval_for: "send" });
    expect(await fileWorkBatch(fake.db, "selected-company", [first, second])).toMatchObject({ ok: false, retryable: true });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("does not confuse two different artifacts that share a title", async () => {
    const fake = database();
    const inputs = [draft({ title: "Collection reply" }), draft({ title: "Collection reply", notes: "Dear Ece, we can collect your four boxes on Monday." })];
    expect(await fileWorkBatch(fake.db, "selected-company", inputs)).toMatchObject({ ok: true });
    expect(fake.persisted[0].rows.map((row) => row.notes)).toEqual(inputs.map((input) => input.notes));
  });

  it.each(["returned", "thrown"] as const)("does not expose or mark a %s database failure as safe to retry", async (failure) => {
    const fake = database(failure);
    const result = await fileWorkBatch(fake.db, "selected-company", [draft()]);
    expect(result).toMatchObject({ ok: false, retryable: false, error: expect.any(String) });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_DATABASE_DETAIL");
    expect(fake.insert).toHaveBeenCalledTimes(1);
  });
});

describe("one successful creation batch per conversation turn", () => {
  it("blocks a renamed second filing after success, including when local tool IDs repeat", async () => {
    const fake = database();
    const model = scripted([
      round([file()]),
      round([file(draft({ title: "A renamed duplicate", notes: "A differently worded duplicate reply." }))]),
      round([{ type: "text", text: "Your draft is in the queue." }]),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.persisted[0].rows).toHaveLength(1);
    expect(events.filter((event) => event.type === "filed")).toEqual([{ type: "filed", title: "Reply to Deniz" }]);
    expect(events.some((event) => event.type === "refused")).toBe(true);
    expect(model.calls[0].tools).toContain("file_work");
    for (const call of model.calls.slice(1)) expect(call.tools ?? []).not.toContain("file_work");
    expect(done(events)).toMatchObject({ inputTokens: 30, outputTokens: 9, costUsd: 0 });
  });

  it("keeps the fallback receipt addressed to the person after refusing a duplicate", async () => {
    const fake = database();
    const model = scripted([round([file()]), round([file(draft({ title: "Renamed duplicate" }))]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(done(events).text).toContain("Reply to Deniz");
    expect(done(events).text).not.toMatch(/\b(?:tell the person|do not create another|acknowledge once)\b/i);
  });

  it("files two distinct requested artifacts together and keeps approval human-only", async () => {
    const fake = database();
    const model = scripted([
      round([file(), file(draft({ title: "Warehouse preparation note", lane: "ops", kind: "note", notes: "Have six crates ready on Friday.", needs_approval_for: null }), "local-2")]),
      round(),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(Array.isArray(fake.insert.mock.calls[0][1])).toBe(true);
    expect(fake.persisted[0].rows).toEqual([
      expect.objectContaining({ title: "Reply to Deniz", status: "review", required_action: "send" }),
      expect.objectContaining({ title: "Warehouse preparation note", status: "drafted", required_action: null }),
    ]);
    expect(events.filter((event) => event.type === "filed")).toHaveLength(2);
    expect(done(events).text).toContain("Reply to Deniz");
    expect(done(events).text).toContain("Warehouse preparation note");
    expect(fake.from.mock.calls.map(([table]) => table)).toEqual(["os_work_items"]);
  });

  it("allows a corrected validation-only retry without persisting the valid half of an invalid batch", async () => {
    const fake = database();
    const model = scripted([
      round([file(), file(draft({ title: "Second requested reply", notes: "" }), "local-2")]),
      round([file(), file(draft({ title: "Second requested reply", notes: "Dear Ece, Friday collection is available." }), "local-2")]),
      round([{ type: "text", text: "Both drafts are ready for your review." }]),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(fake.persisted[0].rows).toHaveLength(2);
    expect(model.calls[1].tools).toContain("file_work");
    expect(model.calls[2].tools ?? []).not.toContain("file_work");
    expect(events.filter((event) => event.type === "filed")).toHaveLength(2);
  });

  it("persists the complete filing batch before other tools, and still permits later memory", async () => {
    const fake = database();
    const model = scripted([
      round([
        { type: "tool", id: "memory-1", name: "remember", input: { fact: "Friday is the regular collection day." } },
        file(),
        file(draft({ title: "Second requested artifact", notes: "The collection checklist is ready." }), "local-2"),
      ]),
      round([{ type: "tool", id: "memory-2", name: "remember", input: { fact: "Crates must carry their customer reference." } }]),
      round(),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.persisted.map((write) => write.table)).toEqual(["os_work_items", "os_company_memory", "os_company_memory"]);
    expect(fake.persisted[0].rows).toHaveLength(2);
    expect(model.calls[1].tools).toContain("remember");
    expect(model.calls[1].tools ?? []).not.toContain("file_work");
    expect(events.filter((event) => event.type === "learned")).toHaveLength(2);
    // Ollama receives result messages without tool-call IDs. Keep their
    // ordering aligned with the assistant calls even when writes are batched.
    const results = model.calls[1].messages.at(-1)?.content as { type: string; tool_use_id: string }[];
    expect(results.map((result) => result.tool_use_id)).toEqual(["memory-1", "local-1", "local-2"]);
  });

  it.each(["returned", "thrown"] as const)("does not retry after a %s database attempt or leak its details", async (failure) => {
    const fake = database(failure);
    const model = scripted([
      round([file()]),
      round([file(draft({ title: "Retry after uncertainty" }))]),
      round(),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "filed")).toEqual([]);
    for (const call of model.calls.slice(1)) expect(call.tools ?? []).not.toContain("file_work");
    expect(JSON.stringify({ events, calls: model.calls })).not.toContain("PRIVATE_DATABASE_DETAIL");
    expect(done(events).text.trim()).not.toBe("");
    expect(done(events).text).not.toMatch(/(?:successfully filed|draft is in your queue)/i);
  });

  it.each([
    ["remember", "blank"],
    ["remember", "exhausted"],
    ["unknown tool", "blank"],
    ["unknown tool", "exhausted"],
  ] as const)("preserves work-save uncertainty and a later %s error in a %s fallback", async (failure, ending) => {
    const fake = database("returned");
    const failedTool: ModelEvent = failure === "remember"
      ? { type: "tool", id: "later-error", name: "remember", input: { fact: "" } }
      : { type: "tool", id: "later-error", name: "unsupported_tool", input: {} };
    const laterError = failure === "remember"
      ? "a memory needs to say something"
      : "There is no tool called unsupported_tool; that action was not performed.";
    const model = scripted([
      round([file(), failedTool]),
      ...(ending === "blank" ? [round()] : [round([failedTool]), round([failedTool])]),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(events.filter((event) => event.type === "filed")).toEqual([]);
    expect(done(events).text).toContain(laterError);
    expect(done(events).text).toContain("I couldn't confirm whether the work was saved. Check Work before trying again");
  });

  it("produces a truthful receipt for a success on the final model round with no acknowledgement", async () => {
    const fake = database();
    const model = scripted([round([file(draft({ notes: "" }))]), round([file(draft({ notes: "" }))]), round([file()])]);
    const events = await collect(fake.db, model.turn);
    expect(model.calls).toHaveLength(3);
    expect(fake.insert).toHaveBeenCalledTimes(1);
    expect(done(events).text).toContain("Reply to Deniz");
    expect(done(events).text).toMatch(/(?:queue|review|draft|filed)/i);
    expect(events.filter((event) => event.type === "text").map((event) => event.text).join("")).toBe(done(events).text);
  });

  it("does not mistake pre-tool narration for a save receipt when acknowledgement is blank", async () => {
    const fake = database();
    const model = scripted([round([{ type: "text", text: "Preparing your reply. " }, file()]), round()]);
    const events = await collect(fake.db, model.turn);
    expect(done(events).text).toContain("Preparing your reply.");
    expect(done(events).text).toContain("Reply to Deniz");
    expect(events.filter((event) => event.type === "text").map((event) => event.text).join("")).toBe(done(events).text);
  });

  it("refuses invented approval/send tools without any database writes", async () => {
    const fake = database();
    const model = scripted([
      round([{ type: "tool", id: "unknown", name: "approve_and_send", input: { status: "approved" } }]),
      round([{ type: "text", text: "I cannot approve or send the reply." }]),
    ]);
    const events = await collect(fake.db, model.turn);
    expect(fake.from).not.toHaveBeenCalled();
    expect(events.some((event) => event.type === "refused")).toBe(true);
    expect(done(events).text).toContain("cannot approve or send");
  });

  it("checks cancellation before a batched write", async () => {
    const fake = database();
    const controller = new AbortController();
    const turn: ModelTurn = async function* ({ signal }) {
      expect(signal).toBe(controller.signal);
      yield file();
      yield file(draft({ title: "Second item" }), "local-2");
      controller.abort(new Error("measurement stopped"));
      yield { type: "done", stopReason: "tool_use", inputTokens: 10, outputTokens: 3 };
    };
    await expect(collect(fake.db, turn, controller.signal)).rejects.toThrow("measurement stopped");
    expect(fake.from).not.toHaveBeenCalled();
  });
});
