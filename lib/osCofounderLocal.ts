import { FILE_WORK_TOOL, REMEMBER_TOOL, type ModelEvent, type ModelTurn } from "@/lib/osCofounder";

/* Whatever the environment holds; process.env is one of these. */
type Env = Record<string, string | undefined>;

/* The other side of the seam: a model on this machine.
 *
 * The co-founder has never spoken. Every loop above the seam — tool calls,
 * the cap on rounds, the accounting, what gets filed and remembered — has
 * only ever been exercised against a scripted fake, because the real model
 * costs money and the money is deliberately not being spent yet. A model
 * running locally through Ollama costs nothing, so the whole conversation
 * can be run for real: streaming, tools, memory, the lot. What it cannot do
 * is judge quality — a 14B model is not Claude — so this is for the plumbing
 * and the harness, and it refuses to run anywhere but a development machine.
 *
 * Ollama's own chat API, not the OpenAI-shaped one: it streams tool calls as
 * whole objects and reports token counts, which are the two things the loop
 * needs and the compatibility layer is worse at.
 */

const DEFAULT_URL = "http://127.0.0.1:11434";

/* Never on Vercel, whatever the environment says. A local model is a fact
 * about a developer's machine, and the one way it could reach production is
 * by someone setting the variable there; this ignores it. */
export function isLocalModelAllowed(env: Env = process.env): boolean {
  return !env.VERCEL && Boolean(env.MAYDAOS_LOCAL_MODEL);
}

export function localModelSettings(env: Env = process.env): { url: string; model: string } | null {
  if (!isLocalModelAllowed(env)) return null;
  return { url: (env.MAYDAOS_LOCAL_MODEL_URL || DEFAULT_URL).replace(/\/+$/, ""), model: env.MAYDAOS_LOCAL_MODEL! };
}

/* Our messages are Anthropic-shaped: text, or blocks of text / tool_use /
 * tool_result. Ollama wants assistant tool calls beside the text and tool
 * results as messages of their own, in the role "tool". */
type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export type OllamaMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[];
};

export function toOllamaMessages(
  system: string,
  messages: { role: "user" | "assistant"; content: unknown }[],
): OllamaMessage[] {
  const out: OllamaMessage[] = [{ role: "system", content: system }];
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
        .map((b) => ({ function: { name: b.name, arguments: b.input } }));
      out.push({ role: "assistant", content: text, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      // A user turn made of tool results: each becomes a tool message.
      for (const block of blocks) {
        if (block.type === "tool_result") out.push({ role: "tool", content: block.content });
        else if (block.type === "text") out.push({ role: "user", content: block.text });
      }
    }
  }
  return out;
}

export function toOllamaTools() {
  return [FILE_WORK_TOOL, REMEMBER_TOOL].map((tool) => ({
    type: "function" as const,
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  }));
}

type Chunk = {
  message?: { content?: string; tool_calls?: { function: { name: string; arguments: Record<string, unknown> | string } }[] };
  done?: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
};

/* Ollama gives tool arguments as an object; some models return them as a
 * JSON string instead. Both are accepted; anything else is an empty input,
 * which the tool will refuse in its own words. */
function asInput(value: Record<string, unknown> | string): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return value ?? {};
}

export function localTurn(settings: { url: string; model: string }, fetcher: typeof fetch = fetch): ModelTurn {
  return async function* turn({ system, messages }): AsyncIterable<ModelEvent> {
    const response = await fetcher(`${settings.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: settings.model,
        messages: toOllamaMessages(system, messages),
        tools: toOllamaTools(),
        stream: true,
        options: { num_predict: 2000 },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`local model: ${response.status} ${await response.text().catch(() => "")}`.trim());
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let calls = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    const handle = function* (line: string): Generator<ModelEvent> {
      let chunk: Chunk;
      try {
        chunk = JSON.parse(line) as Chunk;
      } catch {
        return;
      }
      if (chunk.error) throw new Error(`local model: ${chunk.error}`);
      if (chunk.message?.content) yield { type: "text", text: chunk.message.content };
      for (const call of chunk.message?.tool_calls ?? []) {
        calls += 1;
        yield { type: "tool", id: `local-${calls}`, name: call.function.name, input: asInput(call.function.arguments) };
      }
      if (chunk.done) {
        inputTokens = chunk.prompt_eval_count ?? 0;
        outputTokens = chunk.eval_count ?? 0;
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) if (line.trim()) yield* handle(line);
    }
    if (buffer.trim()) yield* handle(buffer);

    yield {
      type: "done",
      // The loop continues only on "tool_use", as the SDK names it.
      stopReason: calls > 0 ? "tool_use" : "end_turn",
      inputTokens,
      outputTokens,
    };
  };
}

/* The worker's one call, locally. Ollama constrains its output to a JSON
 * schema when asked, which is the same promise the SDK's structured output
 * makes: every claim comes back with its source or with null. The shape
 * matches DraftClient, so the worker does not know which it was given. */
const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    draft: { type: "string" },
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, source_url: { type: ["string", "null"] } },
        required: ["text", "source_url"],
      },
    },
  },
  required: ["draft", "claims"],
};

export function localDraftClient(settings: { url: string; model: string }, fetcher: typeof fetch = fetch) {
  return {
    messages: {
      parse: async (params: Record<string, unknown>) => {
        const system = typeof params.system === "string" ? params.system : "";
        const given = Array.isArray(params.messages) ? (params.messages as { role: string; content: unknown }[]) : [];
        const messages: OllamaMessage[] = [
          { role: "system", content: system },
          ...given.map((m) => ({
            role: (m.role === "assistant" ? "assistant" : "user") as OllamaMessage["role"],
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          })),
        ];

        const response = await fetcher(`${settings.url}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ model: settings.model, messages, stream: false, format: DRAFT_SCHEMA, options: { num_predict: 4000 } }),
        });
        if (!response.ok) throw new Error(`local model: ${response.status}`);

        const body = (await response.json()) as Chunk;
        let parsed: { draft: string; claims: { text: string; source_url: string | null }[] } | null = null;
        try {
          const candidate = JSON.parse(body.message?.content ?? "") as { draft?: unknown; claims?: unknown };
          if (typeof candidate.draft === "string" && Array.isArray(candidate.claims)) {
            parsed = {
              draft: candidate.draft,
              claims: candidate.claims
                .filter((c): c is { text: string; source_url?: unknown } => Boolean(c) && typeof (c as { text?: unknown }).text === "string")
                .map((c) => ({ text: c.text, source_url: typeof c.source_url === "string" ? c.source_url : null })),
            };
          }
        } catch {
          parsed = null;
        }

        return {
          parsed_output: parsed,
          stop_reason: parsed ? "end_turn" : "schema_miss",
          usage: { input_tokens: body.prompt_eval_count ?? 0, output_tokens: body.eval_count ?? 0 },
        };
      },
    },
  };
}
