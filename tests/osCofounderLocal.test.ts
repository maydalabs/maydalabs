import { describe, expect, it } from "vitest";
import {
  isLocalModelAllowed,
  localDraftClient,
  localTurn,
  toOllamaMessages,
  toOllamaTools,
} from "@/lib/osCofounderLocal";
import { pickTurn } from "@/lib/osCofounderModel";
import { runCofounderTurn } from "@/lib/osCofounderRun";
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
        { done: true, prompt_eval_count: 120, eval_count: 30 },
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
        { done: true, prompt_eval_count: 10, eval_count: 4 },
      ])) as unknown as typeof fetch;
    const plain: ModelEvent[] = [];
    for await (const e of localTurn(settings, fetcher)({ system: "s", messages: [] })) plain.push(e);
    expect(plain.at(-1)).toEqual({ type: "done", stopReason: "end_turn", inputTokens: 10, outputTokens: 4 });

    const stringy = (async () =>
      ndjson([
        { message: { role: "assistant", content: "", tool_calls: [{ function: { name: "remember", arguments: '{"fact":"Net 30","kind":"fact"}' } }] } },
        { done: true },
      ])) as unknown as typeof fetch;
    const events: ModelEvent[] = [];
    for await (const e of localTurn(settings, stringy)({ system: "s", messages: [] })) events.push(e);
    expect(events[0]).toEqual({ type: "tool", id: "local-1", name: "remember", input: { fact: "Net 30", kind: "fact" } });
  });

  it("refuses a model that is not there, in plain words", async () => {
    const fetcher = (async () => new Response("model 'nope' not found", { status: 404 })) as unknown as typeof fetch;
    const run = async () => {
      for await (const _ of localTurn(settings, fetcher)({ system: "s", messages: [] })) void _;
    };
    await expect(run()).rejects.toThrow("local model: 404 model 'nope' not found");
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
        filed: [{ title: "Reply to Mr Aksoy", lane: "sales", required_action: "send" }],
        remembered: [],
        reply: "Filed for you.",
        statusesChanged: false,
      }),
    ).toEqual([]);
  });

  it("names what went wrong, one line each", () => {
    expect(
      judge(filesReply, {
        filed: [{ title: "A note", lane: "ops", required_action: null }],
        remembered: [],
        reply: "",
        statusesChanged: false,
      }),
    ).toEqual([
      'filed in lane "ops", expected "sales"',
      "filed without an action to approve, so nobody would be asked",
      'title "A note" names none of Aksoy, Bornova, reply',
    ]);
    expect(judge(filesReply, { filed: [], remembered: [], reply: "", statusesChanged: false })).toEqual(["filed nothing"]);
  });

  it("holds a quiet model to being quiet", () => {
    expect(
      judge(forgets, { filed: [], remembered: ["The printer jams."], reply: "Sorry to hear it.", statusesChanged: false }),
    ).toEqual(['remembered something it should not have: "The printer jams."']);
    expect(judge(forgets, { filed: [], remembered: [], reply: "Sorry to hear it.", statusesChanged: false })).toEqual([]);
  });
});
