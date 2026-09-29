import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  context: vi.fn(), admin: vi.fn(), picked: vi.fn(), run: vi.fn(), configured: vi.fn(), claims: vi.fn(), server: vi.fn(), company: vi.fn(),
  budget: vi.fn(), begin: vi.fn(), finish: vi.fn(), propose: vi.fn(), history: vi.fn(), access: vi.fn(),
}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: mocks.configured }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: mocks.claims, createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osCompany", () => ({ currentCompany: mocks.company }));
vi.mock("@/lib/osCofounderModel", () => ({ pickTurn: mocks.picked }));
vi.mock("@/lib/osReviewedTurn", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/osReviewedTurn")>(), runReviewedTurn: mocks.run }));
vi.mock("@/lib/osReviewStore", () => ({ beginReviewTurn: mocks.begin, finishReviewTurn: mocks.finish, proposeReview: mocks.propose, hasReviewAccess: mocks.access }));
vi.mock("@/lib/osCofounder", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/osCofounder")>(), buildCompanyContext: mocks.context }));

import { POST } from "@/app/api/os/cofounder/route";
import { ReviewedTurnError } from "@/lib/osReviewedTurn";
import { ConfirmedReviewRejection } from "@/lib/osReviewGuard";

const requestId = "00000000-0000-4000-8000-000000000001";
const actorId = "00000000-0000-4000-8000-000000000002";
const companyId = "00000000-0000-4000-8000-000000000003";
const otherId = "00000000-0000-4000-8000-000000000004";
const askIntent = { draftFormat: null, knowledgeAssertion: null };
const draftIntent = { draftFormat: "reply", knowledgeAssertion: null };
const validBody = { intent: askIntent, message: "What is open?", mode: "ask", requestId, expectedActorId: actorId, expectedCompanyId: companyId };
const stored = { intent: askIntent, id: requestId, company_id: companyId, actor_id: actorId, thread_id: "thread", person_message_id: "current-person", mode: "ask", status: "running", question: "What is open?", reply: null, history: [] };
function request(body: unknown = validBody, extra: RequestInit = {}) {
  return new Request("http://localhost/api/os/cofounder", { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body), ...extra });
}
function events(value: string) { return value.trim().split("\n").map((line) => JSON.parse(line)); }

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.claims.mockResolvedValue({ sub: actorId });
  const workQuery = { select: () => workQuery, eq: () => workQuery, not: () => workQuery, limit: mocks.history };
  mocks.server.mockResolvedValue({ rpc: mocks.budget, from: () => workQuery });
  mocks.company.mockResolvedValue({ id: companyId, monthly_chat_usd: 5 });
  mocks.access.mockResolvedValue(true);
  mocks.budget.mockResolvedValue({ data: 0, error: null });
  mocks.picked.mockReturnValue({ label: "synthetic", priced: false, turn: vi.fn() });
  mocks.context.mockResolvedValue("Selected company snapshot");
  mocks.begin.mockResolvedValue({ created: true, turn: stored });
  mocks.finish.mockImplementation(async (_db, _who, id, reply, status) => ({ ...stored, id, reply, status }));
  mocks.history.mockResolvedValue({ data: [], error: null });
  mocks.admin.mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: mocks.history }) }) }) }) });
  mocks.run.mockImplementation(async function* () {
    yield { type: "text", text: "Two open items." };
    yield { type: "done", text: "Two open items.", inputTokens: 10, outputTokens: 4, costUsd: 0 };
  });
});

describe("context and access checks before conversation side effects", () => {
  it.each([undefined, null, {}, { draftFormat: "email", knowledgeAssertion: null }, { draftFormat: null, knowledgeAssertion: "Remember this" }])("refuses missing or incompatible trusted intent %j before reads", async (intent) => {
    expect((await POST(request({ ...validBody, intent }))).status).toBe(400);
    expect(mocks.server).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("fails on unavailable context without creating a conversation or calling the model", async () => {
    mocks.context.mockRejectedValue(new Error("PRIVATE DATABASE ERROR"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "context_unavailable" });
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("retains deliberately unconfigured production without context reads", async () => {
    mocks.picked.mockReturnValue(null);
    expect((await POST(request())).status).toBe(503);
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("fails closed when the database is unconfigured", async () => {
    mocks.configured.mockReturnValue(false);
    expect((await POST(request())).status).toBe(503);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it("requires a signed-in person", async () => {
    mocks.claims.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.server).not.toHaveBeenCalled();
  });
  it("requires an accessible selected company", async () => {
    mocks.company.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(409);
    expect(mocks.begin).not.toHaveBeenCalled();
  });
  it("denies a non-member before company context, transcript or model reads", async () => {
    mocks.access.mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "review_access_denied" });
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.history).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes before identity or storage reads", async () => {
    expect((await POST(request(undefined, { headers: { "content-type": "application/json", origin: "https://untrusted.invalid" } }))).status).toBe(403);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it("rejects form/text writes", async () => {
    expect((await POST(request(undefined, { headers: { "content-type": "text/plain" } }))).status).toBe(415);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it.each([{}, { message: "Hi" }, { message: "Hi", requestId }, { ...validBody, requestId: "invalid" }, { ...validBody, message: " " },
    { ...validBody, mode: undefined }, { ...validBody, mode: "send" }, { ...validBody, mode: {} },
    { ...validBody, message: "x".repeat(8001) }, { ...validBody, actorId: "forged" }, { ...validBody, companyId: "other" },
    { ...validBody, expectedActorId: undefined }, { ...validBody, expectedCompanyId: undefined },
    { ...validBody, expectedActorId: "" }, { ...validBody, expectedCompanyId: "invalid" },
    { ...validBody, expectedActorId: 123 }, { ...validBody, expectedCompanyId: null },
  ])("rejects invalid input %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.server).not.toHaveBeenCalled();
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.picked).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
  });
  it.each([{ data: null, error: null }, { data: 0, error: { message: "PRIVATE" } }])("fails closed on unreadable budget %j", async (value) => {
    mocks.budget.mockResolvedValue(value);
    expect((await POST(request())).status).toBe(500);
    expect(mocks.begin).not.toHaveBeenCalled();
  });
  it("enforces paid budgets without spending on the local seam", async () => {
    mocks.budget.mockResolvedValue({ data: 5, error: null });
    mocks.picked.mockReturnValue({ priced: true, turn: vi.fn() });
    expect((await POST(request())).status).toBe(402);
    expect(mocks.begin).not.toHaveBeenCalled();
    mocks.picked.mockReturnValue({ priced: false, turn: vi.fn() });
    await (await POST(request())).text();
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
});

describe("a stale tab cannot move a question to a changed identity", () => {
  function expectNoConversationEffects() {
    expect(mocks.access).not.toHaveBeenCalled();
    expect(mocks.budget).not.toHaveBeenCalled();
    expect(mocks.context).not.toHaveBeenCalled();
    expect(mocks.picked).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.finish).not.toHaveBeenCalled();
    expect(mocks.propose).not.toHaveBeenCalled();
  }

  it("rejects the old tab after another tab changes the authenticated person", async () => {
    mocks.claims.mockResolvedValue({ sub: otherId });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "identity_changed" });
    expect(mocks.server).not.toHaveBeenCalled();
    expectNoConversationEffects();
  });

  it("rejects the old tab after currentCompany changes without an RSC refresh", async () => {
    mocks.company.mockResolvedValue({ id: otherId, monthly_chat_usd: 5 });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "identity_changed" });
    expectNoConversationEffects();
  });

  it.each(["expectedActorId", "expectedCompanyId"] as const)("does not treat a supplied %s as authority", async (field) => {
    const response = await POST(request({ ...validBody, [field]: otherId }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "identity_changed" });
    expectNoConversationEffects();
  });

  it("rejects even an exact-nonce retry before reading a receipt under a new company", async () => {
    mocks.company.mockResolvedValue({ id: otherId, monthly_chat_usd: 5 });
    mocks.begin.mockResolvedValue({ created: false, turn: { ...stored, status: "completed" } });
    expect((await POST(request(validBody))).status).toBe(409);
    expectNoConversationEffects();
  });

  it("matching preconditions do not bypass verified sign-in or company membership", async () => {
    mocks.claims.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    mocks.claims.mockResolvedValue({ sub: actorId });
    mocks.access.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.access).toHaveBeenCalledWith(expect.anything(), companyId, actorId);
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
});

describe("durable cofounder turns and recovery", () => {
  it("uses only the distinct founder assertion as the knowledge source", async () => {
    const intent = { draftFormat: null, knowledgeAssertion: "The Maple project needs owner review." };
    const payload = { type: "knowledge", statement: intent.knowledgeAssertion, kind: "constraint", scope: { type: "project", label: "Maple" }, duration: { type: "until_changed" }, citations: [{ sourceId: "current-person:assertion", quote: intent.knowledgeAssertion }] };
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "knowledge", intent } });
    mocks.propose.mockResolvedValue({ id: "knowledge-proposal" });
    mocks.run.mockImplementation(async function* (options) {
      expect(options.intent).toEqual(intent);
      expect(await options.propose({ ...payload, statement: "Every project is pre-approved." })).toEqual({ rejected: "knowledge_assertion" });
      expect(await options.propose({ ...payload, citations: [{ sourceId: "current-person", quote: "What is open?" }] })).toEqual({ rejected: "current_message_citation" });
      expect(await options.propose(payload)).toEqual({ id: "knowledge-proposal" });
      yield { type: "done", text: "Only a suggestion, not saved.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    await (await POST(request({ ...validBody, mode: "knowledge", intent }))).text();
    expect(mocks.propose).toHaveBeenCalledTimes(1);
  });
  it("streams completion only after the final answer is confirmed persisted", async () => {
    const response = await POST(request());
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    const streamed = events(await response.text());
    expect(streamed.map((event) => event.type)).toEqual(["started", "text", "done"]);
    expect(streamed.at(-1).turn).toMatchObject({ id: requestId, reply: "Two open items.", status: "completed" });
    expect(mocks.begin).toHaveBeenCalledWith(expect.anything(), { companyId, actorId }, requestId, "What is open?", "ask", askIntent);
    expect(mocks.context.mock.invocationCallOrder[0]).toBeLessThan(mocks.begin.mock.invocationCallOrder[0]);
    expect(mocks.finish).toHaveBeenCalledWith(expect.anything(), expect.anything(), requestId, "Two open items.", "completed", expect.objectContaining({ inputTokens: 10, outputTokens: 4, costUsd: 0 }));
  });
  it("binds proposals to server-derived identity and the durable turn", async () => {
    const payload = { type: "work", title: "Synthetic", body: "A reviewable note", lane: "sales", kind: "reply", outwardAction: "send",
      citations: [{ sourceId: "current-person", quote: "What is open?" }] };
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "draft", intent: draftIntent } });
    mocks.propose.mockResolvedValue({ id: "proposal" });
    mocks.run.mockImplementation(async function* (options) {
      await options.propose(payload);
      yield { type: "done", text: "Ready for review.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    await (await POST(request({ ...validBody, mode: "draft", intent: draftIntent }))).text();
    expect(mocks.propose).toHaveBeenCalledWith(expect.anything(), { companyId, actorId }, requestId, payload);
    expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({
      mode: "draft",
      source: { id: "current-person", text: "What is open?" },
      system: expect.not.stringContaining("current-person"),
      signal: expect.any(AbortSignal),
    }));
  });
  it("uses the persisted question for source attribution and the current model message", async () => {
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, question: "The persisted founder request." } });
    await (await POST(request())).text();
    expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({
      source: { id: "current-person", text: "The persisted founder request." },
      history: expect.arrayContaining([{ role: "person", body: "The persisted founder request." }]),
    }));
  });
  it.each([
    { citations: [{ sourceId: "another-message", quote: "What is open?" }] },
    { citations: [{ sourceId: "current-person", quote: "Words not in this question" }] },
  ])("refuses an unavailable current-message citation before proposal RPC", async ({ citations }) => {
    const payload = { type: "work", title: "Synthetic", body: "A reviewable note", lane: "sales", kind: "reply", outwardAction: "send", citations };
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "draft", intent: draftIntent } });
    mocks.run.mockImplementation(async function* (options) {
      expect(await options.propose(payload)).toEqual({ rejected: "current_message_citation" });
      yield { type: "done", text: "No suggestion staged.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    await (await POST(request({ ...validBody, mode: "draft", intent: draftIntent }))).text();
    expect(mocks.propose).not.toHaveBeenCalled();
    expect(mocks.finish).toHaveBeenCalledWith(expect.anything(), expect.anything(), requestId, "No suggestion staged.", "completed", expect.anything());
  });
  it("uses the signed-in company-filtered Work read to refuse a duplicate before the proposal RPC", async () => {
    const payload = { type: "work", title: "Existing reply", body: "  The exact existing draft.\n", lane: "sales", kind: "reply", outwardAction: "send",
      citations: [{ sourceId: "current-person", quote: "What is open?" }] };
    const workQuery = { select: vi.fn(), eq: vi.fn(), not: vi.fn(), limit: mocks.history };
    workQuery.select.mockReturnValue(workQuery);
    workQuery.eq.mockReturnValue(workQuery);
    workQuery.not.mockReturnValue(workQuery);
    const signedInFrom = vi.fn(() => workQuery);
    const adminFrom = vi.fn(() => { throw new Error("No administrator read allowed"); });
    mocks.server.mockResolvedValue({ rpc: mocks.budget, from: signedInFrom });
    mocks.admin.mockReturnValue({ from: adminFrom });
    mocks.history.mockResolvedValue({ data: [{ id: "existing-work" }], error: null });
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "draft", intent: draftIntent } });
    let result: unknown;
    mocks.run.mockImplementation(async function* (options) {
      result = await options.propose(payload);
      yield { type: "done", text: "The existing draft remains unchanged. No duplicate was staged.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    const streamed = events(await (await POST(request({ ...validBody, mode: "draft", intent: draftIntent }))).text());
    expect(result).toEqual({ rejected: "duplicate_work" });
    expect(signedInFrom).toHaveBeenCalledExactlyOnceWith("os_work_items");
    expect(workQuery.select).toHaveBeenCalledExactlyOnceWith("id");
    expect(workQuery.eq.mock.calls).toEqual([["company_id", companyId], ["notes", payload.body]]);
    expect(workQuery.not).toHaveBeenCalledExactlyOnceWith("status", "in", "(completed,canceled)");
    expect(mocks.history).toHaveBeenCalledExactlyOnceWith(1);
    expect(adminFrom).not.toHaveBeenCalled();
    expect(mocks.propose).not.toHaveBeenCalled();
    expect(streamed.at(-1)).toMatchObject({ type: "done", turn: { status: "completed" } });
  });
  it.each(["duplicate_work", "work_action"] as const)("preserves a confirmed SQL %s refusal as a known rejection", async (reason) => {
    const payload = { type: "work", title: "Synthetic reply", body: "A complete reply for review.", lane: "sales", kind: "reply", outwardAction: "send",
      citations: [{ sourceId: "current-person", quote: "What is open?" }] };
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "draft", intent: draftIntent } });
    mocks.propose.mockRejectedValue(new ConfirmedReviewRejection(reason));
    let result: unknown;
    mocks.run.mockImplementation(async function* (options) {
      result = await options.propose(payload);
      yield { type: "done", text: "The proposal was refused; nothing was staged.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    const streamed = events(await (await POST(request({ ...validBody, mode: "draft", intent: draftIntent }))).text());
    expect(result).toEqual({ rejected: reason });
    expect(mocks.history).toHaveBeenCalledTimes(1);
    expect(mocks.propose).toHaveBeenCalledExactlyOnceWith(expect.anything(), { companyId, actorId }, requestId, payload);
    expect(streamed.at(-1)).toMatchObject({ type: "done", turn: { status: "completed" } });
    expect(JSON.stringify(streamed)).not.toContain("could not be confirmed");
  });
  it.each([
    new Error("PRIVATE_SQL_TRANSPORT_DETAIL"),
    { name: "ConfirmedReviewRejection", reason: "duplicate_work", message: "PRIVATE_SQL_TRANSPORT_DETAIL" },
  ])("leaves an unknown proposal failure unmodified for uncertainty handling", async (failure) => {
    const payload = { type: "work", title: "Synthetic reply", body: "A complete reply for review.", lane: "sales", kind: "reply", outwardAction: "send",
      citations: [{ sourceId: "current-person", quote: "What is open?" }] };
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "draft", intent: draftIntent } });
    mocks.propose.mockRejectedValue(failure);
    let caught: unknown;
    mocks.run.mockImplementation(async function* (options) {
      try { await options.propose(payload); }
      catch (error) { caught = error; throw error; }
      yield { type: "done", text: "Unexpected successful proposal.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    const streamed = events(await (await POST(request({ ...validBody, mode: "draft", intent: draftIntent }))).text());
    expect(caught).toBe(failure);
    expect(mocks.propose).toHaveBeenCalledTimes(1);
    expect(streamed.some((event) => event.type === "done")).toBe(false);
    expect(streamed.at(-1)).toMatchObject({ type: "error", message: expect.stringContaining("could not be confirmed") });
    expect(mocks.finish).toHaveBeenCalledWith(expect.anything(), { companyId, actorId }, requestId, expect.any(String), "failed", undefined);
    expect(JSON.stringify(streamed)).not.toContain("PRIVATE_SQL_TRANSPORT_DETAIL");
  });
  it("does not attempt the proposal RPC when the duplicate preflight read is unavailable", async () => {
    mocks.history.mockResolvedValue({ data: null, error: { message: "PRIVATE_RLS_READ_DETAIL" } });
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "draft", intent: draftIntent } });
    mocks.run.mockImplementation(async function* (options) {
      await options.propose({ type: "work", title: "Synthetic reply", body: "A complete reply for review.", lane: "sales", kind: "reply", outwardAction: "send",
        citations: [{ sourceId: "current-person", quote: "What is open?" }] });
      yield { type: "done", text: "Unexpected successful proposal.", inputTokens: 1, outputTokens: 1, costUsd: 0 };
    });
    const streamed = events(await (await POST(request({ ...validBody, mode: "draft", intent: draftIntent }))).text());
    expect(mocks.propose).not.toHaveBeenCalled();
    expect(streamed.some((event) => event.type === "done")).toBe(false);
    expect(streamed.at(-1)).toMatchObject({ type: "error", message: expect.stringContaining("could not be confirmed") });
    expect(JSON.stringify(streamed)).not.toContain("PRIVATE_RLS_READ_DETAIL");
  });
  it("uses the stored selection as the model capability ceiling", async () => {
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, mode: "knowledge" } });
    await (await POST(request({ ...validBody, mode: "knowledge" }))).text();
    expect(mocks.begin).toHaveBeenCalledWith(expect.anything(), { companyId, actorId }, requestId, "What is open?", "knowledge", askIntent);
    expect(mocks.run).toHaveBeenCalledWith(expect.objectContaining({ mode: "knowledge", system: expect.stringContaining("selected SUGGEST COMPANY KNOWLEDGE") }));
  });
  it("uses the atomically captured history, not messages arriving after this turn began", async () => {
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, history: [
      { role: "person", body: "Previous question" }, { role: "cofounder", body: "Previous reply" },
    ] } });
    mocks.history.mockResolvedValue({ data: [{ id: "future", role: "person", body: "FUTURE QUESTION" }], error: null });
    await (await POST(request())).text();
    expect(mocks.run.mock.calls[0][0].history).toEqual([
      { role: "person", body: "Previous question" }, { role: "cofounder", body: "Previous reply" }, { role: "person", body: "What is open?" },
    ]);
    expect(mocks.history).not.toHaveBeenCalled();
  });
  it.each(["running", "completed", "failed"])("replays the existing %s receipt without another generation", async (status) => {
    mocks.begin.mockResolvedValue({ created: false, turn: { ...stored, status } });
    const response = await POST(request());
    expect(await response.json()).toEqual({ type: "existing", turn: { ...stored, status } });
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.finish).not.toHaveBeenCalled();
    expect(mocks.history).not.toHaveBeenCalled();
  });
  it("does not regenerate after an uncertain begin", async () => {
    mocks.begin.mockRejectedValue(new Error("PRIVATE SQL DETAIL"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "turn_unconfirmed" });
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.begin).toHaveBeenCalledTimes(1);
  });
  it("records failed history reads without starting generation", async () => {
    mocks.begin.mockResolvedValue({ created: true, turn: { ...stored, history: null } });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.finish).toHaveBeenCalledWith(expect.anything(), expect.anything(), requestId, expect.stringContaining("No answer was generated"), "failed");
  });
  it("never emits done if the completed-reply save is unconfirmed", async () => {
    mocks.finish.mockRejectedValue(new Error("SECRET DATABASE DETAIL"));
    const streamed = events(await (await POST(request())).text());
    expect(streamed.some((event) => event.type === "done")).toBe(false);
    expect(streamed.at(-1)).toMatchObject({ type: "error", message: expect.stringContaining("could not be confirmed") });
    expect(JSON.stringify(streamed)).not.toContain("SECRET DATABASE DETAIL");
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
  it("retains the trusted partial receipt and usage after provider failure", async () => {
    const error = new ReviewedTurnError("provider_failed", "Partial reply.\n\nReady for review; not saved to Work/company knowledge, approved or sent.", 12, 3, 0);
    mocks.run.mockImplementation(async function* () { yield { type: "text", text: "Partial reply." }; throw error; });
    const streamed = events(await (await POST(request())).text());
    expect(streamed.some((event) => event.type === "done")).toBe(false);
    const save = mocks.finish.mock.calls[0];
    expect(save[3]).toContain("Partial reply.");
    expect(save[3]).toContain("Ready for review; not saved");
    expect(save[4]).toBe("failed");
    expect(save[5]).toBe(error);
  });
  it("marks an incomplete loop failed instead of claiming completion", async () => {
    mocks.run.mockImplementation(async function* () { yield { type: "text", text: "Unfinished" }; });
    const streamed = events(await (await POST(request())).text());
    expect(streamed.at(-1).type).toBe("error");
    expect(mocks.finish.mock.calls[0][4]).toBe("failed");
  });
  it("forwards request abort and records a failed turn without regeneration", async () => {
    const controller = new AbortController(); controller.abort();
    mocks.run.mockImplementation(async function* (options) {
      expect(options.signal.aborted).toBe(true);
      throw new ReviewedTurnError("aborted", "The reply was interrupted.", 0, 0, 0);
      yield { type: "text", text: "unreachable" };
    });
    const streamed = events(await (await POST(request(undefined, { signal: controller.signal }))).text());
    expect(streamed.some((event) => event.type === "done")).toBe(false);
    expect(mocks.run).toHaveBeenCalledTimes(1);
    expect(mocks.finish.mock.calls[0][4]).toBe("failed");
  });
});
