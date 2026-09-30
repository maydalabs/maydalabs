import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ admin: vi.fn(), configured: vi.fn(), run: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: mocks.configured }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osWorker", () => ({ runDueWorkflows: mocks.run }));

import { GET, POST } from "@/app/api/os/tick/route";

/* The clock that makes MaydaOS work while you are gone. Closed to anyone but
 * the scheduler, and refused before a single claim when nothing could draft. */

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/os/tick", { headers });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "");
  vi.stubEnv("MAYDAOS_ANTHROPIC_API_KEY", "");
  vi.stubEnv("MAYDAOS_LOCAL_MODEL", "");
  vi.stubEnv("MAYDAOS_KEY_SECRET", "");
  mocks.configured.mockReturnValue(true);
  mocks.admin.mockReturnValue({ tag: "admin" });
  mocks.run.mockResolvedValue({ claimed: 1, drafted: 1, outcomes: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe("the daily tick", () => {
  it("refuses everyone while no secret is set, whatever they offer", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request({ authorization: "Bearer anything" }))).status).toBe(401);
    expect((await POST(request({ authorization: "Bearer anything" }))).status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("refuses a wrong bearer once a secret exists", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await GET(request({ authorization: "Bearer wrong" }))).status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("says not configured when nothing could draft, before claiming anything", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await GET(request({ authorization: "Bearer s3cret" }))).status).toBe(503);
    mocks.configured.mockReturnValue(false);
    vi.stubEnv("MAYDAOS_KEY_SECRET", "x".repeat(32));
    expect((await GET(request({ authorization: "Bearer s3cret" }))).status).toBe(503);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("runs on the vault secret alone, because the companies' keys are what it spends", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("MAYDAOS_KEY_SECRET", "x".repeat(32));
    const response = await GET(request({ authorization: "Bearer s3cret" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ claimed: 1, drafted: 1, outcomes: [] });
    expect(mocks.run).toHaveBeenCalledExactlyOnceWith({ tag: "admin" });
  });
});
