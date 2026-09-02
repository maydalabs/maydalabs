import { describe, expect, it } from "vitest";
import {
  cleanUtm,
  isValidEmail,
  looksAutomated,
  MIN_FILL_TIME_MS,
  validateIntake,
} from "@/lib/intakeValidation";

const VALID = {
  name: "Ada Lovelace",
  email: "Ada@Example.com",
  company: "Analytical Engines",
  companyStage: "growing",
  primaryConstraint: "growth_flat",
  desiredOutcome: "revenue_growth",
  budgetRange: "10k_30k",
  timeline: "quarter",
  message: "Our funnel stalls after signup and nobody knows why.",
  consentContact: "on",
  consentUpdates: "on",
  locale: "en",
  source: "contact",
};

describe("validateIntake", () => {
  it("accepts and normalizes a valid submission", () => {
    const result = validateIntake({ ...VALID });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.email).toBe("ada@example.com");
    expect(result.value.consentContact).toBe(true);
    expect(result.value.consentUpdates).toBe(true);
    expect(result.value.companyStage).toBe("growing");
  });

  it("requires a name and a valid email", () => {
    expect(validateIntake({ ...VALID, name: "" })).toMatchObject({ ok: false, field: "name" });
    expect(validateIntake({ ...VALID, name: "A" })).toMatchObject({ ok: false, field: "name" });
    expect(validateIntake({ ...VALID, email: "not-an-email" })).toMatchObject({
      ok: false,
      field: "email",
      code: "invalid",
    });
    expect(validateIntake({ ...VALID, email: "" })).toMatchObject({ ok: false, field: "email" });
  });

  it("rejects a too-short message but allows omitting it", () => {
    expect(validateIntake({ ...VALID, message: "too short" })).toMatchObject({
      ok: false,
      field: "message",
    });
    expect(validateIntake({ ...VALID, message: "" }).ok).toBe(true);
  });

  it("drops unknown enum values instead of storing them", () => {
    const result = validateIntake({ ...VALID, companyStage: "unicorn", timeline: "yesterday" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.companyStage).toBeNull();
    expect(result.value.timeline).toBeNull();
  });

  it("falls back to English for unknown locales and truncates oversized fields", () => {
    const result = validateIntake({ ...VALID, locale: "de", company: "x".repeat(500) });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.locale).toBe("en");
    expect(result.value.company).toHaveLength(200);
  });
});

describe("looksAutomated", () => {
  it("flags filled honeypots, missing timers, and instant submissions", () => {
    expect(looksAutomated("i am a bot", String(MIN_FILL_TIME_MS + 1))).toBe(true);
    expect(looksAutomated("", undefined)).toBe(true);
    expect(looksAutomated("", "not-a-number")).toBe(true);
    expect(looksAutomated("", "120")).toBe(true);
  });

  it("passes a human-speed submission with an empty honeypot", () => {
    expect(looksAutomated("", String(MIN_FILL_TIME_MS + 500))).toBe(false);
  });
});

describe("cleanUtm", () => {
  it("keeps only known utm keys and truncates values", () => {
    expect(
      cleanUtm({
        utm_source: "linkedin",
        utm_campaign: "x".repeat(300),
        evil_key: "drop-me",
        utm_medium: 42,
      }),
    ).toEqual({ utm_source: "linkedin", utm_campaign: "x".repeat(160) });
  });

  it("returns null for empty or invalid input", () => {
    expect(cleanUtm(null)).toBeNull();
    expect(cleanUtm({})).toBeNull();
    expect(cleanUtm("utm_source=x")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts normal addresses and rejects malformed ones", () => {
    expect(isValidEmail("founder@company.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail(`${"x".repeat(320)}@example.com`)).toBe(false);
  });
});
