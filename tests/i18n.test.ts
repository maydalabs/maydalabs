import { describe, expect, it } from "vitest";
import { getLocalizedUrls, isLocale, localizePath, stripLocaleFromPath } from "@/lib/i18n";

describe("isLocale", () => {
  it("accepts supported locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("stripLocaleFromPath", () => {
  it("removes a leading locale segment", () => {
    expect(stripLocaleFromPath("/tr/start")).toBe("/start");
    expect(stripLocaleFromPath("/fr")).toBe("/");
    expect(stripLocaleFromPath("/start")).toBe("/start");
    expect(stripLocaleFromPath("/trapped")).toBe("/trapped");
  });
});

describe("localizePath", () => {
  it("keeps the default locale unprefixed and prefixes others", () => {
    expect(localizePath("/start", "en")).toBe("/start");
    expect(localizePath("/start", "tr")).toBe("/tr/start");
    expect(localizePath("/", "fr")).toBe("/fr");
  });

  it("preserves query strings and hashes", () => {
    expect(localizePath("/contact#brief", "tr")).toBe("/tr/contact#brief");
    expect(localizePath("/auth/sign-in?error=confirm", "fr")).toBe("/fr/auth/sign-in?error=confirm");
  });

  it("passes through absolute and protocol links", () => {
    expect(localizePath("https://example.com/a", "tr")).toBe("https://example.com/a");
    expect(localizePath("mailto:info@maydalabs.com", "fr")).toBe("mailto:info@maydalabs.com");
  });
});

describe("getLocalizedUrls", () => {
  it("produces every alternate including x-default", () => {
    expect(getLocalizedUrls("/approach")).toEqual({
      en: "/approach",
      tr: "/tr/approach",
      fr: "/fr/approach",
      "x-default": "/approach",
    });
  });
});
