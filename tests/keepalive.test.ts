import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ admin: vi.fn(), configured: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: mocks.configured }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));

import { GET } from "@/app/api/keepalive/route";

/* The heartbeat that keeps the free database awake. It must be cheap, silent,
 * and closed to anyone who is not the scheduler. */

const cron = { "user-agent": "vercel-cron/1.0" };
function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/keepalive", { headers });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "");
  mocks.configured.mockReturnValue(true);
  mocks.select.mockResolvedValue({ error: null, count: 0 });
  mocks.admin.mockReturnValue({ from: () => ({ select: mocks.select }) });
});
afterEach(() => vi.unstubAllEnvs());

describe("the daily heartbeat", () => {
  it("makes one cheap read for Vercel's cron and returns nothing", async () => {
    const response = await GET(request(cron));
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.select).toHaveBeenCalledExactlyOnceWith("id", { count: "exact", head: true });
  });

  it("refuses anyone who is not the cron caller while no secret is set", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request({ "user-agent": "curl/8.0" }))).status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("honours CRON_SECRET once it exists, and then the user agent alone is not enough", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await GET(request(cron))).status).toBe(401);
    expect((await GET(request({ authorization: "Bearer s3cret" }))).status).toBe(204);
  });

  it("says so when the database is not configured or does not answer", async () => {
    mocks.configured.mockReturnValue(false);
    expect((await GET(request(cron))).status).toBe(503);
    mocks.configured.mockReturnValue(true);
    mocks.select.mockResolvedValue({ error: { message: "down" }, count: null });
    expect((await GET(request(cron))).status).toBe(503);
    mocks.admin.mockImplementation(() => { throw new Error("SUPABASE_SECRET_KEY is not configured"); });
    expect((await GET(request(cron))).status).toBe(503);
  });
});
