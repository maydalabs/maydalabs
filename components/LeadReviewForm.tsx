"use client";

import { useActionState } from "react";
import { updateLeadReviewAction, type ReviewFormState } from "@/app/actions/internal";

const IDLE: ReviewFormState = { status: "idle" };

const STATUSES = ["new", "reviewing", "needs_info", "transferred", "closed"] as const;

export function LeadReviewForm({
  intakeId,
  initial,
}: {
  intakeId: string;
  initial: {
    reviewStatus: string;
    tags: string[];
    note: string;
    abidinRecordId: string;
  };
}) {
  const [state, dispatch, pending] = useActionState(updateLeadReviewAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem" }}>
      <input type="hidden" name="intakeId" value={intakeId} />
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Review status</span>
          <select name="reviewStatus" defaultValue={initial.reviewStatus}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>Abidin record id (required for “transferred”)</span>
          <input name="abidinRecordId" defaultValue={initial.abidinRecordId} maxLength={120} />
        </label>
      </div>
      <label className="mayda-field">
        <span>Tags (comma separated)</span>
        <input name="tags" defaultValue={initial.tags.join(", ")} />
      </label>
      <label className="mayda-field">
        <span>Internal note</span>
        <textarea name="note" rows={2} maxLength={4000} defaultValue={initial.note} />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="mayda-button mayda-button-small" disabled={pending}>
          Save review
        </button>
        {state.status === "saved" ? (
          <span className="mayda-status is-active" role="status">
            Saved
          </span>
        ) : state.status === "error" ? (
          <span className="mayda-field-error" role="alert">
            {state.code === "invalid"
              ? "Invalid input — “transferred” needs an Abidin record id."
              : state.code === "not_authorized"
                ? "Not authorized."
                : "Save failed."}
          </span>
        ) : null}
      </div>
    </form>
  );
}
