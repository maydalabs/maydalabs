"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isValidEmail } from "@/lib/intakeValidation";
import { claimAnonymousRecords } from "@/lib/mapClaimServer";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rateLimit";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";

export type AuthFormState = {
  status: "idle" | "code_sent" | "signed_in" | "error";
  code?: "invalid_email" | "rate_limited" | "send_failed" | "invalid_code" | "verify_failed";
  email?: string;
};

function readLocale(formData: FormData): Locale {
  const value = formData.get("locale");
  return typeof value === "string" && isLocale(value) ? value : "en";
}

function readNextPath(formData: FormData): string | null {
  const value = formData.get("next");
  if (typeof value !== "string") return null;
  // Only same-site relative paths, never protocol-relative ones.
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function requestOtpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "send_failed" };
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!isValidEmail(email)) return { status: "error", code: "invalid_email" };

  const headerStore = await headers();
  const clientKey = clientKeyFromHeaders(headerStore);
  if (
    !checkRateLimit(`otp:ip:${clientKey}`, { limit: 8, windowMs: 15 * 60_000 }) ||
    !checkRateLimit(`otp:email:${email}`, { limit: 4, windowMs: 15 * 60_000 })
  ) {
    return { status: "error", code: "rate_limited", email };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return { status: "error", code: "send_failed", email };

  return { status: "code_sent", email };
}

export async function verifyOtpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "verify_failed" };
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  if (!isValidEmail(email)) return { status: "error", code: "invalid_email" };
  if (!/^\d{6,10}$/.test(token)) return { status: "error", code: "invalid_code", email };

  const headerStore = await headers();
  const clientKey = clientKeyFromHeaders(headerStore);
  if (!checkRateLimit(`otp-verify:${clientKey}`, { limit: 12, windowMs: 15 * 60_000 })) {
    return { status: "error", code: "rate_limited", email };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) return { status: "error", code: "verify_failed", email };

  await claimAnonymousRecords(data.user.id, data.user.email ?? email);

  const nextPath = readNextPath(formData);
  if (nextPath) redirect(localizePath(nextPath, readLocale(formData)));
  return { status: "signed_in", email };
}

export async function signOutAction(formData: FormData) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect(localizePath("/", readLocale(formData)));
}
