import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  claims: vi.fn(), client: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), single: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  getVerifiedClaims: mocks.claims, createSupabaseServerClient: mocks.client,
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
import { getOsBetaAccess } from "@/lib/osBetaAccess";
import { requireOsSession } from "@/lib/osSession";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.claims.mockResolvedValue({ sub: "verified-user", email: "person@example.com" });
  mocks.client.mockResolvedValue({ from: mocks.from });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.single });
  mocks.single.mockResolvedValue({ data: null, error: null });
});

describe("private beta authority", () => {
  it("does not touch beta data for a signed-out visitor", async () => {
    mocks.claims.mockResolvedValue(null);
    expect(await getOsBetaAccess()).toEqual({ allowed: false, code: "not_signed_in" });
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("denies an ordinary signed-in account", async () => {
    expect(await getOsBetaAccess()).toEqual({ allowed: false, code: "invite_only" });
    expect(mocks.from).toHaveBeenCalledWith("os_beta_status");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "verified-user");
  });
  it("fails closed when the migration is missing or the query fails", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { code: "42P01" } });
    expect((await getOsBetaAccess()).allowed).toBe(false);
  });
  it("admits a database-confirmed member or operator", async () => {
    mocks.single.mockResolvedValue({ data: { user_id: "verified-user" }, error: null });
    expect((await getOsBetaAccess()).allowed).toBe(true);
  });
  it("ignores a self-asserted metadata role or legacy email list", async () => {
    mocks.claims.mockResolvedValue({ sub: "verified-user", user_metadata: { role: "operator", os_beta: true } });
    expect((await getOsBetaAccess()).allowed).toBe(false);
  });
  it("rejects a page before querying credits or rendering the workspace", async () => {
    await expect(requireOsSession()).rejects.toThrow("NOT_FOUND");
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(["os_beta_status"]);
  });
  it("scopes the admitted member's credits even when they are an operator", async () => {
    mocks.single
      .mockResolvedValueOnce({ data: { user_id: "verified-user" }, error: null })
      .mockResolvedValueOnce({ data: { granted: 10, used: 3 }, error: null });
    expect((await requireOsSession()).credits.left).toBe(7);
    expect(mocks.eq).toHaveBeenNthCalledWith(2, "user_id", "verified-user");
  });
});
