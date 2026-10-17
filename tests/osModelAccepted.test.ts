import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelTurn } from "@/lib/osCofounder";
import { RETRY_WAIT_CAP_MS, anthropicTurn, boundedRetryFetch } from "@/lib/osCofounderModel";
import { openAiCompatibleTurn } from "@/lib/osCofounderOpenAI";
import { OS_MODEL, runCostUsd } from "@/lib/os";
import { runAgentSlice } from "@/lib/osAgentRun";
import { agentRunDesk, deskItem } from "@/tests/helpers/agentRunDesk";

/* When a provider has taken a request, through the real adapters with only
 * the network stubbed. An agent run ledgers a call that failed before the
 * provider took it at zero (it was refused and billed nothing) and one that
 * failed after at its hold (it may have been billed), so each priced adapter
 * must say when that moment is — and must not say it for a refusal. Nothing
 * here reaches a network or a model. */

afterEach(() => { vi.unstubAllGlobals(); });

const messages = [{ role: "user" as const, content: "Prepare follow-ups." }];
const sse = (events: { event?: string; data: unknown }[]) =>
  events.map(({ event, data }) => `${event ? `event: ${event}\n` : ""}data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`).join("");
// The SDK retries a 529 twice; retry-after-ms keeps the test fast. It is still a refusal after the last try.
const overloaded = () => new Response(JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "Overloaded" } }),
  { status: 529, headers: { "content-type": "application/json", "retry-after-ms": "1" } });
const messageStart = { event: "message_start", data: { type: "message_start", message: {
  id: "msg_1", type: "message", role: "assistant", model: OS_MODEL, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 47, output_tokens: 1 },
} } };
const anthropicOk = () => new Response(sse([
  messageStart,
  { event: "content_block_start", data: { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } } },
  { event: "content_block_delta", data: { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Nothing waits." } } },
  { event: "content_block_stop", data: { type: "content_block_stop", index: 0 } },
  { event: "message_delta", data: { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 11 } } },
  { event: "message_stop", data: { type: "message_stop" } },
]), { status: 200, headers: { "content-type": "text/event-stream" } });
// Taken, then lost: the stream reports an error after message_start.
const anthropicLost = () => new Response(sse([
  messageStart,
  { event: "error", data: { type: "error", error: { type: "overloaded_error", message: "Overloaded" } } },
]), { status: 200, headers: { "content-type": "text/event-stream" } });

async function drain(turn: ModelTurn) {
  const seen: string[] = [];
  let error: unknown = null;
  try {
    for await (const event of turn({ system: "s", messages, tools: [], accepted: () => seen.push("accepted") })) seen.push(event.type);
  } catch (caught) { error = caught; }
  return { seen, error };
}

describe("the Anthropic adapter says when the provider took the request", () => {
  it("never for a 529 refused after the SDK's retries", async () => {
    const fetch = vi.fn(async () => overloaded());
    vi.stubGlobal("fetch", fetch);
    const { seen, error } = await drain(anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL }));
    expect(error).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(seen).toEqual([]);
  });

  it("once, before the first event, for a 2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => anthropicOk()));
    const { seen, error } = await drain(anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL }));
    expect(error).toBeNull();
    expect(seen).toEqual(["accepted", "text", "done"]);
  });

  it("before a failure that arrives inside a 2xx stream", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => anthropicLost()));
    const { seen, error } = await drain(anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL }));
    expect(error).toBeTruthy();
    expect(seen).toEqual(["accepted"]);
  });
});

describe("the OpenAI-compatible adapter says when the provider took the request", () => {
  const settings = { baseUrl: "https://models.example.invalid/v1", apiKey: "sk-test", model: "m" };
  it("never for a refused request", async () => {
    const { seen, error } = await drain(openAiCompatibleTurn(settings, vi.fn<typeof fetch>(async () => new Response("{}", { status: 529 }))));
    expect(String(error)).toContain("model provider: 529");
    expect(seen).toEqual([]);
  });

  it("once, before the first event, for a 2xx stream", async () => {
    const body = sse([
      { data: { choices: [{ delta: { content: "Nothing waits." } }] } },
      { data: { choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 2 } } },
      { data: "[DONE]" },
    ]);
    const { seen, error } = await drain(openAiCompatibleTurn(settings, vi.fn<typeof fetch>(async () => new Response(body, { status: 200 }))));
    expect(error).toBeNull();
    expect(seen).toEqual(["accepted", "text", "done"]);
  });
});

/* The whole path for a run on the platform's key: the real adapter, the
 * loop, and the desk's twin of the ledger. */
describe("a run's ledger through the real Anthropic adapter", () => {
  const items = () => [deskItem(1, 30), deskItem(2, 20)];

  it("records a call the provider refused with 529 at zero, so no hold is ever charged for it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => overloaded()));
    const desk = agentRunDesk({ items: items(), priced: true });
    const turn = anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL });
    expect(await runAgentSlice(desk.sliceOptions(turn))).toMatchObject({ status: "failed", stopReason: "provider" });
    expect([...desk.ledger.entries()]).toEqual([
      [1, { inputTokens: 0, outputTokens: 0, costUsd: 0 }],
      [2, { inputTokens: 0, outputTokens: 0, costUsd: 0 }],
    ]);
    expect(desk.run.costUsd).toBe(0);
  });

  it("charges a call the provider took and then lost at its hold, and the next call its own usage", async () => {
    const responses = [anthropicLost(), anthropicOk()];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift()!));
    const desk = agentRunDesk({ items: items(), priced: true });
    const turn = anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL });
    expect(await runAgentSlice(desk.sliceOptions(turn))).toMatchObject({ status: "completed", stopReason: "done" });
    expect(desk.ledger.get(1)).toEqual({ inputTokens: 0, outputTokens: 0, costUsd: desk.holds.get(1), estimated: true });
    expect(desk.ledger.get(2)).toEqual({ inputTokens: 47, outputTokens: 11, costUsd: runCostUsd(47, 11) });
  });
});

/* A rate limit may ask for a wait longer than a whole round. The SDK would
 * obey it and sleep through the round's abort, so the refusal — which bills
 * nothing — would surface as a call that never reported, charged at its hold.
 * The adapter caps the wait, so the refusal arrives inside the round. */
describe("a requested retry wait never outlasts the round", () => {
  const limited = (headers: Record<string, string>) => new Response(
    JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "Rate limited" } }),
    { status: 429, headers: { "content-type": "application/json", ...headers } });

  it("caps a long retry-after-ms or retry-after, and leaves a short one and a success alone", async () => {
    const reply = (response: Response) => vi.fn(async () => response);
    vi.stubGlobal("fetch", reply(limited({ "retry-after-ms": "60000" })));
    expect((await boundedRetryFetch(50)("https://x.invalid")).headers.get("retry-after-ms")).toBe("50");
    vi.stubGlobal("fetch", reply(limited({ "retry-after": "120" })));
    const seconds = await boundedRetryFetch(50)("https://x.invalid");
    expect([seconds.headers.get("retry-after-ms"), seconds.headers.get("retry-after"), seconds.status]).toEqual(["50", null, 429]);
    vi.stubGlobal("fetch", reply(limited({ "retry-after-ms": "20" })));
    expect((await boundedRetryFetch(50)("https://x.invalid")).headers.get("retry-after-ms")).toBe("20");
    vi.stubGlobal("fetch", reply(limited({ "retry-after": new Date(Date.now() + 3_600_000).toUTCString() })));
    expect((await boundedRetryFetch(50)("https://x.invalid")).headers.get("retry-after-ms")).toBe("50");
    vi.stubGlobal("fetch", reply(new Response("ok", { status: 200, headers: { "retry-after": "999" } })));
    expect((await boundedRetryFetch(50)("https://x.invalid")).headers.get("retry-after")).toBe("999");
    expect(RETRY_WAIT_CAP_MS).toBe(8_000);
  });

  it("records a rate limit that asked for a minute at zero, inside a round that would time out first", async () => {
    const fetch = vi.fn(async () => limited({ "retry-after-ms": "60000" }));
    vi.stubGlobal("fetch", fetch);
    const desk = agentRunDesk({ items: [deskItem(1, 30), deskItem(2, 20)], priced: true });
    const turn = anthropicTurn({ apiKey: "sk-test-0123456789abcdef", model: OS_MODEL, retryWaitCapMs: 5 });
    const outcome = await runAgentSlice(desk.sliceOptions(turn, { timeout: () => AbortSignal.timeout(2_000) }));
    expect(outcome).toMatchObject({ status: "failed", stopReason: "provider" });
    // Three attempts a round (the SDK's two retries), two rounds before the run gives up.
    expect(fetch).toHaveBeenCalledTimes(6);
    expect([...desk.ledger.entries()]).toEqual([
      [1, { inputTokens: 0, outputTokens: 0, costUsd: 0 }],
      [2, { inputTokens: 0, outputTokens: 0, costUsd: 0 }],
    ]);
    expect(desk.run.costUsd).toBe(0);
  });
});

