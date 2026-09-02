"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/lib/intakeValidation";
import { isLocale, type Locale } from "@/lib/i18n";

export type PortalFormState = {
  status: "idle" | "saved" | "error";
  code?: "not_signed_in" | "invalid" | "save_failed";
};

function cleanOptional(value: FormDataEntryValue | null, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function updateProfileAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_signed_in" };

  const localeValue = formData.get("locale");
  const locale: Locale =
    typeof localeValue === "string" && isLocale(localeValue) ? localeValue : "en";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert({
    id: claims.sub,
    display_name: cleanOptional(formData.get("displayName"), 120),
    company_name: cleanOptional(formData.get("companyName"), 160),
    job_role: cleanOptional(formData.get("jobRole"), 120),
    locale,
  });

  if (error) return { status: "error", code: "save_failed" };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function deleteMapAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_signed_in" };

  const mapId = formData.get("mapId");
  if (typeof mapId !== "string" || !/^[0-9a-f-]{36}$/.test(mapId)) {
    return { status: "error", code: "invalid" };
  }

  // RLS limits the delete to the caller's own rows.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("multiplier_maps").delete().eq("id", mapId);
  if (error) return { status: "error", code: "save_failed" };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

/**
 * Free email-updates preference. There is deliberately no paid product,
 * plan, or billing here. Without a configured email provider the row stays
 * `pending` and nothing external is sent.
 */
export async function updateSubscriptionAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_signed_in" };
  const email = typeof claims.email === "string" ? claims.email.toLowerCase() : null;
  if (!email || !isValidEmail(email)) return { status: "error", code: "invalid" };

  const wantsUpdates = formData.get("updates") === "on";
  const localeValue = formData.get("locale");
  const locale: Locale =
    typeof localeValue === "string" && isLocale(localeValue) ? localeValue : "en";

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, status")
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    // Own-row update through RLS.
    const { error } = await supabase
      .from("subscriptions")
      .update(
        wantsUpdates
          ? { locale, status: "pending", unsubscribed_at: null }
          : { locale, status: "unsubscribed", unsubscribed_at: now },
      )
      .eq("id", existing.id);
    if (error) return { status: "error", code: "save_failed" };
  } else if (wantsUpdates) {
    // First-time opt-in: created with the verified session email. Insert
    // goes through the service credential (authenticated has no insert
    // grant), scoped to the caller's own identity.
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: claims.sub,
        email,
        locale,
        status: "pending",
        consent_at: now,
        source: "portal",
      },
      { onConflict: "email" },
    );
    if (error) return { status: "error", code: "save_failed" };
  }

  revalidatePath("/", "layout");
  return { status: "saved" };
}
