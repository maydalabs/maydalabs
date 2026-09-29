import {
  fileWorkBatch,
  rememberFact,
  type CofounderMessage,
  type Db,
  type ModelTurn,
  type WorkBatchResult,
} from "@/lib/osCofounder";
import { runCostUsd } from "@/lib/os";
import { costUsdAt, type ModelPrice } from "@/lib/osModelSettings";

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
  /* False for a model on this machine: tokens are still counted, so the
   * transcript says what a turn would have cost, but nothing is charged. */
  priced?: boolean;
  price?: ModelPrice;
  signal?: AbortSignal;
}): AsyncGenerator<TurnEvent> {
  const messages: { role: "user" | "assistant"; content: unknown }[] = toModelMessages(options.history);

  let inputTokens = 0;
  let outputTokens = 0;
  let spoken = "";
  let creationClosed: string | null = null;
  // Only a per-turn write ledger. It does not infer semantic equivalence or
  // replace durable cross-request idempotency or company-memory reads.
  const savedMemories = new Map<string, string>();
  const uncertainMemories = new Map<string, string>();
  let needsReceipt = false;
  const receipts: string[] = [];
  let lastProblem: string | null = null;
  const memoryProblems = new Map<string, number>();
  // A later tool error must not hide a possibly committed write. This
  // warning cannot be resolved by another tool in the same turn.
  const uncertainSaves = new Set<string>();

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    options.signal?.throwIfAborted();
    const blocks: Block[] = [];
    const calls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    let roundText = "";
    let stopReason: string | null = null;

    for await (const event of options.turn({
      system: options.system,
      messages,
      tools: [...(creationClosed ? [] : ["file_work" as const]), "remember"],
      signal: options.signal,
    })) {
      options.signal?.throwIfAborted();
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

    if (calls.length === 0 || stopReason !== "tool_use") {
      // A pre-tool "Drafting..." is not a save receipt. A silent final model
      // response must not leave that as the only durable answer.
      if (roundText.trim()) needsReceipt = false;
      break;
    }

    if (roundText) blocks.push({ type: "text", text: roundText });
    for (const call of calls) blocks.push({ type: "tool_use", ...call });
    messages.push({ role: "assistant", content: blocks });

    const results: Extract<Block, { type: "tool_result" }>[] = [];
    needsReceipt = true;
    const filingCalls = calls.filter((call) => call.name === "file_work");
    if (filingCalls.length) {
      options.signal?.throwIfAborted();
      const filed: WorkBatchResult = creationClosed
        ? { ok: false as const, error: creationClosed, retryable: false }
        : await fileWorkBatch(options.supabase, options.companyId, filingCalls.map((call) => call.input));
      options.signal?.throwIfAborted();
      if (filed.ok) {
        creationClosed = "This turn already saved the requested work; no additional item was created. Nothing was approved or sent.";
        lastProblem = null;
        for (const [index, call] of filingCalls.entries()) {
          const title = filed.titles[index];
          const receipt = `Saved in Work for your review: "${title}". Nothing was approved or sent.`;
          receipts.push(receipt);
          results.push({ type: "tool_result", tool_use_id: call.id, content: `${receipt} No further work will be created in this turn.` });
          yield { type: "filed", title };
        }
      } else {
        // Validation failures write nothing and can be repaired as a whole.
        // A failed database attempt is ambiguous; never automatically retry.
        if (!filed.retryable) {
          if (!creationClosed) uncertainSaves.add(filed.error);
          creationClosed = filed.error;
        }
        lastProblem = filed.error;
        for (const call of filingCalls) results.push({ type: "tool_result", tool_use_id: call.id, content: filed.error, is_error: true });
        yield { type: "refused", reason: filed.error };
      }
    }
    for (const call of calls) {
      options.signal?.throwIfAborted();
      if (call.name === "file_work") continue;

      if (call.name === "remember") {
        const identity = typeof call.input.fact === "string" ? call.input.fact.trim().replace(/\s+/g, " ") : "";
        const saved = savedMemories.get(identity);
        if (saved) {
          results.push({ type: "tool_result", tool_use_id: call.id, content: `Already saved in your company memory this turn: "${saved}". No additional memory was created.` });
          continue;
        }
        const uncertain = uncertainMemories.get(identity);
        if (uncertain) {
          results.push({ type: "tool_result", tool_use_id: call.id, content: uncertain, is_error: true });
          yield { type: "refused", reason: uncertain };
          continue;
        }
        const learned = await rememberFact(options.supabase, options.companyId, call.input);
        options.signal?.throwIfAborted();
        if (learned.ok) {
          savedMemories.set(identity, learned.fact);
          // A later model round can repair validation. Another valid fact in
          // the same batch does not repair its sibling's rejected input.
          for (const [problem, failedRound] of memoryProblems) {
            if (failedRound < round) memoryProblems.delete(problem);
          }
          const receipt = `Added to your company memory: "${learned.fact}".`;
          receipts.push(receipt);
          results.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: receipt,
          });
          yield { type: "learned", fact: learned.fact };
        } else {
          if (!learned.retryable) {
            uncertainMemories.set(identity, learned.error);
            uncertainSaves.add(learned.error);
          }
          memoryProblems.set(learned.error, round);
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
      lastProblem = `There is no tool called ${call.name}; that action was not performed.`;
      yield { type: "refused", reason: call.name };
    }

    // Execute the file batch together, but return results in original call
    // order. Ollama's adapter conveys results positionally, without call IDs.
    const callOrder = new Map(calls.map((call, index) => [call.id, index]));
    results.sort((a, b) => callOrder.get(a.tool_use_id)! - callOrder.get(b.tool_use_id)!);
    messages.push({ role: "user", content: results });
  }

  options.signal?.throwIfAborted();
  if (needsReceipt || !spoken.trim()) {
    const problems = [...new Set([...uncertainSaves, ...(lastProblem ? [lastProblem] : []), ...memoryProblems.keys()])];
    const receipt = [...receipts, ...problems].join("\n") || "I couldn't produce an answer. Please try again.";
    const text = `${spoken ? "\n\n" : ""}${receipt}`;
    spoken += text;
    yield { type: "text", text };
  }
  yield {
    type: "done",
    text: spoken,
    inputTokens,
    outputTokens,
    costUsd: options.priced === false ? 0 : options.price ? costUsdAt(options.price, inputTokens, outputTokens) : runCostUsd(inputTokens, outputTokens),
  };
}
