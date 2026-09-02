"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";

export type ReviewFormState = {
  status: "idle" | "saved" | "error";
  code?: "not_authorized" | "invalid" | "save_failed";
};

const REVIEW_STATUSES = ["new", "reviewing", "needs_info", "transferred", "closed"] as const;

/**
 * Operator-only review update. Authorization is enforced twice: the page is
 * gated server-side, and this mutation runs through the caller's RLS-scoped
 * client — non-operators simply match zero rows. Marking an intake
 * `transferred` records a manual transfer to Abidin that already happened;
 * nothing is written into Abidin from here.
 */
export async function updateLeadReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const claims = await getVerifiedClaims();
  if (!claims?.sub) return { status: "error", code: "not_authorized" };

  const intakeId = formData.get("intakeId");
  if (typeof intakeId !== "string" || !/^[0-9a-f-]{36}$/.test(intakeId)) {
    return { status: "error", code: "invalid" };
  }

  const reviewStatus = formData.get("reviewStatus");
  if (
    typeof reviewStatus !== "string" ||
    !(REVIEW_STATUSES as readonly string[]).includes(reviewStatus)
  ) {
    return { status: "error", code: "invalid" };
  }

  const tagsRaw = formData.get("tags");
  const tags =
    typeof tagsRaw === "string"
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim().toLowerCase().slice(0, 40))
          .filter(Boolean)
          .slice(0, 12)
      : [];

  const noteRaw = formData.get("note");
  const note =
    typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim().slice(0, 4000) : null;

  const abidinIdRaw = formData.get("abidinRecordId");
  const abidinRecordId =
    typeof abidinIdRaw === "string" && abidinIdRaw.trim()
      ? abidinIdRaw.trim().slice(0, 120)
      : null;

  if (reviewStatus === "transferred" && !abidinRecordId) {
    return { status: "error", code: "invalid" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_intakes")
    .update({
      review_status: reviewStatus,
      internal_tags: tags,
      internal_note: note,
      abidin_record_id: abidinRecordId,
      transferred_to_abidin_at:
        reviewStatus === "transferred" ? new Date().toISOString() : null,
    })
    .eq("id", intakeId)
    .select("id");

  if (error) return { status: "error", code: "save_failed" };
  if (!data?.length) return { status: "error", code: "not_authorized" };

  revalidatePath("/", "layout");
  return { status: "saved" };
}
