import { describe, expect, it, vi } from "vitest";
import { readReviewStream } from "@/lib/osReviewStream";

function stream(parts: string[]) {
  return new Response(new ReadableStream({ start(c) { for (const p of parts) c.enqueue(new TextEncoder().encode(p)); c.close(); } }), { headers: { "content-type": "application/x-ndjson" } });
}
const done = JSON.stringify({ type: "done", turn: { status: "completed" } });
describe("durable chat transport", () => {
  it("joins split chunks and accepts a terminal receipt without final newline", async () => {
    const text = vi.fn();
    expect(await readReviewStream(stream(['{"type":"te', 'xt","text":"hello"}\n', done]), text)).toBe("completed");
    expect(text).toHaveBeenCalledWith("hello");
  });
  it.each([[], ['{"type":"text","text":"partial"}\n'], ['{truncated'], [done, '\n{"type":"text","text":"too late"}']].map((parts) => ({ parts })))("does not claim completion for corrupt/interrupted data $parts", async ({ parts }) => {
    await expect(readReviewStream(stream(parts), vi.fn())).rejects.toThrow();
  });
  it("rejects a server persistence failure even after fluent text", async () => {
    await expect(readReviewStream(stream(['{"type":"text","text":"Done!"}\n{"type":"error"}\n']), vi.fn())).rejects.toThrow();
  });
  it.each(["running", "completed", "failed"])("reads existing %s without generating again", async (status) => {
    const text = vi.fn();
    expect(await readReviewStream(Response.json({ type: "existing", turn: { status } }), text)).toBe(status);
    expect(text).not.toHaveBeenCalled();
  });
  it("rejects non-durable done", async () => {
    await expect(readReviewStream(stream(['{"type":"done"}']), vi.fn())).rejects.toThrow();
  });
  it("rejects failed HTTP responses", async () => {
    await expect(readReviewStream(new Response("failed", { status: 409 }), vi.fn())).rejects.toThrow();
  });
});
