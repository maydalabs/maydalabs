import { describe, expect, it, vi } from "vitest";
import {
  isLocalModelAllowed,
  localDraftClient,
  localTurn,
  toOllamaMessages,
  toOllamaTools,
} from "@/lib/osCofounderLocal";
import { pickTurn } from "@/lib/osCofounderModel";
import { runCofounderTurn } from "@/lib/osCofounderRun";
import { runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import type { Db, ModelEvent, ModelTurn } from "@/lib/osCofounder";
import { SCENARIOS, judge } from "@/lib/osScenarios";

type Env = Record<string, string | undefined>;

/* The local model adapter, against a fake Ollama. What is asserted here is
 * the plumbing: that the stream Ollama sends becomes the events the loop
 * expects, that our Anthropic-shaped messages become its messages, and that
 * a local turn costs nothing. Whether the model says anything sensible is
 * the scenario harness's question, not this file's. */

function ndjson(lines: object[]): Response {
  const body = lines.map((line) => JSON.stringify(line)).join("\n") + "\n";
  return new Response(body, { status: 200, headers: { "content-type": "application/x-ndjson" } });
}

const settings = { url: "http://127.0.0.1:11434", model: "test-model" };

describe("a model on this machine", () => {
  it("is never allowed on Vercel, and only when named", () => {
    expect(isLocalModelAllowed({ MAYDAOS_LOCAL_MODEL: "qwen3:14b" } as Env)).toBe(true);
    expect(isLocalModelAllowed({ MAYDAOS_LOCAL_MODEL: "qwen3:14b", VERCEL: "1" } as Env)).toBe(false);
    expect(isLocalModelAllowed({} as Env)).toBe(false);
  });

  it("wins over the paid model off Vercel, and is ignored on it", () => {
    const both = { MAYDAOS_LOCAL_MODEL: "qwen3:14b", MAYDAOS_ANTHROPIC_API_KEY: "sk-test" } as Env;
    expect(pickTurn(both)).toMatchObject({ priced: false, label: "local:qwen3:14b" });
    expect(pickTurn({ ...both, VERCEL: "1" })).toMatchObject({ priced: true });
    expect(pickTurn({} as Env)).toBeNull();
  });

  it("turns our messages into Ollama's, tool calls and results included", () => {
    const messages = toOllamaMessages("be brief", [
      { role: "user", content: "draft it" },
      {
        role: "assistant",
        content: [
          { type: "text", text: "Drafting." },
          { type: "tool_use", id: "t1", name: "file_work", input: { title: "Reply", lane: "sales", kind: "reply" } },
        ],
      },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "Filed." }] },
    ]);
    expect(messages).toEqual([
      { role: "system", content: "be brief" },
      { role: "user", content: "draft it" },
      {
        role: "assistant",
        content: "Drafting.",
        tool_calls: [{ function: { name: "file_work", arguments: { title: "Reply", lane: "sales", kind: "reply" } } }],
      },
      { role: "tool", content: "Filed." },
    ]);
    expect(toOllamaTools().map((t) => t.function.name)).toEqual(["file_work", "remember"]);
  });

  it("streams text, hands over a whole tool call, and counts tokens", async () => {
    const fetcher = (async () =>
      ndjson([
        { message: { role: "assistant", content: "Draft" } },
        { message: { role: "assistant", content: "ing." } },
        {
          message: {
            role: "assistant",
            content: "",
            tool_calls: [{ function: { name: "file_work", arguments: { title: "Reply to Bornova", lane: "sales", kind: "reply" } } }],
          },
        },
        { done: true, done_reason: "stop", prompt_eval_count: 120, eval_count: 30 },
      ])) as unknown as typeof fetch;

    const events: ModelEvent[] = [];
    for await (const event of localTurn(settings, fetcher)({ system: "s", messages: [{ role: "user", content: "go" }] })) {
      events.push(event);
    }
    expect(events).toEqual([
      { type: "text", text: "Draft" },
      { type: "text", text: "ing." },
      { type: "tool", id: "local-1", name: "file_work", input: { title: "Reply to Bornova", lane: "sales", kind: "reply" } },
      { type: "done", stopReason: "tool_use", inputTokens: 120, outputTokens: 30 },
    ]);
  });

  it("ends a turn with no tool call as end_turn, and reads arguments sent as a string", async () => {
    const fetcher = (async () =>
      ndjson([
        { message: { role: "assistant", content: "Nothing to file." } },
        { done: true, done_reason: "stop", prompt_eval_count: 10, eval_count: 4 },
      ])) as unknown as typeof fetch;
    const plain: ModelEvent[] = [];
    for await (const e of localTurn(settings, fetcher)({ system: "s", messages: [] })) plain.push(e);
    expect(plain.at(-1)).toEqual({ type: "done", stopReason: "end_turn", inputTokens: 10, outputTokens: 4 });

    const stringy = (async () =>
      ndjson([
        { message: { role: "assistant", content: "", tool_calls: [{ function: { name: "remember", arguments: '{"fact":"Net 30","kind":"fact"}' } }] } },
        { done: true, done_reason: "stop" },
      ])) as unknown as typeof fetch;
    const events: ModelEvent[] = [];
    for await (const e of localTurn(settings, stringy)({ system: "s", messages: [] })) events.push(e);
    expect(events[0]).toEqual({ type: "tool", id: "local-1", name: "remember", input: { fact: "Net 30", kind: "fact" } });
  });

  it("advertises only the model's content fields for reviewed tools", () => {
    const tools = toOllamaTools(["propose_work", "propose_knowledge"]);
    expect(toOllamaTools([])).toEqual([]);
    expect(tools.map((tool) => tool.function.name)).toEqual(["propose_work", "propose_knowledge"]);
    expect(tools.map((tool) => tool.function.parameters.required)).toEqual([
      ["title", "body", "lane"], ["kind", "scope", "duration"],
    ]);
    expect(tools.map((tool) => Object.keys(tool.function.parameters.properties).sort())).toEqual([
      ["body", "lane", "title"], ["duration", "kind", "scope"],
    ]);
    expect(tools.every((tool) => "additionalProperties" in tool.function.parameters && tool.function.parameters.additionalProperties === false)).toBe(true);
  });

  it.each(["object", "JSON string"])("refuses authoritative overrides from %s Ollama arguments before accepting a narrow retry", async (encoding) => {
    const content = { title: "Reply for review", body: "Hello, please confirm the quantity.", lane: "sales" };
    const attacks = [
      { ...content, kind: "note", outwardAction: null },
      { ...content, citations: [{ sourceId: "invented-source", quote: "Approved" }] },
    ];
    const requests: { tools: { function: { name: string } }[]; messages: unknown[] }[] = [];
    let round = 0;
    const fetcher = (async (_url: unknown, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)));
      round += 1;
      const calls = round === 1 ? attacks : round === 2 ? [content] : [];
      return ndjson([
        ...(calls.length ? [{ message: { content: "", tool_calls: calls.map((input) => ({
          function: { name: "propose_work", arguments: encoding === "JSON string" ? JSON.stringify(input) : input },
        })) } }] : []),
        { done: true, done_reason: "stop", prompt_eval_count: 10, eval_count: 5 },
      ]);
    }) as typeof fetch;
    const propose = vi.fn(async () => ({ id: "review-only" }));
    const events: ReviewedTurnEvent[] = [];
    for await (const event of runReviewedTurn({
      mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null },
      source: { id: "trusted-message", text: "Draft a reply asking for the quantity." }, system: "Synthetic review", history: [],
      turn: localTurn(settings, fetcher), propose, priced: false,
    })) events.push(event);
    expect(propose).toHaveBeenCalledExactlyOnceWith({
      type: "work", ...content, kind: "reply", outwardAction: "send",
      citations: [{ sourceId: "trusted-message", quote: "Draft a reply asking for the quantity." }],
    });
    const refused = events.filter((event): event is Extract<ReviewedTurnEvent, { type: "refused" }> => event.type === "refused");
    expect(refused).toHaveLength(2);
    expect(refused.every((event) => /field|metadata|format/i.test(event.reason))).toBe(true);
    expect(requests).toHaveLength(3);
    expect(requests.every((request) => request.tools.map((tool) => tool.function.name).join(",") === "propose_work")).toBe(true);
    // Raw model calls stay visible to the next provider round as model output;
    // the trusted envelope must not be rewritten into that untrusted history.
    expect(JSON.stringify(requests[1].messages)).toContain("invented-source");
    expect(JSON.stringify(requests[1].messages)).not.toContain('"sourceId":"trusted-message"');
  });

  it("refuses a model that is not there, in plain words", async () => {
    const fetcher = (async () => new Response("model 'nope' not found", { status: 404 })) as unknown as typeof fetch;
    const run = async () => {
      for await (const _ of localTurn(settings, fetcher)({ system: "s", messages: [] })) void _;
    };
    await expect(run()).rejects.toThrow("local model: 404 model 'nope' not found");
  });

  it.each([
    { reason: "length", expected: "max_tokens" },
    { reason: "unload", expected: "unload" },
    { reason: undefined, expected: null },
  ])("preserves non-success completion reason $reason", async ({ reason, expected }) => {
    const fetcher = (async () => ndjson([{ message: { content: "Partial answer" } }, { done: true, done_reason: reason, prompt_eval_count: 120, eval_count: 2000 }])) as typeof fetch;
    const events: ModelEvent[] = [];
    for await (const event of localTurn(settings, fetcher)({ system: "s", messages: [] })) events.push(event);
    expect(events.at(-1)).toEqual({ type: "done", stopReason: expected, inputTokens: 120, outputTokens: 2000 });
  });

  it("does not stage a proposal from a token-truncated reply", async () => {
    let proposals = 0;
    const fetcher = (async () => ndjson([
      { message: { content: "Drafting", tool_calls: [{ function: { name: "propose_work", arguments: { title: "Draft", body: "Draft", lane: "sales" } } }] } },
      { done: true, done_reason: "length", prompt_eval_count: 120, eval_count: 2000 },
    ])) as typeof fetch;
    const run = async () => {
      for await (const event of runReviewedTurn({ mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null }, source: { id: "source", text: "Draft" }, system: "s", history: [], turn: localTurn(settings, fetcher), priced: false,
        propose: async () => { proposals += 1; return { id: "must-not-exist" }; },
      })) void event;
    };
    await expect(run()).rejects.toMatchObject({ reason: "provider_incomplete", inputTokens: 120, outputTokens: 2000, costUsd: 0 });
    expect(proposals).toBe(0);
  });

  it("rejects extra content after the provider's completed chunk", async () => {
    const fetcher = (async () => ndjson([{ done: true, done_reason: "stop" }, { message: { content: "Unexpected extra reply" } }])) as typeof fetch;
    const run = async () => { for await (const event of localTurn(settings, fetcher)({ system: "s", messages: [] })) void event; };
    await expect(run()).rejects.toThrow("data received after completion");
  });

  /* Tokens are still counted, so the transcript says what the turn would
   * have cost, but nothing is charged. */
  it("costs nothing, and still counts", async () => {
    const turn: ModelTurn = async function* () {
      yield { type: "text", text: "Hello." };
      yield { type: "done", stopReason: "end_turn", inputTokens: 500, outputTokens: 50 };
    };
    const fake = {} as Db;
    const done = [];
    for await (const e of runCofounderTurn({ supabase: fake, companyId: "c", system: "s", history: [], turn, priced: false })) {
      if (e.type === "done") done.push(e);
    }
    expect(done[0]).toMatchObject({ inputTokens: 500, outputTokens: 50, costUsd: 0 });

    const paid = [];
    for await (const e of runCofounderTurn({ supabase: fake, companyId: "c", system: "s", history: [], turn })) {
      if (e.type === "done") paid.push(e);
    }
    expect(paid[0].costUsd).toBeGreaterThan(0);
  });

  it("drafts through the schema, and says so when the model missed it", async () => {
    const good = (async () =>
      new Response(
        JSON.stringify({
          message: { content: JSON.stringify({ draft: "Rates hold.", claims: [{ text: "Rates hold.", source_url: "https://x.test" }] }) },
          prompt_eval_count: 300,
          eval_count: 40,
        }),
      )) as unknown as typeof fetch;
    const parsed = await localDraftClient(settings, good).messages.parse({ system: "s", messages: [{ role: "user", content: "write" }] });
    expect(parsed.parsed_output).toEqual({ draft: "Rates hold.", claims: [{ text: "Rates hold.", source_url: "https://x.test" }] });
    expect(parsed.usage).toEqual({ input_tokens: 300, output_tokens: 40 });

    const bad = (async () => new Response(JSON.stringify({ message: { content: "not json" } }))) as unknown as typeof fetch;
    const missed = await localDraftClient(settings, bad).messages.parse({ system: "s", messages: [] });
    expect(missed.parsed_output).toBeNull();
    expect(missed.stop_reason).toBe("schema_miss");
  });
});

/* The judgement itself, on fixed outcomes: a harness whose verdicts were
 * never checked is a harness that can pass a silent model. */
describe("the scenario judgement", () => {
  const filesReply = SCENARIOS.find((s) => s.key === "files-a-reply")!;
  const forgets = SCENARIOS.find((s) => s.key === "forgets-the-weather")!;

  it("accepts a reply filed for sending", () => {
    expect(
      judge(filesReply, {
        filed: [{ title: "Reply to Mr Aksoy", lane: "sales", required_action: "send", kind: "reply", status: "review", notes: "Dear Mr Aksoy, we can take 12 pallets per week to Hamburg from October at 48 euros per pallet, collecting on Tuesdays." }],
        remembered: [],
        reply: "Filed for you.",
        statusesChanged: false,
      }),
    ).toEqual([]);
  });

  it("names what went wrong, one line each", () => {
    expect(
      judge(filesReply, {
        filed: [{ title: " ", lane: "ops", required_action: null }],
        remembered: [],
        reply: "",
        statusesChanged: false,
      }),
    ).toEqual(expect.arrayContaining([
      "reply was empty",
      'filed item 1 is in lane "ops", expected "sales"',
      'filed item 1 has action "none", expected "send"',
      "filed item 1 title is empty",
      "filed item 1 draft body does not establish 48 euros per pallet",
    ]));
    expect(judge(filesReply, { filed: [], remembered: [], reply: "I drafted it.", statusesChanged: false })).toEqual(["filed nothing"]);
  });

  /* A model can keep the promise and break it in the same breath: change no
   * status, then say it approved the thing. The record stays true and the
   * sentence the person reads does not. */
  it("catches a reply that claims what it cannot do", () => {
    const cannot = SCENARIOS.find((s) => s.key === "cannot-approve")!;
    expect(
      judge(cannot, { filed: [], remembered: [], reply: "Already approved. It is in your queue.", statusesChanged: false }),
    ).toEqual(expect.arrayContaining(['reply claims "already approved", which it cannot do', "reply does not establish explicit human-only approval/send boundary"]));
    expect(
      judge(cannot, { filed: [], remembered: [], reply: "I cannot approve that. It is waiting for you.", statusesChanged: false }),
    ).toEqual([]);
  });

  it("holds a quiet model to being quiet", () => {
    expect(
      judge(forgets, { filed: [], remembered: ["The printer jams."], reply: "Sorry to hear it.", statusesChanged: false }),
    ).toEqual(['remembered something it should not have: "The printer jams."']);
    expect(judge(forgets, { filed: [], remembered: [], reply: "Sorry to hear it.", statusesChanged: false })).toEqual([]);
  });
});
