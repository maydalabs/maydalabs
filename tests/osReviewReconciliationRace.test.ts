import { describe, expect, it, vi } from "vitest";
import { createReviewReadFence, reviewIdentityChanged } from "@/components/os/CofounderApp";
import type { ReviewSnapshot } from "@/lib/osReviewTypes";

vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("only the current reconciliation read may change review state", () => {
  it("ignores an older proposed response arriving after a newer saved receipt", async () => {
    const fence = createReviewReadFence();
    const old = deferred<string>();
    const commit = vi.fn(); const fail = vi.fn();
    const first = fence.read(() => old.promise, commit, fail);
    expect(await fence.read(async () => "saved receipt", commit, fail)).toBe(true);
    old.resolve("outdated proposed snapshot");
    expect(await first).toBe(false);
    expect(commit).toHaveBeenCalledExactlyOnceWith("saved receipt");
    expect(fail).not.toHaveBeenCalled();
  });

  it("does not replace a newer successful reconciliation with an older read failure", async () => {
    const fence = createReviewReadFence();
    const old = deferred<string>();
    const commit = vi.fn(); const fail = vi.fn();
    const first = fence.read(() => old.promise, commit, fail);
    await fence.read(async () => "saved receipt", commit, fail);
    old.reject(new Error("old network failure"));
    expect(await first).toBe(false);
    expect(fail).not.toHaveBeenCalled();
    expect(commit).toHaveBeenCalledExactlyOnceWith("saved receipt");
  });

  for (const mutation of ["review save", "preview edit", "dismissal", "generation", "interruption"]) {
    it(`a ${mutation} invalidates an outstanding read before it can unlock stale controls`, async () => {
      const fence = createReviewReadFence();
      const old = deferred<string>();
      const commit = vi.fn(); const fail = vi.fn();
      const first = fence.read(() => old.promise, commit, fail);
      fence.invalidate(); // Called synchronously before the mutation starts.
      old.resolve("snapshot from before mutation");
      expect(await first).toBe(false);
      expect(commit).not.toHaveBeenCalled();
      expect(fail).not.toHaveBeenCalled();
      // The confirmed mutation can always be reconciled with a new read.
      expect(await fence.read(async () => "current receipt", commit, fail)).toBe(true);
      expect(commit).toHaveBeenCalledExactlyOnceWith("current receipt");
    });
  }

  it("a stale failure after mutation cannot override the mutation's own uncertain state", async () => {
    const fence = createReviewReadFence(); const old = deferred<string>();
    const commit = vi.fn(); const fail = vi.fn();
    const first = fence.read(() => old.promise, commit, fail);
    fence.invalidate();
    old.reject(new Error("stale failed GET"));
    expect(await first).toBe(false);
    expect(commit).not.toHaveBeenCalled(); expect(fail).not.toHaveBeenCalled();
  });

  it("the newest failure stays failed even when an older success arrives later", async () => {
    const fence = createReviewReadFence(); const old = deferred<string>();
    const commit = vi.fn(); const fail = vi.fn();
    const first = fence.read(() => old.promise, commit, fail);
    expect(await fence.read(async () => { throw new Error("latest GET failed"); }, commit, fail)).toBe(false);
    old.resolve("older success"); await first;
    expect(commit).not.toHaveBeenCalled(); expect(fail).toHaveBeenCalledTimes(1);
    expect(await fence.read(async () => "later retry read", commit, fail)).toBe(true);
    expect(commit).toHaveBeenCalledExactlyOnceWith("later retry read");
  });

  it("unmount or identity-change cleanup invalidates a late response", async () => {
    const fence = createReviewReadFence(); const old = deferred<string>();
    const commit = vi.fn(); const fail = vi.fn();
    const first = fence.read(() => old.promise, commit, fail);
    fence.invalidate();
    old.resolve("old company snapshot"); await first;
    expect(commit).not.toHaveBeenCalled(); expect(fail).not.toHaveBeenCalled();
  });
});

describe("RSC refresh cannot silently move a client conversation", () => {
  const current: ReviewSnapshot = { actorId: "founder-one", companyId: "company-one", messages: [], proposals: [], turns: [] };
  it("preserves the chat when a same-identity RSC refresh updates other panes", () => {
    expect(reviewIdentityChanged(current, structuredClone(current))).toBe(false);
  });
  it("blocks actions if the server-selected company changes", () => {
    expect(reviewIdentityChanged(current, { ...current, companyId: "company-two" })).toBe(true);
  });
  it("blocks actions if the authenticated actor changes", () => {
    expect(reviewIdentityChanged(current, { ...current, actorId: "founder-two" })).toBe(true);
  });
  it("does not treat loss of the incoming server snapshot as authorization to continue", () => {
    expect(reviewIdentityChanged(current, null)).toBe(true);
  });
  it("an initially empty pane has no stale identity to migrate", () => {
    expect(reviewIdentityChanged(null, null)).toBe(false);
    expect(reviewIdentityChanged(null, current)).toBe(false);
  });
});
