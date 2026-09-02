"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitLeadIntakeAction, type IntakeFormState } from "@/app/actions/leadIntake";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

const IDLE: IntakeFormState = { status: "idle" };

type Option = readonly [string, string];

export type ContactBriefCopy = {
  nameLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  companyLabel: string;
  stageLabel: string;
  stages: readonly Option[];
  constraintLabel: string;
  constraints: readonly Option[];
  timelineLabel: string;
  timelines: readonly Option[];
  budgetLabel: string;
  budgets: readonly Option[];
  optional: string;
  messageLabel: string;
  messageHint: string;
  consentContact: string;
  consentUpdates: string;
  submit: string;
  done: string;
  doneHint: string;
  errors: {
    invalid: string;
    consent_required: string;
    rate_limited: string;
    save_failed: string;
  };
};

export function ContactBrief({
  locale,
  copy,
}: {
  locale: Locale;
  copy: ContactBriefCopy;
}) {
  const [state, dispatch, pending] = useActionState(submitLeadIntakeAction, IDLE);
  const mountedAtRef = useRef<number | null>(null);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  if (state.status === "submitted") {
    return (
      <div className="mayda-card" id="brief">
        <div className="mayda-form-status is-success" role="status">
          <span aria-hidden>✓</span>
          <span>
            <strong>{copy.done}</strong> {copy.doneHint}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      action={dispatch}
      className="mayda-card mayda-stack"
      id="brief"
      onSubmit={(event) => {
        const elapsedInput = event.currentTarget.elements.namedItem("elapsedMs");
        if (elapsedInput instanceof HTMLInputElement) {
          elapsedInput.value = String(
            mountedAtRef.current ? Date.now() - mountedAtRef.current : 0,
          );
        }
        trackEvent("lead_intake_submitted", { source: "contact", locale });
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value="contact" />
      <input type="hidden" name="elapsedMs" defaultValue="" />
      <div className="mayda-hp" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mayda-grid-2">
        <label className="mayda-field">
          <span>{copy.nameLabel}</span>
          <input name="name" autoComplete="name" required minLength={2} maxLength={160} />
        </label>
        <label className="mayda-field">
          <span>{copy.emailLabel}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            required
          />
        </label>
      </div>

      <label className="mayda-field">
        <span>
          {copy.companyLabel} <small>({copy.optional})</small>
        </span>
        <input name="company" autoComplete="organization" maxLength={200} />
      </label>

      <div className="mayda-grid-2">
        <label className="mayda-field">
          <span>{copy.stageLabel}</span>
          <select name="companyStage" defaultValue="">
            <option value="">—</option>
            {copy.stages.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>{copy.constraintLabel}</span>
          <select name="primaryConstraint" defaultValue="">
            <option value="">—</option>
            {copy.constraints.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>{copy.timelineLabel}</span>
          <select name="timeline" defaultValue="">
            <option value="">—</option>
            {copy.timelines.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>
            {copy.budgetLabel} <small>({copy.optional})</small>
          </span>
          <select name="budgetRange" defaultValue="">
            <option value="">—</option>
            {copy.budgets.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mayda-field">
        <span>{copy.messageLabel}</span>
        <small>{copy.messageHint}</small>
        <textarea
          name="message"
          rows={5}
          required
          minLength={24}
          maxLength={4000}
          aria-invalid={state.status === "error" && state.field === "message" ? "true" : undefined}
        />
      </label>

      <label className="mayda-checkbox">
        <input type="checkbox" name="consentContact" required />
        <span>{copy.consentContact}</span>
      </label>
      <label className="mayda-checkbox">
        <input type="checkbox" name="consentUpdates" />
        <span>{copy.consentUpdates}</span>
      </label>

      <div>
        <button type="submit" className="mayda-button" disabled={pending}>
          {copy.submit} <span aria-hidden>→</span>
        </button>
      </div>

      {state.status === "error" ? (
        <p className="mayda-form-status is-error" role="alert">
          {state.code === "consent_required"
            ? copy.errors.consent_required
            : state.code === "rate_limited"
              ? copy.errors.rate_limited
              : state.code === "save_failed"
                ? copy.errors.save_failed
                : copy.errors.invalid}
        </p>
      ) : null}
    </form>
  );
}
