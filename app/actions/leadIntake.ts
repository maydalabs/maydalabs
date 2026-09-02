"use server";

import { cookies, headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { getSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  cleanUtm,
  looksAutomated,
  validateIntake,
} from "@/lib/intakeValidation";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rateLimit";
import { computeMapResult, parseMapAnswers, RUBRIC_VERSION } from "@/lib/multiplierMap";
import { MAP_CLAIM_COOKIE, MAP_CLAIM_COOKIE_OPTIONS } from "@/lib/mapClaim";

export type IntakeFormState = {
  status: "idle" | "submitted" | "error";
  code?: "invalid" | "rate_limited" | "consent_required" | "save_failed";
  field?: string;
};

/**
 * The single write path for lead intakes (contact brief and Multiplier Map
 * "discuss" flow). Treated as a public endpoint: honeypot + fill-time
 * checks, per-IP rate limiting, strict validation, and inserts through the
 * service credential only — the anon role has no table privileges at all.
 *
 * Nothing here contacts the lead or writes to Abidin. Intakes wait for
 * manual review; Abidin remains the canonical commercial record.
 */
export async function submitLeadIntakeAction(
  _prev: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  // Silent drop for obviously automated submissions.
  if (looksAutomated(formData.get("website"), formData.get("elapsedMs"))) {
    return { status: "submitted" };
  }

  const headerStore = await headers();
  const clientKey = clientKeyFromHeaders(headerStore);
  if (!checkRateLimit(`intake:${clientKey}`, { limit: 6, windowMs: 60 * 60_000 })) {
    return { status: "error", code: "rate_limited" };
  }

  const validation = validateIntake({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    companyStage: formData.get("companyStage"),
    primaryConstraint: formData.get("primaryConstraint"),
    desiredOutcome: formData.get("desiredOutcome"),
    budgetRange: formData.get("budgetRange"),
    timeline: formData.get("timeline"),
    message: formData.get("message"),
    consentContact: formData.get("consentContact"),
    consentUpdates: formData.get("consentUpdates"),
    locale: formData.get("locale"),
    source: formData.get("source"),
  });
  if (!validation.ok) {
    return { status: "error", code: "invalid", field: validation.field };
  }
  const intake = validation.value;

  // Storing contact details for a reply requires explicit consent.
  if (!intake.consentContact) {
    return { status: "error", code: "consent_required", field: "consentContact" };
  }

  if (!isSupabaseConfigured() || !getSupabaseSecretKey()) {
    return { status: "error", code: "save_failed" };
  }

  const claims = await getVerifiedClaims();
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // Optional attached Multiplier Map: recompute the result server-side and
  // persist the map so it can be claimed after a later sign-in.
  let multiplierMapId: string | null = null;
  let mapAnswerFields: {
    stage: string;
    constraint: string;
    outcome: string;
    timeline: string;
  } | null = null;
  const rawAnswers = formData.get("mapAnswers");
  if (typeof rawAnswers === "string" && rawAnswers) {
    let parsedJson: unknown = null;
    try {
      parsedJson = JSON.parse(rawAnswers);
    } catch {
      parsedJson = null;
    }
    const answers = parseMapAnswers(parsedJson);
    if (answers) {
      mapAnswerFields = {
        stage: answers.stage,
        constraint: answers.constraint,
        outcome: answers.outcome,
        timeline: answers.timeline,
      };
      const cookieStore = await cookies();
      let claimTokenHash: string | null = null;
      if (!userId) {
        const { createHash, randomBytes } = await import("node:crypto");
        let rawToken = cookieStore.get(MAP_CLAIM_COOKIE)?.value;
        if (!rawToken || !/^[a-f0-9]{64}$/.test(rawToken)) {
          rawToken = randomBytes(32).toString("hex");
          cookieStore.set(MAP_CLAIM_COOKIE, rawToken, MAP_CLAIM_COOKIE_OPTIONS);
        }
        claimTokenHash = createHash("sha256").update(rawToken).digest("hex");
      }

      const { data: mapRow } = await admin
        .from("multiplier_maps")
        .insert({
          user_id: userId,
          claim_token_hash: userId ? null : claimTokenHash,
          answers,
          result: computeMapResult(answers),
          rubric_version: RUBRIC_VERSION,
          status: "discussed",
          locale: intake.locale,
        })
        .select("id")
        .single();
      multiplierMapId = mapRow?.id ?? null;
    }
  }

  const { error } = await admin.from("lead_intakes").insert({
    user_id: userId,
    multiplier_map_id: multiplierMapId,
    name: intake.name,
    email: intake.email,
    company: intake.company,
    company_stage: intake.companyStage ?? mapAnswerFields?.stage ?? null,
    primary_constraint: intake.primaryConstraint ?? mapAnswerFields?.constraint ?? null,
    desired_outcome: intake.desiredOutcome ?? mapAnswerFields?.outcome ?? null,
    budget_range: intake.budgetRange,
    timeline: intake.timeline ?? mapAnswerFields?.timeline ?? null,
    message: intake.message,
    source: intake.source,
    locale: intake.locale,
    utm: cleanUtm(
      formData.get("utm") && typeof formData.get("utm") === "string"
        ? safeParseJson(formData.get("utm") as string)
        : null,
    ),
    consent_contact: true,
    consent_contact_at: now,
    consent_updates: intake.consentUpdates,
    consent_updates_at: intake.consentUpdates ? now : null,
  });

  if (error) return { status: "error", code: "save_failed" };

  // Optional free-updates preference. No email provider is configured, so
  // the subscription stays `pending` and no external email is ever sent.
  if (intake.consentUpdates) {
    await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        email: intake.email,
        locale: intake.locale,
        status: "pending",
        consent_at: now,
        source: intake.source,
      },
      { onConflict: "email", ignoreDuplicates: false },
    );
  }

  return { status: "submitted" };
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
