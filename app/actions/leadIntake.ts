"use server";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { getSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  cleanUtm,
  looksAutomated,
  validateIntake,
  type IntakeInput,
} from "@/lib/intakeValidation";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rateLimit";
import { isEmailConfigured, notifyAddress, sendEmail } from "@/lib/email";
import { acknowledgementEmail, notificationEmail } from "@/lib/emailTemplates";

export type IntakeFormState = {
  status: "idle" | "submitted" | "error";
  code?: "invalid" | "rate_limited" | "consent_required" | "save_failed";
  field?: string;
};

/**
 * The single write path for enquiries from the contact form. Treated as a public endpoint: honeypot + fill-time
 * checks, per-IP rate limiting, strict validation, and inserts through the
 * service credential only — the anon role has no table privileges at all.
 *
 * Two transactional emails go out once the row is safely stored: an
 * acknowledgement to the person and a notification to the operator. Both are
 * best-effort — the enquiry is already saved, so a mail failure must never
 * turn into a lost lead or an error the visitor sees. Nothing else is sent,
 * nothing is written to Abidin, and the updates subscription stays pending;
 * Abidin remains the canonical commercial record.
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

  const { error } = await admin.from("lead_intakes").insert({
    user_id: userId,
    name: intake.name,
    email: intake.email,
    company: intake.company,
    company_stage: intake.companyStage,
    primary_constraint: intake.primaryConstraint,
    desired_outcome: intake.desiredOutcome,
    budget_range: intake.budgetRange,
    timeline: intake.timeline,
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

  await notifyOfIntake(intake);

  return { status: "submitted" };
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/*
 * Tell the person we have their message, and tell the operator it arrived.
 *
 * Both are awaited rather than left running: a serverless invocation can end
 * the moment the action returns, and a fire-and-forget send would sometimes
 * simply not happen. Both are also swallowed on failure — the row is already
 * written, and no visitor should see an error because a mail provider was
 * slow. When no key is configured the whole thing is a no-op, which is the
 * state production is in until one is set.
 */
async function notifyOfIntake(intake: IntakeInput): Promise<void> {
  if (!isEmailConfigured()) return;

  const ack = acknowledgementEmail(intake);
  const internal = notificationEmail(intake);

  const results = await Promise.allSettled([
    sendEmail({ to: intake.email, subject: ack.subject, html: ack.html, text: ack.text }),
    sendEmail({
      to: notifyAddress(),
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
      // So replying goes straight to them instead of to ourselves.
      replyTo: intake.email,
    }),
  ]);

  for (const result of results) {
    // Visible in the platform log without exposing anything about the
    // person: the record is in the database either way.
    if (result.status === "rejected") console.error("intake email not delivered: threw");
    else if (!result.value.ok) console.error("intake email not delivered:", result.value.reason);
  }
}
