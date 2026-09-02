"use client";

import { useActionState } from "react";
import { signOutAction } from "@/app/actions/auth";
import {
  deleteMapAction,
  updateProfileAction,
  updateSubscriptionAction,
  type PortalFormState,
} from "@/app/actions/portal";
import type { Locale } from "@/lib/i18n";

const IDLE: PortalFormState = { status: "idle" };

export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className="mayda-button mayda-button-outline mayda-button-small">
        {label}
      </button>
    </form>
  );
}

export function DeleteMapButton({ mapId, label }: { mapId: string; label: string }) {
  const [, dispatch, pending] = useActionState(deleteMapAction, IDLE);
  return (
    <form action={dispatch}>
      <input type="hidden" name="mapId" value={mapId} />
      <button
        type="submit"
        className="mayda-status is-muted"
        style={{ cursor: "pointer", background: "none" }}
        disabled={pending}
      >
        {label}
      </button>
    </form>
  );
}

export type ProfileFormCopy = {
  displayName: string;
  companyName: string;
  jobRole: string;
  save: string;
  saved: string;
  failed: string;
};

export function ProfileForm({
  locale,
  copy,
  initial,
}: {
  locale: Locale;
  copy: ProfileFormCopy;
  initial: { displayName: string; companyName: string; jobRole: string };
}) {
  const [state, dispatch, pending] = useActionState(updateProfileAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ maxWidth: "30rem" }}>
      <input type="hidden" name="locale" value={locale} />
      <label className="mayda-field">
        <span>{copy.displayName}</span>
        <input name="displayName" defaultValue={initial.displayName} maxLength={120} autoComplete="name" />
      </label>
      <label className="mayda-field">
        <span>{copy.companyName}</span>
        <input name="companyName" defaultValue={initial.companyName} maxLength={160} autoComplete="organization" />
      </label>
      <label className="mayda-field">
        <span>{copy.jobRole}</span>
        <input name="jobRole" defaultValue={initial.jobRole} maxLength={120} autoComplete="organization-title" />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="mayda-button mayda-button-small" disabled={pending}>
          {copy.save}
        </button>
        {state.status === "saved" ? (
          <span className="mayda-status is-active" role="status">
            {copy.saved}
          </span>
        ) : state.status === "error" ? (
          <span className="mayda-field-error" role="alert">
            {copy.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}

export type SubscriptionFormCopy = {
  checkbox: string;
  save: string;
  saved: string;
  failed: string;
};

export function SubscriptionForm({
  locale,
  copy,
  initiallySubscribed,
}: {
  locale: Locale;
  copy: SubscriptionFormCopy;
  initiallySubscribed: boolean;
}) {
  const [state, dispatch, pending] = useActionState(updateSubscriptionAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ maxWidth: "30rem" }}>
      <input type="hidden" name="locale" value={locale} />
      <label className="mayda-checkbox">
        <input type="checkbox" name="updates" defaultChecked={initiallySubscribed} />
        <span>{copy.checkbox}</span>
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="mayda-button mayda-button-small" disabled={pending}>
          {copy.save}
        </button>
        {state.status === "saved" ? (
          <span className="mayda-status is-active" role="status">
            {copy.saved}
          </span>
        ) : state.status === "error" ? (
          <span className="mayda-field-error" role="alert">
            {copy.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}
