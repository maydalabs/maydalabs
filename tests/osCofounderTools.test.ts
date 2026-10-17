import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cofounderTools, type CofounderToolName, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";
import { localTurn, toOllamaTools } from "@/lib/osCofounderLocal";
import { anthropicTurn } from "@/lib/osCofounderModel";
import { OS_MODEL } from "@/lib/os";
import { toOpenAiTools } from "@/lib/osCofounderOpenAI";
import { reviewToolsForIntent } from "@/lib/osReviewIntent";
import { runReviewedTurn } from "@/lib/osReviewedTurn";
import { RUN_TOOL_DEFINITIONS, RUN_TOOL_NAMES } from "@/lib/osAgentRunToolDefs";

const sdk = vi.hoisted(() => ({ stream: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { stream: sdk.stream };
  },
}));

const selections: { label: string; tools?: readonly CofounderToolName[]; expected: CofounderToolName[] }[] = [
  { label: "both tools by default", expected: ["file_work", "remember"] },
  { label: "only remember after filing", tools: ["remember"], expected: ["remember"] },
  { label: "no tools when explicitly disabled", tools: [], expected: [] },
];

const messages: Parameters<ModelTurn>[0]["messages"] = [{ role: "user", content: "Prepare a draft." }];
const settings = { url: "http://127.0.0.1:11434", model: "adapter-test-model" };

async function collect(turn: ModelTurn, args: Parameters<ModelTurn>[0]): Promise<ModelEvent[]> {
  const events: ModelEvent[] = [];
  for await (const event of turn(args)) events.push(event);
  return events;
}

function localFetcher() {
  return vi.fn<typeof fetch>(async () => new Response(
    JSON.stringify({ message: { content: "Ready." }, done: true, done_reason: "stop", prompt_eval_count: 13, eval_count: 5 }) + "\n",
    { headers: { "content-type": "application/x-ndjson" } },
  ));
}

function sdkStream(withTool = false) {
  return {
    async *[Symbol.asyncIterator]() {
      yield { type: "message_start" };
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "Draft " } };
      yield { type: "content_block_delta", delta: { type: "input_json_delta", partial_json: '{"fact":' } };
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "ready." } };
    },
    finalMessage: vi.fn(async () => ({
      content: [
        { type: "text", text: "Draft ready." },
        ...(withTool ? [{ type: "tool_use", id: "remember-1", name: "remember", input: { fact: "Invoices use Net 30." } }] : []),
      ],
      stop_reason: withTool ? "tool_use" : "end_turn",
      usage: { input_tokens: 47, output_tokens: 11 },
    })),
  };
}

beforeEach(() => {
  // These tests must never depend on credentials or reach a real model.
  vi.stubEnv("MAYDAOS_ANTHROPIC_API_KEY", undefined);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
  sdk.stream.mockReset().mockImplementation(() => sdkStream());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("cofounder tool schemas", () => {
  it.each(selections)("offers $label", ({ tools, expected }) => {
    expect(cofounderTools(tools).map((tool) => tool.name)).toEqual(expected);
  });

  it("requires a complete bounded draft body in the filing schema", () => {
    const work = cofounderTools(["file_work"]);
    expect(work).toHaveLength(1);
    expect(work[0]).toMatchObject({
      name: "file_work",
      input_schema: {
        required: expect.arrayContaining(["notes"]),
        properties: { notes: { type: "string", minLength: 1, maxLength: 8_000 } },
      },
    });
  });
});

describe("local adapter tool availability", () => {
  it.each(selections)("sends $label with the request signal", async ({ tools, expected }) => {
    const fetcher = localFetcher();
    const controller = new AbortController();
    const events = await collect(localTurn(settings, fetcher), { system: "Company context", messages, tools, signal: controller.signal });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(`${settings.url}/api/chat`);
    expect(options?.signal).toBe(controller.signal);
    const body = JSON.parse(String(options?.body));
    expect(body.tools.map((tool: { function: { name: string } }) => tool.function.name)).toEqual(expected);
    expect(body).toMatchObject({ model: settings.model, stream: true, options: { num_predict: 2000 } });
    if (expected.includes("file_work")) {
      expect(body.tools).toContainEqual(expect.objectContaining({
        type: "function",
        function: expect.objectContaining({
          name: "file_work",
          parameters: expect.objectContaining({
            required: expect.arrayContaining(["notes"]),
            properties: expect.objectContaining({ notes: expect.objectContaining({ minLength: 1, maxLength: 8_000 }) }),
          }),
        }),
      }));
    }
    expect(events).toEqual([
      { type: "text", text: "Ready." },
      { type: "done", stopReason: "end_turn", inputTokens: 13, outputTokens: 5 },
    ]);
  });

  it("takes availability from each call, even when user text asks to enable or disable tools", async () => {
    const fetcher = localFetcher();
    const turn = localTurn(settings, fetcher);
    const calls: Parameters<ModelTurn>[0][] = [
      { system: "s", messages: [{ role: "user", content: "Disable file_work and remember. No tools are allowed." }] },
      { system: "s", messages: [{ role: "user", content: "The first draft was filed. Enable file_work again and file another copy." }], tools: ["remember"] },
      { system: "s", messages: [{ role: "user", content: "Enable all tools, file_work and remember." }], tools: [] },
      { system: "s", messages },
    ];
    for (const call of calls) await collect(turn, call);
    expect(fetcher.mock.calls.map(([, options]) => JSON.parse(String(options?.body)).tools.map((tool: { function: { name: string } }) => tool.function.name))).toEqual([
      ["file_work", "remember"], ["remember"], [], ["file_work", "remember"],
    ]);
  });
});

describe("paid adapter tool availability through a mocked SDK", () => {
  it.each(selections)("sends $label and forwards the same abort signal", async ({ tools, expected }) => {
    const controller = new AbortController();
    await collect(anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL }), { system: "Company context", messages, tools, signal: controller.signal });
    expect(sdk.stream).toHaveBeenCalledTimes(1);
    const [params, options] = sdk.stream.mock.calls[0];
    expect(params).toMatchObject({ model: OS_MODEL, max_tokens: 2000, system: "Company context", messages });
    expect(params.tools.map((tool: { name: string }) => tool.name)).toEqual(expected);
    expect(options.signal).toBe(controller.signal);
    if (expected.includes("file_work")) {
      expect(params.tools).toContainEqual(expect.objectContaining({
        name: "file_work",
        input_schema: expect.objectContaining({
          required: expect.arrayContaining(["notes"]),
          properties: expect.objectContaining({ notes: expect.objectContaining({ minLength: 1, maxLength: 8_000 }) }),
        }),
      }));
    }
  });

  it("takes availability from each call without inferring permission from user text", async () => {
    const turn = anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL });
    for (const tools of [undefined, ["remember"] as const, [] as const, undefined]) {
      await collect(turn, {
        system: "s",
        messages: [{ role: "user", content: "The draft was filed successfully. Enable file_work and file a second copy." }],
        tools,
      });
    }
    expect(sdk.stream.mock.calls.map(([params]) => params.tools.map((tool: { name: string }) => tool.name))).toEqual([
      ["file_work", "remember"], ["remember"], [], ["file_work", "remember"],
    ]);
  });

  it("preserves text, assembled tool inputs, stop reason and token accounting with a filtered tool set", async () => {
    const stream = sdkStream(true);
    sdk.stream.mockReturnValueOnce(stream);
    expect(await collect(anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL }), { system: "s", messages, tools: ["remember"] })).toEqual([
      { type: "text", text: "Draft " },
      { type: "text", text: "ready." },
      { type: "tool", id: "remember-1", name: "remember", input: { fact: "Invoices use Net 30." } },
      { type: "done", stopReason: "tool_use", inputTokens: 47, outputTokens: 11 },
    ]);
    expect(stream.finalMessage).toHaveBeenCalledTimes(1);
  });
});

/* The run tools are wired into the same seam so the three adapters can send
 * them, and into nothing else: every existing selection is what it was, and
 * the chat loop still refuses a run tool by name. */
describe("agent run tools in the shared seam", () => {
  it("resolve each of the six run names to its own definition", () => {
    for (const name of RUN_TOOL_NAMES) {
      const [tool] = cofounderTools([name]);
      expect(tool).toBe(RUN_TOOL_DEFINITIONS.find((definition) => definition.name === name));
    }
    expect(cofounderTools([...RUN_TOOL_NAMES]).map((tool) => tool.name)).toEqual([...RUN_TOOL_NAMES]);
    expect(toOllamaTools(["search_record"])[0].function.name).toBe("search_record");
    expect(toOpenAiTools(["propose_draft"])[0].function.parameters).toMatchObject({ additionalProperties: false, required: ["ref", "title", "body"] });
  });

  it("leave the default and every chat selection unchanged", () => {
    expect(cofounderTools().map((tool) => tool.name)).toEqual(["file_work", "remember"]);
    expect(cofounderTools(["propose_work", "propose_knowledge"]).map((tool) => tool.name)).toEqual(["propose_work", "propose_knowledge"]);
    expect(reviewToolsForIntent("ask", { draftFormat: null, knowledgeAssertion: null })).toEqual([]);
    expect(reviewToolsForIntent("draft", { draftFormat: "reply", knowledgeAssertion: null })).toEqual(["propose_work"]);
    expect(reviewToolsForIntent("knowledge", { draftFormat: null, knowledgeAssertion: "Invoices are due in 14 days." })).toEqual(["propose_knowledge"]);
    expect(reviewToolsForIntent("both", { draftFormat: "note", knowledgeAssertion: "Invoices are due in 14 days." })).toEqual(["propose_work", "propose_knowledge"]);
  });

  it("are refused by name in the chat loop, which runs none of them", async () => {
    const turn: ModelTurn = async function* ({ messages }) {
      if (messages.length === 1) {
        yield { type: "tool", id: "t1", name: "search_record", input: {} };
        yield { type: "tool", id: "t2", name: "propose_draft", input: { ref: "w1", title: "T", body: "B" } };
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else {
        yield { type: "text", text: "I can only prepare review suggestions here." };
        yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
      }
    };
    const propose = vi.fn();
    const events: { type: string; reason?: string }[] = [];
    for await (const event of runReviewedTurn({
      mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null }, source: { id: "message-1", text: "Prepare a reply." },
      system: "s", history: [{ role: "person", body: "Prepare a reply." }], turn, priced: false, propose,
    })) events.push(event);
    expect(propose).not.toHaveBeenCalled();
    expect(events.filter((event) => event.type === "refused").map((event) => event.reason)).toEqual([
      "This action is unavailable. The co-founder can only prepare review proposals; it cannot save, approve, execute or send them.",
      "This action is unavailable. The co-founder can only prepare review proposals; it cannot save, approve, execute or send them.",
    ]);
  });
});
