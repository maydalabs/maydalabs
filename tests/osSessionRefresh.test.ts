import { NextRequest } from "next/server";
import type { CookieMethodsServer, SetAllCookies } from "@supabase/ssr";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
  refresh: vi.fn<(cookies: CookieMethodsServer) => Promise<void>>(),
}));

vi.mock("@supabase/ssr", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@supabase/ssr")>()),
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/supabase/config", () => ({
  getSupabaseUrl: () => "http://supabase.example.invalid",
  getSupabasePublishableKey: () => "synthetic-publishable-key",
  isSupabaseConfigured: mocks.isSupabaseConfigured,
}));

import { proxy } from "@/proxy";

const COOKIE = "sb-synthetic-auth-token";
const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
};
const REFRESHED_COOKIES: Parameters<SetAllCookies>[0] = [
  {
    name: COOKIE,
    value: "synthetic-refreshed-session",
    options: { path: "/", sameSite: "lax", secure: true, maxAge: 3600 },
  },
];

function request(url = "https://maydalabs.example.invalid/os", cookie = `${COOKIE}=synthetic-expired-session; preference=tr`) {
  return new NextRequest(url, { headers: { cookie } });
}

// Real NextResponse serialization, not a mocked response: these are the
// request headers Next forwards to the same render after proxy finishes.
function forwardedCookies(response: Awaited<ReturnType<typeof proxy>>) {
  expect(response.headers.get("x-middleware-override-headers")?.split(",")).toContain("cookie");
  return new NextRequest("https://maydalabs.example.invalid/en/os", {
    headers: { cookie: response.headers.get("x-middleware-request-cookie") ?? "" },
  }).cookies;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSupabaseConfigured.mockReturnValue(true);
  mocks.refresh.mockImplementation(async (cookies) => {
    await cookies.setAll!(REFRESHED_COOKIES, CACHE_HEADERS);
  });
  mocks.createServerClient.mockImplementation((_url, _key, options: { cookies: CookieMethodsServer }) => ({
    auth: {
      getClaims: async () => {
        await mocks.refresh(options.cookies);
        return { data: { claims: { sub: "synthetic-founder" } }, error: null };
      },
    },
  }));
});

describe("proxy session refresh reaches the current server render", () => {
  it("forwards the refreshed cookie on the first rewritten /os request", async () => {
    const incoming = request();
    const response = await proxy(incoming);

    expect(response.headers.get("x-middleware-rewrite")).toBe("https://maydalabs.example.invalid/en/os");
    expect(forwardedCookies(response).get(COOKIE)?.value).toBe("synthetic-refreshed-session");
    expect(forwardedCookies(response).get("preference")?.value).toBe("tr");
    expect(incoming.cookies.get(COOKIE)?.value).toBe("synthetic-refreshed-session");
  });

  it.each(["tr", "fr"])("preserves %s pass-through routing with refreshed request cookies", async (locale) => {
    const response = await proxy(request(`https://maydalabs.example.invalid/${locale}/os`));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.has("x-middleware-rewrite")).toBe(false);
    expect(forwardedCookies(response).get(COOKIE)?.value).toBe("synthetic-refreshed-session");
  });

  it("preserves local /en pass-through without a redirect loop", async () => {
    const response = await proxy(request("http://127.0.0.1:3199/en/os"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedCookies(response).get(COOKIE)?.value).toBe("synthetic-refreshed-session");
  });

  it("keeps refreshed browser cookies and anti-cache headers on the canonical redirect", async () => {
    const response = await proxy(request("https://maydalabs.example.invalid/en/os?tab=work"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://maydalabs.example.invalid/os?tab=work");
    expect(response.cookies.get(COOKIE)).toMatchObject(REFRESHED_COOKIES[0].options);
    expect(response.cookies.get(COOKIE)?.value).toBe("synthetic-refreshed-session");
    for (const [key, value] of Object.entries(CACHE_HEADERS)) {
      expect(response.headers.get(key)).toBe(value);
    }
  });

  it("prevents refresh responses being cached without changing cookie options", async () => {
    const response = await proxy(request());
    expect(response.cookies.get(COOKIE)).toMatchObject(REFRESHED_COOKIES[0].options);
    for (const [key, value] of Object.entries(CACHE_HEADERS)) {
      expect(response.headers.get(key)).toBe(value);
    }
  });

  it("carries every refreshed chunk and removes stale chunks in the current request", async () => {
    mocks.refresh.mockImplementation(async (cookies) => {
      await cookies.setAll!([
        { name: `${COOKIE}.0`, value: "new-chunk", options: { path: "/" } },
        { name: `${COOKIE}.1`, value: "", options: { path: "/", maxAge: 0 } },
      ], CACHE_HEADERS);
      expect(await cookies.getAll()).toContainEqual({ name: `${COOKIE}.0`, value: "new-chunk" });
      expect(await cookies.getAll()).not.toContainEqual({ name: `${COOKIE}.1`, value: "stale-chunk" });
    });
    const response = await proxy(request(undefined, `${COOKIE}.0=expired-chunk; ${COOKIE}.1=stale-chunk`));
    expect(forwardedCookies(response).get(`${COOKIE}.0`)?.value).toBe("new-chunk");
    expect(forwardedCookies(response).get(`${COOKIE}.1`)?.value).toBe("");
    expect(response.cookies.get(`${COOKIE}.1`)?.maxAge).toBe(0);
  });

  it("retains earlier cookie writes when the SDK applies another batch", async () => {
    mocks.refresh.mockImplementation(async (cookies) => {
      await cookies.setAll!(REFRESHED_COOKIES, CACHE_HEADERS);
      await cookies.setAll!([{ name: "sb-synthetic-code-verifier", value: "", options: { path: "/", maxAge: 0 } }], CACHE_HEADERS);
    });
    const response = await proxy(request());
    expect(response.cookies.get(COOKIE)?.value).toBe("synthetic-refreshed-session");
    expect(response.cookies.get("sb-synthetic-code-verifier")?.maxAge).toBe(0);
    expect(forwardedCookies(response).get(COOKIE)?.value).toBe("synthetic-refreshed-session");
  });

  it("passes an invalid-session cookie removal to both render and browser", async () => {
    mocks.refresh.mockImplementation(async (cookies) => {
      await cookies.setAll!([{ name: COOKIE, value: "", options: { path: "/", maxAge: 0 } }], CACHE_HEADERS);
    });
    const response = await proxy(request());
    expect(forwardedCookies(response).get(COOKIE)?.value).toBe("");
    expect(response.cookies.get(COOKIE)?.maxAge).toBe(0);
  });

  it("does not start auth or write cookies for an anonymous visitor", async () => {
    const response = await proxy(request(undefined, "preference=tr"));
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(response.cookies.getAll()).toEqual([]);
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://maydalabs.example.invalid/en/os");
  });

  it("preserves normal routing when Supabase is not configured", async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);
    const response = await proxy(request());
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(response.cookies.getAll()).toEqual([]);
    expect(forwardedCookies(response).get(COOKIE)?.value).toBe("synthetic-expired-session");
  });

  it.each(["/api/os/cofounder", "/_next/static/app.js", "/brand/logo.svg"])("leaves excluded route %s alone", async (path) => {
    const response = await proxy(request(`https://maydalabs.example.invalid${path}`));
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.cookies.getAll()).toEqual([]);
  });
});
