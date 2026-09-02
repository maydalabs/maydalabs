import { NextRequest, NextResponse } from "next/server";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import {
  DEFAULT_LOCALE,
  isLocale,
  stripLocaleFromPath,
} from "@/lib/i18n";

const PUBLIC_FILE = /\.[^/]+$/;

function resolveRouteResponse(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isLocalHost =
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1";

  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && isLocale(firstSegment)) {
    if (firstSegment === DEFAULT_LOCALE) {
      // Local HTTP rewrites can re-enter the proxy at `/en/*`. Keep that
      // internal destination routable while retaining clean default-locale
      // URLs on the deployed site.
      if (isLocalHost) {
        return NextResponse.next({ request });
      }

      const url = request.nextUrl.clone();
      url.pathname = stripLocaleFromPath(pathname);
      const response = NextResponse.redirect(url, 307);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    return NextResponse.next({ request });
  }

  // Unprefixed URLs are the canonical English experience. Keep first visits
  // redirect-free; visitors can choose a localized route explicitly.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url, { request });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/og") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const response = resolveRouteResponse(request);

  // Session refresh only — never the authorization boundary. Pages, server
  // actions, and route handlers verify identity themselves via getClaims().
  // Skipped entirely for visitors with no Supabase auth cookie.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (hasAuthCookie && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(request.headers.get("cookie") ?? "").map(
              ({ name, value }) => ({ name, value: value ?? "" }),
            );
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    await supabase.auth.getClaims();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
