import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  isLocale,
  stripLocaleFromPath,
} from "@/lib/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;
const PUBLIC_FILE = /\.[^/]+$/;

function rememberLocale(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLocalHost =
    request.nextUrl.hostname === "localhost" ||
    request.nextUrl.hostname === "127.0.0.1";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/og") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/icon.svg" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && isLocale(firstSegment)) {
    if (firstSegment === DEFAULT_LOCALE) {
      // Local HTTP rewrites can re-enter the proxy at `/en/*`. Keep that
      // internal destination routable while retaining clean default-locale
      // URLs on the deployed site.
      if (isLocalHost) {
        if (request.cookies.get(LOCALE_COOKIE)?.value !== DEFAULT_LOCALE) {
          return rememberLocale(NextResponse.next(), DEFAULT_LOCALE);
        }

        return NextResponse.next();
      }

      const url = request.nextUrl.clone();
      url.pathname = stripLocaleFromPath(pathname);
      const response = NextResponse.redirect(url, 307);
      response.headers.set("Cache-Control", "private, no-store");
      return rememberLocale(response, DEFAULT_LOCALE);
    }

    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      return rememberLocale(NextResponse.next(), firstSegment);
    }

    return NextResponse.next();
  }

  // Unprefixed URLs are the canonical English experience. Keep first visits
  // redirect-free; visitors can choose a localized route explicitly.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
