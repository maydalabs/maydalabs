import { describe, expect, it, vi } from "vitest";
import { isAllowedBaseUrl, openAiCompatibleDraftClient, openAiCompatibleTurn, toOpenAiMessages, toOpenAiTools } from "@/lib/osCofounderOpenAI";
import type { ModelEvent } from "@/lib/osCofounder";

/* The OpenAI-compatible adapter against a scripted server. Plumbing only:
 * SSE chunks become events, tool-call fragments are reassembled in order,
 * usage is counted, and the key stays out of every error. */

function sse(chunks: (object | string)[]): Response {
  const body = chunks.map((c) => (typeof c === "string" ? c : `data: ${JSON.stringify(c)}`)).join("\n\n") + "\n\n";
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}
const settings = { baseUrl: "https://api.example.test/v1", apiKey: "sk-secret-0123456789abcdef", model: "grok-test" };
async function collect(turn: ReturnType<typeof openAiCompatibleTurn>, tools?: readonly ("propose_work" | "propose_knowledge")[]) {
  const events: ModelEvent[] = [];
  for await (const event of turn({ system: "be brief", messages: [{ role: "user", content: "hello" }], tools })) events.push(event);
  return events;
}

describe("an OpenAI-compatible provider", () => {
  it("accepts only https, or a loopback gateway for development", () => {
    expect(isAllowedBaseUrl("https://api.x.ai/v1")).toBe(true);
    expect(isAllowedBaseUrl("http://127.0.0.1:8080/v1")).toBe(true);
    expect(isAllowedBaseUrl("http://api.x.ai/v1")).toBe(false);
    expect(isAllowedBaseUrl("https://user:pw@api.x.ai/v1")).toBe(false);
    expect(isAllowedBaseUrl("https://api.x.ai/v1?x=1")).toBe(false);
    expect(isAllowedBaseUrl("not a url")).toBe(false);
    expect(() => openAiCompatibleTurn({ ...settings, baseUrl: "http://api.x.ai/v1" })).toThrow("https");
  });

  it("turns our messages into the chat-completions dialect, tool calls and results included", () => {
    expect(toOpenAiMessages("be brief", [
      { role: "user", content: "draft it" },
      { role: "assistant", content: [{ type: "text", text: "Drafting." }, { type: "tool_use", id: "call_1", name: "propose_work", input: { title: "Reply" } }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "call_1", content: "Staged." }] },
    ])).toEqual([
      { role: "system", content: "be brief" },
      { role: "user", content: "draft it" },
      { role: "assistant", content: "Drafting.", tool_calls: [{ id: "call_1", type: "function", function: { name: "propose_work", arguments: JSON.stringify({ title: "Reply" }) } }] },
      { role: "tool", tool_call_id: "call_1", content: "Staged." },
    ]);
    expect(toOpenAiTools(["propose_work"]).map((t) => t.function.name)).toEqual(["propose_work"]);
  });

  it("streams text, reassembles a tool call from fragments, and counts usage", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(sse([
      { choices: [{ delta: { content: "Here " } }] },
      { choices: [{ delta: { content: "you go." } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, id: "call_9", function: { name: "propose_work", arguments: "{\"title\":\"Re" } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: "ply\",\"lane\":\"sales\"}" } }] }, finish_reason: "tool_calls" }] },
      { choices: [], usage: { prompt_tokens: 120, completion_tokens: 30 } },
      "data: [DONE]",
    ]));
    const events = await collect(openAiCompatibleTurn(settings, fetcher), ["propose_work"]);
    expect(events).toEqual([
      { type: "text", text: "Here " },
      { type: "text", text: "you go." },
      { type: "tool", id: "call_9", name: "propose_work", input: { title: "Reply", lane: "sales" } },
      { type: "done", stopReason: "tool_use", inputTokens: 120, outputTokens: 30 },
    ]);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.example.test/v1/chat/completions");
    expect((init?.headers as Record<string, string>).authorization).toBe(`Bearer ${settings.apiKey}`);
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ model: "grok-test", stream: true, stream_options: { include_usage: true } });
    expect(body.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(["propose_work"]);
  });

  it("maps a plain stop to end_turn, a token limit to max_tokens, and malformed arguments to an empty input", async () => {
    const stop = await collect(openAiCompatibleTurn(settings, vi.fn<typeof fetch>().mockResolvedValue(sse([
      { choices: [{ delta: { content: "Done." }, finish_reason: "stop" }] }, "data: [DONE]",
    ]))));
    expect(stop.at(-1)).toMatchObject({ type: "done", stopReason: "end_turn" });
    const cut = await collect(openAiCompatibleTurn(settings, vi.fn<typeof fetch>().mockResolvedValue(sse([
      { choices: [{ delta: { tool_calls: [{ index: 0, id: "c", function: { name: "propose_work", arguments: "{not json" } }] }, finish_reason: "length" }] }, "data: [DONE]",
    ]))), ["propose_work"]);
    expect(cut).toEqual([
      { type: "tool", id: "c", name: "propose_work", input: {} },
      { type: "done", stopReason: "max_tokens", inputTokens: 0, outputTokens: 0 },
    ]);
  });

  it("fails closed on a bad status, a provider error, or a stream that never finishes, without echoing the key", async () => {
    const denied = openAiCompatibleTurn(settings, vi.fn<typeof fetch>().mockResolvedValue(new Response(`{"error":"bad key ${settings.apiKey}"}`, { status: 401 })));
    await expect(collect(denied)).rejects.toThrow(/^model provider: 401$/);
    const errored = openAiCompatibleTurn(settings, vi.fn<typeof fetch>().mockResolvedValue(sse([{ error: { message: `leak ${settings.apiKey}` } }])));
    await expect(collect(errored)).rejects.toThrow(/reported an error/);
    await expect(collect(errored)).rejects.not.toThrow(new RegExp(settings.apiKey));
    const cutOff = openAiCompatibleTurn(settings, vi.fn<typeof fetch>().mockResolvedValue(sse([{ choices: [{ delta: { content: "half" } }] }])));
    await expect(collect(cutOff)).rejects.toThrow(/without a completion record/);
  });
});

describe("an OpenAI-compatible provider drafting for the worker", () => {
  const body = { draft: "Freight rates rose 4% in August.", claims: [{ text: "Freight rates rose 4% in August.", source_url: "https://example.com/a" }] };
  function completion(content: string | null, finish = "stop", extra: Record<string, unknown> = {}) {
    return new Response(
      JSON.stringify({ choices: [{ message: { content, ...extra }, finish_reason: finish }], usage: { prompt_tokens: 120, completion_tokens: 40 } }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }
  const parse = (response: Response) =>
    openAiCompatibleDraftClient(settings, (async () => response) as unknown as typeof fetch).messages.parse({ system: "s", messages: [] });

  it("asks for one JSON object, once, and returns it parsed with its usage", async () => {
    const fetcher = vi.fn(async () => completion(JSON.stringify(body)));
    const client = openAiCompatibleDraftClient(settings, fetcher as unknown as typeof fetch);
    const result = await client.messages.parse({ system: "draft", messages: [{ role: "user", content: "Topic: x" }] });
    expect(result).toEqual({ parsed_output: body, stop_reason: "end_turn", usage: { input_tokens: 120, output_tokens: 40 } });

    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.test/v1/chat/completions");
    expect(init.redirect).toBe("error");
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${settings.apiKey}`);
    const sent = JSON.parse(String(init.body));
    expect(sent.stream).toBe(false);
    expect(sent.response_format).toMatchObject({ type: "json_schema", json_schema: { name: "maydaos_draft", strict: true } });
    expect(sent.messages[0].role).toBe("system");
    expect(sent.messages[0].content).toContain("draft");
    expect(sent.messages[1]).toEqual({ role: "user", content: "Topic: x" });
  });

  it("reports a schema miss, a refusal and a token-limit stop as themselves", async () => {
    expect(await parse(completion("not json"))).toMatchObject({ parsed_output: null, stop_reason: "schema_miss" });
    expect(await parse(completion(null, "stop", { refusal: "no" }))).toMatchObject({ parsed_output: null, stop_reason: "refusal" });
    expect(await parse(completion(null, "content_filter"))).toMatchObject({ stop_reason: "refusal" });
    expect(await parse(completion(JSON.stringify(body), "length"))).toMatchObject({ stop_reason: "max_tokens" });
  });

  it("throws the status and nothing else when refused, and never drafts over plain http", async () => {
    await expect(parse(new Response('{"error":"bad key sk-secret-0123456789abcdef"}', { status: 401 }))).rejects.toThrow(/^model provider: 401$/);
    expect(() => openAiCompatibleDraftClient({ ...settings, baseUrl: "http://api.x.ai/v1" })).toThrow("https");
  });
});
