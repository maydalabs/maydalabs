import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ claims: vi.fn(), server: vi.fn(), admin: vi.fn(), company: vi.fn(), access: vi.fn(), interrupt: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: mocks.claims, createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osCompany", () => ({ currentCompany: mocks.company }));
vi.mock("@/lib/osReviewStore", () => ({ hasReviewAccess: mocks.access, interruptReviewTurn: mocks.interrupt }));

import { POST } from "@/app/api/os/review/interrupt/route";

const turnId = "00000000-0000-4000-8000-000000000004";
const serverDb = { name: "signed-in client" };
const adminDb = { name: "server-only writer" };
const receipt = { id: turnId, company_id: "selected-company", actor_id: "founder", status: "failed", reply: "The answer was interrupted." };
function request(body: unknown = { turnId }, extra: RequestInit = {}) {
  return new Request("http://localhost/api/os/review/interrupt", {
    method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body), ...extra,
  });
}
function noWriter() {
  expect(mocks.admin).not.toHaveBeenCalled();
  expect(mocks.interrupt).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.claims.mockResolvedValue({ sub: "founder" });
  mocks.server.mockResolvedValue(serverDb);
  mocks.admin.mockReturnValue(adminDb);
  mocks.company.mockResolvedValue({ id: "selected-company" });
  mocks.access.mockResolvedValue(true);
  mocks.interrupt.mockResolvedValue(receipt);
});

describe("explicit interrupted-turn recovery", () => {
  it("returns the stored failed receipt with a non-cacheable response", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ turn: receipt });
    expect(mocks.access).toHaveBeenCalledWith(serverDb, "selected-company", "founder");
    expect(mocks.interrupt).toHaveBeenCalledExactlyOnceWith(adminDb, { actorId: "founder", companyId: "selected-company" }, turnId);
    expect(mocks.access.mock.invocationCallOrder[0]).toBeLessThan(mocks.admin.mock.invocationCallOrder[0]);
  });

  it("uses the currently authenticated person and selected company, not cached fixture identity", async () => {
    mocks.claims.mockResolvedValue({ sub: "second-person" });
    mocks.company.mockResolvedValue({ id: "second-company" });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.access).toHaveBeenCalledWith(serverDb, "second-company", "second-person");
    expect(mocks.interrupt).toHaveBeenCalledWith(adminDb, { actorId: "second-person", companyId: "second-company" }, turnId);
  });

  it("does not replace an already completed receipt with a made-up failure", async () => {
    const completed = { ...receipt, status: "completed", reply: "Confirmed answer." };
    mocks.interrupt.mockResolvedValue(completed);
    expect(await (await POST(request())).json()).toEqual({ turn: completed });
  });

  it("requires sign-in before reading membership or creating a writer", async () => {
    mocks.claims.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "not_signed_in" });
    expect(mocks.server).not.toHaveBeenCalled();
    noWriter();
  });

  it("denies a non-member before accessing the writer", async () => {
    mocks.access.mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "review_access_denied" });
    noWriter();
  });

  it("denies an inaccessible company before beta or mutation checks", async () => {
    mocks.company.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.access).not.toHaveBeenCalled();
    noWriter();
  });

  it("rejects cross-origin writes before even reading identity", async () => {
    expect((await POST(request(undefined, { headers: { "content-type": "application/json", origin: "https://untrusted.invalid" } }))).status).toBe(403);
    expect(mocks.claims).not.toHaveBeenCalled();
    noWriter();
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"])("rejects %s bodies before authentication or writing", async (type) => {
    expect((await POST(request(undefined, { headers: { "content-type": type, origin: "http://localhost" } }))).status).toBe(415);
    expect(mocks.claims).not.toHaveBeenCalled();
    noWriter();
  });

  it.each([
    null, [], {}, "message", 1, { turnId: null }, { turnId: 12 }, { turnId: "invalid" }, { turnId: "-".repeat(36) },
    { turnId, actorId: "forged" }, { turnId, companyId: "foreign" }, { turnId, status: "failed" },
    { turnId, waitMinutes: 0 }, { turnId, retry: true },
  ])("rejects invalid or overprivileged body %j before service access", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mocks.server).not.toHaveBeenCalled();
    noWriter();
  });

  it("rejects malformed JSON before service access", async () => {
    expect((await POST(request(undefined, { body: "{" }))).status).toBe(400);
    noWriter();
  });

  it("reports an uncertain RPC outcome without exposing details or retrying", async () => {
    mocks.interrupt.mockRejectedValue(new Error("PRIVATE RPC DETAIL"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toEqual({ error: "interrupt_unconfirmed", message: "An answer must have been waiting at least three minutes. Check stored progress before trying again." });
    expect(JSON.stringify(body)).not.toContain("PRIVATE RPC DETAIL");
    expect(mocks.interrupt).toHaveBeenCalledTimes(1);
  });

  it.each(["server", "company", "access"] as const)("fails closed when %s lookup throws before service creation", async (stage) => {
    mocks[stage].mockRejectedValue(new Error("PRIVATE LOOKUP DETAIL"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "interrupt_unconfirmed" });
    noWriter();
  });
});
