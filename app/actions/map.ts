"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rateLimit";
import { computeMapResult, parseMapAnswers, RUBRIC_VERSION } from "@/lib/multiplierMap";
import { isLocale, type Locale } from "@/lib/i18n";

export type SaveMapState = {
  status: "idle" | "saved" | "error";
  code?:
    | "not_signed_in"
    | "invalid_answers"
    | "rate_limited"
    | "save_failed"
    | "invalid_email"
    | "invalid_code"
    | "verify_failed";
};

function readAnswersFromForm(formData: FormData) {
  return parseMapAnswers({
    stage: formData.get("stage"),
    constraint: formData.get("constraint"),
    outcome: formData.get("outcome"),
    timeline: formData.get("timeline"),
    resources: formData.get("resources"),
  });
}

/**
 * Saves a completed Multiplier Map to the signed-in visitor's portal.
 * The result is recomputed server-side from the answers — the client's
 * rendering is never trusted or stored.
 */
export async function saveMapAction(
  _prev: SaveMapState,
  formData: FormData,
): Promise<SaveMapState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "save_failed" };
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_signed_in" };

  const answers = readAnswersFromForm(formData);
  if (!answers) return { status: "error", code: "invalid_answers" };

  const headerStore = await headers();
  const clientKey = clientKeyFromHeaders(headerStore);
  if (!checkRateLimit(`map-save:${clientKey}`, { limit: 20, windowMs: 60 * 60_000 })) {
    return { status: "error", code: "rate_limited" };
  }

  const localeValue = formData.get("locale");
  const locale: Locale =
    typeof localeValue === "string" && isLocale(localeValue) ? localeValue : "en";

  const result = computeMapResult(answers);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("multiplier_maps").insert({
    user_id: claims.sub,
    answers,
    result,
    rubric_version: RUBRIC_VERSION,
    locale,
  });

  if (error) return { status: "error", code: "save_failed" };
  return { status: "saved" };
}

/**
 * One round trip for the anonymous flow: verify the emailed six-digit code,
 * establish the session, then save the map for the now-signed-in user.
 */
export async function verifyOtpAndSaveMapAction(
  prev: SaveMapState,
  formData: FormData,
): Promise<SaveMapState> {
  if (!isSupabaseConfigured()) return { status: "error", code: "verify_failed" };
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  if (!email) return { status: "error", code: "invalid_email" };
  if (!/^\d{6}$/.test(token)) return { status: "error", code: "invalid_code" };

  const headerStore = await headers();
  const clientKey = clientKeyFromHeaders(headerStore);
  if (!checkRateLimit(`otp-verify:${clientKey}`, { limit: 12, windowMs: 15 * 60_000 })) {
    return { status: "error", code: "rate_limited" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) return { status: "error", code: "verify_failed" };

  const { claimAnonymousMaps } = await import("@/lib/mapClaimServer");
  await claimAnonymousMaps(data.user.id);

  return saveMapAction(prev, formData);
}
