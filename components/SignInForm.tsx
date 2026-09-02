"use client";

import { useActionState, useState } from "react";
import {
  requestOtpAction,
  verifyOtpAction,
  type AuthFormState,
} from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

const IDLE: AuthFormState = { status: "idle" };

export type SignInCopy = {
  emailLabel: string;
  emailPlaceholder: string;
  sendCode: string;
  codeSentTo: string;
  codeLabel: string;
  codeHint: string;
  verify: string;
  changeEmail: string;
  errors: Record<string, string>;
};

export function SignInForm({
  locale,
  nextPath,
  copy,
}: {
  locale: Locale;
  nextPath: string;
  copy: SignInCopy;
}) {
  const [requestState, requestDispatch, requestPending] = useActionState(
    requestOtpAction,
    IDLE,
  );
  const [verifyState, verifyDispatch, verifyPending] = useActionState(verifyOtpAction, IDLE);
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);

  const sentEmail =
    requestState.status === "code_sent" && !emailChangeRequested ? requestState.email : null;
  const errorCode =
    verifyState.status === "error"
      ? verifyState.code
      : requestState.status === "error"
        ? requestState.code
        : null;

  return (
    <div className="mayda-stack">
      {sentEmail ? (
        <form action={verifyDispatch} className="mayda-stack">
          <input type="hidden" name="email" value={sentEmail} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={nextPath} />
          <p className="mayda-body" role="status">
            {copy.codeSentTo} <strong>{sentEmail}</strong>. {copy.codeHint}
          </p>
          <label className="mayda-field">
            <span>{copy.codeLabel}</span>
            <input
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="mayda-button" disabled={verifyPending}>
              {copy.verify}
            </button>
            <button
              type="button"
              className="mayda-text-link"
              style={{ border: "none", background: "none", cursor: "pointer" }}
              onClick={() => setEmailChangeRequested(true)}
            >
              {copy.changeEmail}
            </button>
          </div>
        </form>
      ) : (
        <form
          action={requestDispatch}
          onSubmit={() => setEmailChangeRequested(false)}
          className="mayda-stack"
        >
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
          <div>
            <button type="submit" className="mayda-button" disabled={requestPending}>
              {copy.sendCode}
            </button>
          </div>
        </form>
      )}

      {errorCode ? (
        <p className="mayda-form-status is-error" role="alert">
          {copy.errors[errorCode] ?? copy.errors.verify_failed}
        </p>
      ) : null}
    </div>
  );
}
