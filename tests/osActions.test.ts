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

describe("workflow spend reads fail closed", () => {
  function prepare(month: { data: { cost_usd: number }[] | null; error: unknown }, day = { data: [] as { cost_usd: number }[], error: null as unknown }) {
    const workflow = {
      id: "00000000-0000-4000-8000-000000000001", name: "Review workflow",
      active: true, monthly_budget_usd: 5, standing_sources: [], max_sources: 5,
    };
    const scoped = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: workflow }) }) }) }) };
    mocks.access.mockResolvedValue({ allowed: true, claims: { sub: "reviewer" }, supabase: scoped });
    const gte = vi.fn().mockResolvedValueOnce(month).mockResolvedValueOnce(day);
    const select = () => ({ eq: () => ({ gte }), gte });
    mocks.admin.mockReturnValue({ from: () => ({ select }) });
    mocks.gather.mockResolvedValue({ sources: [], failures: [] });
    const form = new FormData();
    form.set("topic", "Budget regression test");
    form.set("workflowId", workflow.id);
    form.set("sources", "https://example.com/source");
    return { form, gte };
  }

  it.each([
    { data: null, error: { message: "database unavailable" } },
    { data: [{ cost_usd: 0 }], error: { message: "partial read" } },
    { data: null, error: null },
  ])("does not gather or spend when monthly usage cannot be verified: %j", async (month) => {
    const { form, gte } = prepare(month);
    expect(await runOsDraftAction({ status: "idle" }, form)).toEqual({ status: "error", code: "save_failed" });
    expect(gte).toHaveBeenCalledTimes(1);
    expect(mocks.gather).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it("also refuses a failed daily usage read", async () => {
    const { form } = prepare({ data: [], error: null }, { data: [], error: { message: "timeout" } });
    expect(await runOsDraftAction({ status: "idle" }, form)).toEqual({ status: "error", code: "save_failed" });
    expect(mocks.gather).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it("allows verified empty usage to reach source gathering", async () => {
    const { form } = prepare({ data: [], error: null });
    expect(await runOsDraftAction({ status: "idle" }, form)).toMatchObject({ status: "error", code: "no_sources" });
    expect(mocks.gather).toHaveBeenCalledOnce();
    expect(mocks.draft).not.toHaveBeenCalled();
  });
});
