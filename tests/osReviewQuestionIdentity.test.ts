import { describe, expect, it, vi } from "vitest";
import { ReviewIdentityChangedError, sendReviewQuestion } from "@/components/os/CofounderApp";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import { REVIEW_REQUEST_MODES } from "@/lib/osReviewIntent";

vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));

const question = { requestId: "00000000-0000-4000-8000-000000000001", message: "Prepare the draft.\nDo not send it.", mode: "draft" as const, intent: { draftFormat: "email" as const, knowledgeAssertion: null } };
const identity = { actorId: "00000000-0000-4000-8000-000000000002", companyId: "00000000-0000-4000-8000-000000000003" };
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } }); }

describe("co-founder UI question identity wire contract", () => {
  it("sends the displayed actor, company and mode with the exact question nonce", async () => {
    const returned = response({ type: "existing" });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(returned);
    expect(await sendReviewQuestion(question, identity, fetcher)).toBe(returned);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/os/cofounder", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: question.message, requestId: question.requestId, mode: question.mode, intent: question.intent,
        expectedActorId: identity.actorId, expectedCompanyId: identity.companyId }),
    });
  });

  it("deliberate retry keeps the same nonce, question, mode and displayed identity", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response({ type: "existing" }));
    await sendReviewQuestion(question, identity, fetcher);
    await sendReviewQuestion(structuredClone(question), structuredClone(identity), fetcher);
    expect(fetcher.mock.calls[1]).toEqual(fetcher.mock.calls[0]);
  });

  it.each(REVIEW_REQUEST_MODES)("carries %s through the wire without inferring intent from wording", async (mode) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ type: "existing" }));
    const intent = { draftFormat: mode === "draft" || mode === "both" ? "email" as const : null, knowledgeAssertion: mode === "knowledge" || mode === "both" ? "The exact statement I stand behind." : null };
    await sendReviewQuestion({ ...question, mode, intent }, identity, fetcher);
    const [, options] = fetcher.mock.calls[0];
    expect(JSON.parse(String(options?.body))).toMatchObject({
      message: question.message, requestId: question.requestId, mode, intent,
    });
  });

  it("turns a stale-identity response into the explicit reload path, with no retry or fallback identity", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error: "identity_changed" }, 409));
    await expect(sendReviewQuestion(question, identity, fetcher)).rejects.toBeInstanceOf(ReviewIdentityChangedError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each(["turn_unconfirmed", "no_company"])("does not confuse %s with permission to switch identity", async (error) => {
    const returned = response({ error }, 409);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(returned);
    expect(await sendReviewQuestion(question, identity, fetcher)).toBe(returned);
    expect(await returned.json()).toEqual({ error });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("leaves malformed error responses readable and unconfirmed, never resubmitting", async () => {
    const returned = new Response("not-json", { status: 409 });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(returned);
    expect(await sendReviewQuestion(question, identity, fetcher)).toBe(returned);
    expect(await returned.text()).toBe("not-json");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not retry a network failure with a new identity or nonce", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network interrupted"));
    await expect(sendReviewQuestion(question, identity, fetcher)).rejects.toThrow("network interrupted");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("visible request choices", () => {
  it("provides a distinct label, explanation and action in all three languages", () => {
    for (const locale of ["en", "tr", "fr"] as const) {
      const copy = OS_COFOUNDER_CHAT_COPY[locale];
      expect(copy.modeLabel.length).toBeGreaterThan(0);
      expect(Object.keys(copy.modes)).toEqual([...REVIEW_REQUEST_MODES]);
      expect(new Set(REVIEW_REQUEST_MODES.map((mode) => copy.modes[mode].label)).size).toBe(4);
      for (const mode of REVIEW_REQUEST_MODES) {
        expect(copy.modes[mode].help.length).toBeGreaterThan(20);
        expect(copy.modes[mode].submit.length).toBeGreaterThan(0);
      }
    }
  });
});
