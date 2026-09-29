import { afterEach, describe, expect, it, vi } from "vitest";
import { parseLegacyPendingQuestion, parsePendingQuestion, pendingQuestionKey, subscribePending, writePending } from "@/lib/osReviewPending";
import { interruptionReceiptMatches, legacyPendingReceiptMatches, pendingReceiptMatches } from "@/components/os/CofounderApp";
import type { ReviewSnapshot } from "@/lib/osReviewTypes";

vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));

const pending = { requestId: "10000000-0000-4000-8000-000000000001", message: "Prepare this exact draft.\nDo not send it.", mode: "draft" as const, intent: { draftFormat: "email" as const, knowledgeAssertion: null } };
const turn: ReviewSnapshot["turns"][number] = { id: pending.requestId, company_id: "company-one", actor_id: "actor-one", thread_id: "thread-one", person_message_id: "message-one", status: "completed", question: pending.message, mode: "draft", intent: pending.intent, reply: "Synthetic reply", created_at: "2026-09-22T12:00:00Z", updated_at: "2026-09-22T12:01:00Z", history: [] };
const snapshot: ReviewSnapshot = { companyId: "company-one", actorId: "actor-one", turns: [turn], messages: [], proposals: [] };

describe("pending generation recovery identity", () => {
  it("keeps the exact nonce, question text and mode through JSON reload", () => {
    expect(parsePendingQuestion(JSON.stringify(pending))).toEqual(pending);
    expect(parsePendingQuestion(JSON.stringify({ ...pending, extra: "untrusted" }))).toEqual(pending);
  });
  it("scopes the hint to both actor and company", () => {
    const key = pendingQuestionKey("actor-one", "company-one");
    expect(key).toBe("maydaos-review-request-v1:actor-one:company-one");
    expect(key).not.toBe(pendingQuestionKey("actor-two", "company-one"));
    expect(key).not.toBe(pendingQuestionKey("actor-one", "company-two"));
  });
  for (const [name, value] of [
    ["absent", null], ["invalid JSON", "not-json"], ["array", "[]"], ["empty object", "{}"],
    ["old record with no mode", JSON.stringify({ requestId: pending.requestId, message: pending.message })],
    ["unknown mode", JSON.stringify({ ...pending, mode: "send" })],
    ["non-string mode", JSON.stringify({ ...pending, mode: 3 })],
    ["non-string request", JSON.stringify({ ...pending, requestId: 123 })],
    ["invalid request", JSON.stringify({ ...pending, requestId: "not-an-id" })],
    ["all-hyphens request", JSON.stringify({ ...pending, requestId: "-".repeat(36) })],
    ["empty message", JSON.stringify({ ...pending, message: " " })],
    ["non-string message", JSON.stringify({ ...pending, message: null })],
    ["oversized message", JSON.stringify({ ...pending, message: "x".repeat(8001) })],
  ]) {
    it(`does not mistake ${name} state for a reusable question`, () => expect(parsePendingQuestion(value)).toBeNull());
  }
  it("accepts the supported message size without truncation", () => {
    expect(parsePendingQuestion(JSON.stringify({ ...pending, message: "x".repeat(8000) }))?.message).toHaveLength(8000);
  });
  it("round-trips each supported mode without changing the selected meaning", () => {
    for (const mode of ["ask", "draft", "knowledge", "both"] as const) {
      const intent = { draftFormat: mode === "draft" || mode === "both" ? "email" : null, knowledgeAssertion: mode === "knowledge" || mode === "both" ? "This exact founder assertion." : null };
      expect(parsePendingQuestion(JSON.stringify({ ...pending, mode, intent }))).toEqual({ ...pending, mode, intent });
    }
  });
  it("keeps an old mode-less hint readable only for receipt lookup, never as a modeful retry", () => {
    const old = { requestId: pending.requestId, message: pending.message };
    expect(parseLegacyPendingQuestion(JSON.stringify(old))).toEqual(old);
    expect(parsePendingQuestion(JSON.stringify(old))).toBeNull();
    expect(parseLegacyPendingQuestion(JSON.stringify(pending))).toBeNull();
    expect(parseLegacyPendingQuestion(JSON.stringify({ ...old, mode: "send" }))).toBeNull();
  });
  it("keeps a modeful pre-intent hint lookup-only and never invents a format", () => {
    const old = { requestId: pending.requestId, message: pending.message, mode: "draft" };
    expect(parsePendingQuestion(JSON.stringify(old))).toBeNull();
    expect(parseLegacyPendingQuestion(JSON.stringify(old))).toEqual(old);
  });
  it.each([null, {}, { draftFormat: null, knowledgeAssertion: null }, { draftFormat: "email", knowledgeAssertion: "Hidden assertion" }])("rejects malformed intent without falling back to a legacy retry: %j", (intent) => {
    const raw = JSON.stringify({ ...pending, intent });
    expect(parsePendingQuestion(raw)).toBeNull();
    expect(parseLegacyPendingQuestion(raw)).toBeNull();
  });
});

describe("only an exact stored receipt resolves generation uncertainty", () => {
  for (const status of ["running", "completed", "failed"] as const) {
    it(`a matching ${status} record resolves only the begin uncertainty`, () => {
      expect(pendingReceiptMatches({ ...snapshot, turns: [{ ...turn, status }] }, pending)).toBe(true);
    });
  }
  for (const [name, patch] of [
    ["different nonce", { id: "20000000-0000-4000-8000-000000000002" }],
    ["different question", { question: "Send it now." }],
    ["trailing question edit", { question: `${pending.message} ` }],
    ["different selected mode", { mode: "knowledge" }],
    ["different draft format", { intent: { draftFormat: "reply", knowledgeAssertion: null } }],
    ["legacy intent", { intent: null }],
    ["different actor", { actor_id: "actor-two" }],
    ["different company", { company_id: "company-two" }],
  ] as const) {
    it(`does not clear a recovery hint after reading a ${name}`, () => {
      expect(pendingReceiptMatches({ ...snapshot, turns: [{ ...turn, ...patch }] }, pending)).toBe(false);
    });
  }
  it("an empty successful GET is not evidence the request never started", () => {
    expect(pendingReceiptMatches({ ...snapshot, turns: [] }, pending)).toBe(false);
  });
  it("finds the exact target even when it is older than the first listed turn", () => {
    expect(pendingReceiptMatches({ ...snapshot, turns: [{ ...turn, id: "newer-turn" }, turn] }, pending)).toBe(true);
  });
  it("reconciles an old hint only to a historical both-mode receipt with exact identity and question", () => {
    const old = { requestId: pending.requestId, message: pending.message };
    expect(legacyPendingReceiptMatches({ ...snapshot, turns: [{ ...turn, mode: "both", intent: null }] }, old)).toBe(true);
    expect(legacyPendingReceiptMatches(snapshot, old)).toBe(false);
    expect(legacyPendingReceiptMatches({ ...snapshot, turns: [{ ...turn, mode: "both", actor_id: "someone-else" }] }, old)).toBe(false);
    expect(legacyPendingReceiptMatches({ ...snapshot, turns: [{ ...turn, mode: "both", question: "changed" }] }, old)).toBe(false);
  });
  it("matches an old modeful hint only to its exact historical mode and null intent", () => {
    const old = { requestId: pending.requestId, message: pending.message, mode: "draft" as const };
    expect(legacyPendingReceiptMatches({ ...snapshot, turns: [{ ...turn, intent: null }] }, old)).toBe(true);
    expect(legacyPendingReceiptMatches(snapshot, old)).toBe(false);
    expect(legacyPendingReceiptMatches({ ...snapshot, turns: [{ ...turn, mode: "both", intent: null }] }, old)).toBe(false);
  });
  it("does not match a changed company assertion even with identical question and mode", () => {
    const question = { ...pending, mode: "knowledge" as const, intent: { draftFormat: null, knowledgeAssertion: "The exact approved statement." } };
    expect(pendingReceiptMatches({ ...snapshot, turns: [{ ...turn, mode: "knowledge", intent: question.intent }] }, question)).toBe(true);
    expect(pendingReceiptMatches({ ...snapshot, turns: [{ ...turn, mode: "knowledge", intent: { ...question.intent, knowledgeAssertion: "A different statement." } }] }, question)).toBe(false);
  });
});

describe("session recovery storage", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("notifies the current tab on write and clears only the scoped key", () => {
    const values = new Map<string, string>();
    const browser = new EventTarget();
    vi.stubGlobal("window", browser);
    vi.stubGlobal("sessionStorage", { setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
    const changed = vi.fn();
    const unsubscribe = subscribePending(changed);
    const key = pendingQuestionKey(snapshot.actorId, snapshot.companyId);
    const otherKey = pendingQuestionKey("someone-else", snapshot.companyId);
    values.set(otherKey, "unchanged");
    writePending(key, pending);
    expect(parsePendingQuestion(values.get(key)!)).toEqual(pending);
    expect(changed).toHaveBeenCalledTimes(1);
    writePending(key, null);
    expect(values.has(key)).toBe(false);
    expect(values.get(otherKey)).toBe("unchanged");
    expect(changed).toHaveBeenCalledTimes(2);
    unsubscribe();
    browser.dispatchEvent(new Event("storage"));
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it("propagates write failure, so a caller cannot consider the nonce persisted", () => {
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("sessionStorage", { setItem: () => { throw new Error("storage blocked"); } });
    expect(() => writePending("scoped-key", pending)).toThrow("storage blocked");
  });
  it("refuses a malformed mode before writing a recovery marker", () => {
    const setItem = vi.fn();
    vi.stubGlobal("sessionStorage", { setItem });
    expect(() => writePending("scoped-key", { ...pending, mode: "send" } as never)).toThrow("invalid_request_mode");
    expect(setItem).not.toHaveBeenCalled();
  });
  it("refuses missing intent before writing a recovery marker", () => {
    const setItem = vi.fn();
    vi.stubGlobal("sessionStorage", { setItem });
    expect(() => writePending("scoped-key", { ...pending, intent: undefined } as never)).toThrow("invalid_request_intent");
    expect(setItem).not.toHaveBeenCalled();
  });
  it("propagates remove failure rather than claiming the local recovery marker is gone", () => {
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("sessionStorage", { removeItem: () => { throw new Error("storage blocked"); } });
    expect(() => writePending("scoped-key", null)).toThrow("storage blocked");
  });
});

describe("an interrupted answer needs its exact stored terminal receipt", () => {
  it("accepts the original actor/company turn marked failed, not a new generation", () => {
    expect(interruptionReceiptMatches({ turn: { ...turn, status: "failed" } }, turn.id, snapshot)).toBe(true);
  });
  it("accepts the exact completed turn when completion wins the interruption race", () => {
    expect(interruptionReceiptMatches({ turn }, turn.id, snapshot)).toBe(true);
  });
  for (const [name, value] of [
    ["absent", null], ["empty", {}], ["still running", { turn: { ...turn, status: "running" } }],
    ["different turn", { turn: { ...turn, id: "another-turn", status: "failed" } }],
    ["different actor", { turn: { ...turn, actor_id: "other-actor", status: "failed" } }],
    ["different company", { turn: { ...turn, company_id: "other-company", status: "failed" } }],
  ] as const) {
    it(`keeps uncertainty for ${name}`, () => expect(interruptionReceiptMatches(value, turn.id, snapshot)).toBe(false));
  }
});
