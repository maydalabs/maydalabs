import { cofounderTools, type CofounderToolName, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";

/* The OpenAI-compatible side of the seam.
 *
 * OpenAI, xAI's Grok, Groq, Mistral and most hosted models speak the same
 * chat-completions dialect, so one adapter lets a company bring nearly any
 * key. It is the same shape as the Anthropic and Ollama adapters: our
 * messages in, events out, and nothing above it knows which provider spoke.
 * The key never appears in an error, a log or a label.
 */

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export type OpenAiMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type OpenAiCompatibleSettings = { baseUrl: string; apiKey: string; model: string };

/** Only https, or a loopback address for a developer's own gateway. */
export function isAllowedBaseUrl(value: string): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  if (url.username || url.password || url.search || url.hash) return false;
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
}

export function toOpenAiMessages(system: string, messages: { role: "user" | "assistant"; content: unknown }[]): OpenAiMessage[] {
  const out: OpenAiMessage[] = [{ role: "system", content: system }];
  for (const message of messages) {
    if (typeof message.content === "string") {
      out.push({ role: message.role, content: message.content });
      continue;
    }
    const blocks = (Array.isArray(message.content) ? message.content : []) as Block[];
    if (message.role === "assistant") {
      const text = blocks.filter((b): b is Extract<Block, { type: "text" }> => b.type === "text").map((b) => b.text).join("");
      const calls = blocks
        .filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use")
        .map((b) => ({ id: b.id, type: "function" as const, function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } }));
      out.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      for (const block of blocks) {
        if (block.type === "tool_result") out.push({ role: "tool", tool_call_id: block.tool_use_id, content: block.content });
        else if (block.type === "text") out.push({ role: "user", content: block.text });
      }
    }
  }
  return out;
}

export function toOpenAiTools(names?: readonly CofounderToolName[]) {
  return cofounderTools(names).map((tool) => ({
    type: "function" as const,
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  }));
}

function asInput(value: string): Record<string, unknown> {
  if (!value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

type Chunk = {
  choices?: { delta?: { content?: string | null; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] }; finish_reason?: string | null }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
  error?: { message?: string } | string;
};

export function openAiCompatibleTurn(settings: OpenAiCompatibleSettings, fetcher: typeof fetch = fetch): ModelTurn {
  if (!isAllowedBaseUrl(settings.baseUrl)) throw new Error("model provider: base URL must be https");
  const endpoint = `${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  return async function* turn({ system, messages, tools, signal }): AsyncIterable<ModelEvent> {
    signal?.throwIfAborted();
    const toolList = toOpenAiTools(tools);
    const response = await fetcher(endpoint, {
      method: "POST",
      signal,
      redirect: "error",
      credentials: "omit",
      headers: { "content-type": "application/json", authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({
        model: settings.model,
        messages: toOpenAiMessages(system, messages),
        ...(toolList.length ? { tools: toolList } : {}),
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: 2000,
      }),
    });

    if (!response.ok || !response.body) {
      // The status is the diagnosis a person can act on; the body may quote
      // the request and is not repeated.
      throw new Error(`model provider: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finished = false;
    let finishReason: string | null = null;
    let inputTokens = 0;
    let outputTokens = 0;
    const calls = new Map<number, { id: string; name: string; args: string }>();

    const handle = function* (line: string): Generator<ModelEvent> {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) return;
      if (!trimmed.startsWith("data:")) return;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") { finished = true; return; }
      if (finished) throw new Error("model provider: data received after completion");
      let chunk: Chunk;
      try { chunk = JSON.parse(payload) as Chunk; } catch { throw new Error("model provider: malformed streaming response"); }
      if (chunk.error) throw new Error("model provider: the provider reported an error");
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
        outputTokens = chunk.usage.completion_tokens ?? outputTokens;
      }
      const choice = chunk.choices?.[0];
      if (!choice) return;
      if (choice.delta?.content) yield { type: "text", text: choice.delta.content };
      for (const part of choice.delta?.tool_calls ?? []) {
        const current = calls.get(part.index) ?? { id: "", name: "", args: "" };
        if (part.id) current.id = part.id;
        if (part.function?.name) current.name += part.function.name;
        if (part.function?.arguments) current.args += part.function.arguments;
        calls.set(part.index, current);
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    };

    try {
      for (;;) {
        signal?.throwIfAborted();
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) yield* handle(line);
      }
      if (buffer.trim()) yield* handle(buffer);
      signal?.throwIfAborted();
      if (!finished && finishReason === null) throw new Error("model provider: stream ended without a completion record");
    } finally {
      try { await reader.cancel(); } finally { reader.releaseLock(); }
    }

    let n = 0;
    for (const [, call] of [...calls.entries()].sort((a, b) => a[0] - b[0])) {
      n += 1;
      yield { type: "tool", id: call.id || `call-${n}`, name: call.name, input: asInput(call.args) };
    }

    yield {
      type: "done",
      // A token-limit stop stays interrupted even when a tool call rode along.
      stopReason: finishReason === "tool_calls" ? "tool_use" : finishReason === "stop" ? (n > 0 ? "tool_use" : "end_turn") : finishReason === "length" ? "max_tokens" : finishReason,
      inputTokens,
      outputTokens,
    };
  };
}
