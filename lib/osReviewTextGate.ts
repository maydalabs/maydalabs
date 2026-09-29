/** Keep a model's serialized tool envelope out of the founder-facing stream.
 * Tool calls are structured events, not prose. Ordinary prose still streams
 * immediately; only a line beginning with markup/JSON is held for inspection.
 */
export class ReviewedTextGate {
  private pending = "";
  private mode: "start" | "plain" | "candidate" = "start";
  private inEnvelope = false;
  private suppressed = false;

  get suppressedToolEcho() { return this.suppressed; }

  feed(chunk: string): string[] {
    const visible: string[] = [];
    let remaining = chunk;
    for (;;) {
      const newline = remaining.indexOf("\n");
      const segment = newline < 0 ? remaining : remaining.slice(0, newline);
      this.segment(segment, visible);
      if (newline < 0) break;
      this.endLine(true, visible);
      remaining = remaining.slice(newline + 1);
    }
    return visible;
  }

  finish(): string[] {
    const visible: string[] = [];
    this.endLine(false, visible);
    return visible;
  }

  private segment(segment: string, visible: string[]) {
    if (this.mode === "plain") {
      if (segment) visible.push(segment);
      return;
    }
    this.pending += segment;
    if (this.inEnvelope) {
      this.mode = "candidate";
      return;
    }
    if (this.mode === "start") {
      const first = this.pending.trimStart()[0];
      if (!first) return;
      if ("{[<`".includes(first)) {
        this.mode = "candidate";
      } else {
        visible.push(this.pending);
        this.pending = "";
        this.mode = "plain";
      }
    }
  }

  private endLine(newline: boolean, visible: string[]) {
    const line = this.pending;
    const trimmed = line.trim();
    if (this.mode === "plain") {
      if (newline) visible.push("\n");
    } else if (this.inEnvelope) {
      this.suppressed = true;
      if (/<\/(?:response|tool_call)>/i.test(trimmed)) this.inEnvelope = false;
    } else if (/^<(?:response|tool_call)(?:\s|>)/i.test(trimmed)) {
      this.suppressed = true;
      this.inEnvelope = !/<\/(?:response|tool_call)>/i.test(trimmed);
    } else if (/^[{[]/.test(trimmed) && /"name"\s*:\s*"(?:propose_work|propose_knowledge|file_work|remember|approve|send)"/i.test(trimmed) && /"arguments"\s*:/i.test(trimmed)) {
      this.suppressed = true;
    } else if (line || newline) {
      visible.push(`${line}${newline ? "\n" : ""}`);
    }
    this.pending = "";
    this.mode = "start";
  }
}
