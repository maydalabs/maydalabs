import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ access: vi.fn(), admin: vi.fn(), draft: vi.fn(), gather: vi.fn() }));
vi.mock("@/lib/osBetaAccess", () => ({ getOsBetaAccess: mocks.access }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: vi.fn(), createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/osDraft", () => ({ draftFromSources: mocks.draft }));
vi.mock("@/lib/osGather", () => ({ gatherSources: mocks.gather }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { runOsDraftAction, decideOsRunAction, recordOsOutcomeAction } from "@/app/actions/os";

beforeEach(() => { vi.clearAllMocks(); });
describe("beta actions cannot be invoked by public accounts", () => {
  it.each(["not_signed_in", "invite_only"] as const)("denies %s before fetching, writing, or spending", async (code) => {
    mocks.access.mockResolvedValue({ allowed: false, code });
    const form = new FormData();
    form.set("topic", "Do not run this");
    form.set("runId", "00000000-0000-4000-8000-000000000000");
    form.set("decision", "approved");
    form.set("publishedUrl", "https://example.com");
    expect(await runOsDraftAction({ status: "idle" }, form)).toEqual({ status: "error", code });
    await decideOsRunAction(form);
    await recordOsOutcomeAction(form);
    expect(mocks.access).toHaveBeenCalledTimes(3);
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
    expect(mocks.gather).not.toHaveBeenCalled();
  });
});
