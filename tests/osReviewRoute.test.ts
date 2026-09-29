import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ claims: vi.fn(), server: vi.fn(), admin: vi.fn(), company: vi.fn(), decide: vi.fn(), snapshot: vi.fn(), access: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: mocks.claims, createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osCompany", () => ({ currentCompany: mocks.company }));
vi.mock("@/lib/osReviewStore", () => ({ decideReview: mocks.decide, loadReviewSnapshot: mocks.snapshot, hasReviewAccess: mocks.access }));

import { GET, POST } from "@/app/api/os/review/route";
import { ConfirmedReviewRejection, REVIEW_GUARD_REASONS } from "@/lib/osReviewGuard";

const confirmation = { proposalId: "00000000-0000-4000-8000-000000000002", revision: 1, fingerprint: "f".repeat(64), action: "save_to_work" };
const work = { type: "work", title: "Reply", body: "Dear Mira, six crates on Friday.", lane: "sales", kind: "reply", outwardAction: "send", citations: [{ sourceId: "person-message", quote: "six crates" }] };
const serverDb = { name: "signed-in RLS client" };
const adminDb = { name: "server-only writer" };
function request(body: unknown = confirmation, headers = { "content-type": "application/json", origin: "http://localhost" }) {
  return new Request("http://localhost/api/os/review", { method: "POST", headers, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.claims.mockResolvedValue({ sub: "founder" });
  mocks.server.mockResolvedValue(serverDb);
  mocks.admin.mockReturnValue(adminDb);
  mocks.company.mockResolvedValue({ id: "selected-company" });
  mocks.access.mockResolvedValue(true);
  mocks.snapshot.mockResolvedValue({ companyId: "selected-company", proposals: [], turns: [], messages: [] });
  mocks.decide.mockResolvedValue({ id: confirmation.proposalId, status: "saved", record_id: "work-record" });
});

describe("durable review reads", () => {
  it("reads the selected company via the signed-in RLS client, never the admin client", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.snapshot).toHaveBeenCalledWith(serverDb, "selected-company", "founder", undefined);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("reconciles an exact pending request beyond the normal recent-turn window", async () => {
    const requestId = "00000000-0000-4000-8000-000000000003";
    expect((await GET(new Request(`http://localhost/api/os/review?requestId=${requestId}`))).status).toBe(200);
    expect(mocks.snapshot).toHaveBeenCalledWith(serverDb, "selected-company", "founder", requestId);
  });
  it("does not forward an invalid request identity to storage", async () => {
    expect((await GET(new Request("http://localhost/api/os/review?requestId=invalid"))).status).toBe(400);
    expect(mocks.snapshot).not.toHaveBeenCalled();
  });
  it("requires sign-in", async () => {
    mocks.claims.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(mocks.snapshot).not.toHaveBeenCalled();
  });
  it("requires accessible company membership", async () => {
    mocks.company.mockResolvedValue(null);
    expect((await GET()).status).toBe(403);
    expect(mocks.snapshot).not.toHaveBeenCalled();
  });
  it("denies non-members without reading their company transcript", async () => {
    mocks.access.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "review_access_denied" });
    expect(mocks.snapshot).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("never treats a failed snapshot read as an empty saved state", async () => {
    mocks.snapshot.mockRejectedValue(new Error("PRIVATE DATABASE ERROR"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "review_read_unavailable" });
  });
});

describe("explicit review actions", () => {
  it.each([undefined, false, "true", {}, 1])("requires explicit exact-revision knowledge approval, not %j", async (knowledgeApproved) => {
    const response = await POST(request({ ...confirmation, action: "add_to_company_knowledge", knowledgeApproved }));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "review_rejected", reason: "knowledge_approval" });
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.decide).not.toHaveBeenCalled();
  });
  it("does not attach knowledge approval to an unrelated action", async () => {
    expect((await POST(request({ ...confirmation, knowledgeApproved: true }))).status).toBe(422);
    expect(mocks.decide).not.toHaveBeenCalled();
  });
  it.each(["save_to_work", "add_to_company_knowledge", "dismiss"])("passes %s with server-selected identity and exact reviewed revision", async (action) => {
    const knowledgeApproval = action === "add_to_company_knowledge" ? { knowledgeApproved: true } : {};
    const response = await POST(request({ ...confirmation, action, ...knowledgeApproval }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ proposal: { id: confirmation.proposalId, status: "saved", record_id: "work-record" } });
    expect(mocks.decide).toHaveBeenCalledExactlyOnceWith(adminDb, { companyId: "selected-company", actorId: "founder" }, { ...confirmation, action, ...knowledgeApproval });
  });
  it("passes a strictly parsed edit for a new revision without adding approval fields", async () => {
    const response = await POST(request({ ...confirmation, action: "revise", payload: work }));
    expect(response.status).toBe(200);
    expect(mocks.decide).toHaveBeenCalledWith(adminDb, expect.anything(), { ...confirmation, action: "revise", payload: work });
  });
  it("requires sign-in before any writes", async () => {
    mocks.claims.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.decide).not.toHaveBeenCalled();
  });
  it("requires accessible current company", async () => {
    mocks.company.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.decide).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("denies non-members without attempting a proposal mutation", async () => {
    mocks.access.mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "review_access_denied" });
    expect(mocks.decide).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("blocks cross-origin writes", async () => {
    expect((await POST(request(confirmation, { "content-type": "application/json", origin: "https://untrusted.invalid" }))).status).toBe(403);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it("blocks form-encoded writes", async () => {
    expect((await POST(request(confirmation, { "content-type": "application/x-www-form-urlencoded", origin: "http://localhost" }))).status).toBe(415);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it.each([
    { actorId: "forged" }, { companyId: "other" }, { status: "saved" }, { revision: 0 }, { revision: 1.5 },
    { fingerprint: "short" }, { proposalId: "invalid" }, { proposalId: "-".repeat(36) }, { action: "approve" }, { action: "send" },
    { payload: work }, { action: "revise" }, { action: "revise", payload: { ...work, approved: true } },
  ])("rejects invalid or overprivileged confirmation %j", async (override) => {
    expect((await POST(request({ ...confirmation, ...override }))).status).toBe(400);
    expect(mocks.decide).not.toHaveBeenCalled();
  });
  it("does not retry an uncertain save or claim it failed to persist", async () => {
    mocks.decide.mockRejectedValue(new Error("PRIVATE DATABASE DETAIL"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "save_unconfirmed", message: "Refresh the saved record before trying again." });
    expect(mocks.decide).toHaveBeenCalledTimes(1);
  });
  it.each(REVIEW_GUARD_REASONS)("returns a finite confirmed refusal for %s without retrying", async (reason) => {
    mocks.decide.mockRejectedValue(new ConfirmedReviewRejection(reason));
    const response = await POST(request());
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "review_rejected", reason });
    expect(mocks.decide).toHaveBeenCalledTimes(1);
  });
  it("returns an existing durable receipt on an explicit same-revision retry", async () => {
    const first = await (await POST(request())).json();
    const second = await (await POST(request())).json();
    expect(second).toEqual(first);
    expect(mocks.decide).toHaveBeenCalledTimes(2);
    // SQL proves one underlying write; the route never generates a new proposal ID.
    expect(mocks.decide.mock.calls[0][2]).toEqual(mocks.decide.mock.calls[1][2]);
  });
});
