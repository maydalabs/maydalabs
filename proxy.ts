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

function requestedLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && isLocale(saved)) return saved;

  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (country === "TR") return "tr";
  if (country === "FR" || country === "MC") return "fr";

  const languages = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((entry) => entry.trim().split(";")[0]?.split("-")[0]?.toLowerCase());
  if (languages.includes("tr")) return "tr";
  if (languages.includes("fr")) return "fr";

  return DEFAULT_LOCALE;
}

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

  const locale = requestedLocale(request);
  if (locale !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return rememberLocale(NextResponse.redirect(url, 307), locale);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
