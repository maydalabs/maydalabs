import { describe, expect, it, vi } from "vitest";
import { runCofounderTurn } from "@/lib/osCofounderRun";
import type { Db, ModelTurn } from "@/lib/osCofounder";

describe("cancelled measurements stop the conversation loop", () => {
  it("does not call a model after cancellation", async () => {
    const controller = new AbortController();
    controller.abort(new Error("measurement timed out"));
    const turn = vi.fn();
    const run = async () => {
      for await (const _ of runCofounderTurn({ supabase: {} as Db, companyId: "c", system: "s", history: [], turn, signal: controller.signal })) void _;
    };
    await expect(run()).rejects.toThrow("measurement timed out");
    expect(turn).not.toHaveBeenCalled();
  });

  it("forwards the signal and refuses tool writes or a success event after an aborted stream", async () => {
    const controller = new AbortController();
    const from = vi.fn();
    const events: string[] = [];
    const turn: ModelTurn = async function* ({ signal }) {
      expect(signal).toBe(controller.signal);
      yield { type: "tool", id: "tool", name: "file_work", input: { title: "Do not save" } };
      controller.abort(new Error("measurement timed out"));
      yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
    };
    const run = async () => {
      for await (const event of runCofounderTurn({ supabase: { from } as unknown as Db, companyId: "c", system: "s", history: [], turn, signal: controller.signal })) events.push(event.type);
    };
    await expect(run()).rejects.toThrow("measurement timed out");
    expect(from).not.toHaveBeenCalled();
    expect(events).not.toContain("done");
  });
});
