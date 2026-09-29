// Browser-safe transport. A clean EOF without a durable completion receipt is
// NOT success. Parse the final unterminated line and reject corrupt chunks.
export async function readReviewStream(response: Response, onText: (text: string) => void): Promise<"completed" | "running" | "failed"> {
  if (!response.ok || !response.body) throw new Error("review_response_unconfirmed");
  if (response.headers.get("content-type")?.includes("application/json")) {
    const body = await response.json();
    if (body.type !== "existing" || !["running", "completed", "failed"].includes(body.turn?.status)) throw new Error("review_response_unconfirmed");
    return body.turn.status;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  function line(raw: string) {
    if (!raw.trim()) return;
    const event = JSON.parse(raw);
    if (finished) throw new Error("review_event_after_completion");
    if (event.type === "text" && typeof event.text === "string") onText(event.text);
    else if (event.type === "done" && event.turn?.status === "completed") finished = true;
    else if (event.type === "error") throw new Error("review_response_unconfirmed");
    else if (!["started", "proposal", "refused"].includes(event.type)) throw new Error("review_invalid_event");
  }
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) line(raw);
    }
    buffer += decoder.decode();
    line(buffer);
    if (!finished) throw new Error("review_incomplete_stream");
    return "completed";
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
