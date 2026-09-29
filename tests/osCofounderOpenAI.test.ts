import { describe, expect, it, vi } from "vitest";
import { isAllowedBaseUrl, openAiCompatibleTurn, toOpenAiMessages, toOpenAiTools } from "@/lib/osCofounderOpenAI";
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
