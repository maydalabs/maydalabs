/*
 * Server-side validation for every intake mutation. Pure functions so the
 * rules are unit-testable without a database.
 */

import { LOCALES, type Locale } from "@/lib/i18n";

export const INTAKE_STAGES = ["idea", "launched", "growing", "established"] as const;
export const INTAKE_CONSTRAINTS = [
  "product_not_built",
  "product_stuck",
  "growth_flat",
  "operations_drag",
  "reliability_risk",
  "unclear",
] as const;
export const INTAKE_OUTCOMES = [
  "launch",
  "revenue_growth",
  "retention",
  "efficiency",
  "confidence",
] as const;
export const INTAKE_TIMELINES = ["now", "quarter", "exploring"] as const;
export const INTAKE_BUDGETS = ["undisclosed", "under_10k", "10k_30k", "30k_plus"] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Minimum milliseconds between form render and submit; faster is a bot. */
export const MIN_FILL_TIME_MS = 3_000;

export type IntakeInput = {
  name: string;
  email: string;
  company: string | null;
  companyStage: string | null;
  primaryConstraint: string | null;
  desiredOutcome: string | null;
  budgetRange: string | null;
  timeline: string | null;
  message: string | null;
  consentContact: boolean;
  consentUpdates: boolean;
  locale: Locale;
  source: string;
};

export type IntakeValidation =
  | { ok: true; value: IntakeInput }
  | { ok: false; field: string; code: "required" | "invalid" | "too_long" };

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function optionOrNull(value: unknown, options: readonly string[]): string | null {
  return typeof value === "string" && options.includes(value) ? value : null;
}

export function isValidEmail(value: string): boolean {
  return value.length <= 320 && EMAIL_PATTERN.test(value);
}

export function validateIntake(raw: Record<string, unknown>): IntakeValidation {
  const name = cleanText(raw.name, 160);
  if (!name || name.length < 2) return { ok: false, field: "name", code: "required" };

  const email = cleanText(raw.email, 320)?.toLowerCase() ?? null;
  if (!email) return { ok: false, field: "email", code: "required" };
  if (!isValidEmail(email)) return { ok: false, field: "email", code: "invalid" };

  const message = cleanText(raw.message, 4000);
  if (message !== null && message.length < 24) {
    return { ok: false, field: "message", code: "invalid" };
  }

  const locale =
    typeof raw.locale === "string" && (LOCALES as readonly string[]).includes(raw.locale)
      ? (raw.locale as Locale)
      : "en";

  return {
    ok: true,
    value: {
      name,
      email,
      company: cleanText(raw.company, 200),
      companyStage: optionOrNull(raw.companyStage, INTAKE_STAGES),
      primaryConstraint: optionOrNull(raw.primaryConstraint, INTAKE_CONSTRAINTS),
      desiredOutcome: optionOrNull(raw.desiredOutcome, INTAKE_OUTCOMES),
      budgetRange: optionOrNull(raw.budgetRange, INTAKE_BUDGETS),
      timeline: optionOrNull(raw.timeline, INTAKE_TIMELINES),
      message,
      consentContact: raw.consentContact === true || raw.consentContact === "on",
      consentUpdates: raw.consentUpdates === true || raw.consentUpdates === "on",
      locale,
      source: cleanText(raw.source, 80) ?? "website",
    },
  };
}

/**
 * Basic submission-abuse checks: a honeypot field that humans never see and
 * a minimum client-measured fill time (set by script at submit, so plain
 * form-poster bots fail it). Returns true when the submission looks
 * automated. CAPTCHA and infrastructure-level rate limiting remain
 * production gates — they require external accounts and are documented,
 * not configured.
 */
export function looksAutomated(honeypot: unknown, elapsedMsValue: unknown): boolean {
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;
  const elapsedMs = typeof elapsedMsValue === "string" ? Number(elapsedMsValue) : NaN;
  if (!Number.isFinite(elapsedMs)) return true;
  if (elapsedMs < MIN_FILL_TIME_MS) return true;
  return false;
}

/** UTM keys allowed into the stored attribution payload. */
export function cleanUtm(raw: unknown): Record<string, string> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(([key, value]) => allowed.includes(key) && typeof value === "string" && value.length > 0)
    .map(([key, value]) => [key, (value as string).slice(0, 160)] as const);
  return entries.length ? Object.fromEntries(entries) : null;
}
