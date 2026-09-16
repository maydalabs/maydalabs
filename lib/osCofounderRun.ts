import {
  fileWork,
  rememberFact,
  type CofounderMessage,
  type Db,
  type ModelTurn,
} from "@/lib/osCofounder";
import { runCostUsd } from "@/lib/os";

/* One turn, including whatever the co-founder decides to do during it.
 *
 * A turn is not one model call. If it files work, the tool runs and the model
 * is called again so it can say what it did — otherwise a person watching the
 * conversation sees an answer that stops mid-thought and a task that appeared
 * from nowhere.
 *
 * The rounds are capped. A loop that can call a tool can call it forever, and
 * "forever" here is measured in dollars.
 */

export type TurnEvent =
  | { type: "text"; text: string }
  | { type: "filed"; title: string }
  | { type: "learned"; fact: string }
  | { type: "refused"; reason: string }
  | { type: "done"; text: string; inputTokens: number; outputTokens: number; costUsd: number };

const MAX_TOOL_ROUNDS = 3;

type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export function toModelMessages(history: CofounderMessage[]) {
  return history.map((message) => ({
    role: message.role === "person" ? ("user" as const) : ("assistant" as const),
    content: message.body,
  }));
}

export async function* runCofounderTurn(options: {
  supabase: Db;
  companyId: string;
  system: string;
  history: CofounderMessage[];
  turn: ModelTurn;
}): AsyncGenerator<TurnEvent> {
  const messages: { role: "user" | "assistant"; content: unknown }[] = toModelMessages(options.history);

  let inputTokens = 0;
  let outputTokens = 0;
  let spoken = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const blocks: Block[] = [];
    const calls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    let roundText = "";
    let stopReason: string | null = null;

    for await (const event of options.turn({ system: options.system, messages })) {
      if (event.type === "text") {
        roundText += event.text;
        spoken += event.text;
        yield { type: "text", text: event.text };
      } else if (event.type === "tool") {
        calls.push({ id: event.id, name: event.name, input: event.input });
      } else {
        stopReason = event.stopReason;
        inputTokens += event.inputTokens;
        outputTokens += event.outputTokens;
      }
    }

    if (calls.length === 0 || stopReason !== "tool_use") break;

    if (roundText) blocks.push({ type: "text", text: roundText });
    for (const call of calls) blocks.push({ type: "tool_use", ...call });
    messages.push({ role: "assistant", content: blocks });

    const results: Block[] = [];
    for (const call of calls) {
      if (call.name === "file_work") {
        const filed = await fileWork(options.supabase, options.companyId, call.input);
        if (filed.ok) {
          results.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: `Filed "${filed.title}". It is in their queue and waits for them.`,
          });
          yield { type: "filed", title: filed.title };
        } else {
          results.push({ type: "tool_result", tool_use_id: call.id, content: filed.error, is_error: true });
          yield { type: "refused", reason: filed.error };
        }
        continue;
      }

      if (call.name === "remember") {
        const learned = await rememberFact(options.supabase, options.companyId, call.input);
        if (learned.ok) {
          results.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: "Written down. They can see it and retire it if you have it wrong.",
          });
          yield { type: "learned", fact: learned.fact };
        } else {
          results.push({ type: "tool_result", tool_use_id: call.id, content: learned.error, is_error: true });
          yield { type: "refused", reason: learned.error };
        }
        continue;
      }

      // A tool it was never given. Answering honestly is better than failing
      // the turn: the model recovers, and the transcript shows what it tried.
      results.push({
        type: "tool_result",
        tool_use_id: call.id,
        content: `There is no tool called ${call.name}.`,
        is_error: true,
      });
      yield { type: "refused", reason: call.name };
    }

    messages.push({ role: "user", content: results });
  }

  yield {
    type: "done",
    text: spoken,
    inputTokens,
    outputTokens,
    costUsd: runCostUsd(inputTokens, outputTokens),
  };
}
