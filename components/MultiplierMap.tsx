"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestOtpAction, type AuthFormState } from "@/app/actions/auth";
import {
  saveMapAction,
  verifyOtpAndSaveMapAction,
  type SaveMapState,
} from "@/app/actions/map";
import { submitLeadIntakeAction, type IntakeFormState } from "@/app/actions/leadIntake";
import { MAP_COPY } from "@/components/multiplierMapCopy";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import {
  computeMapResult,
  parseMapAnswers,
  RUBRIC_VERSION,
  type MapAnswers,
} from "@/lib/multiplierMap";

const QUESTION_ORDER = ["stage", "constraint", "outcome", "timeline", "resources"] as const;
type QuestionKey = (typeof QUESTION_ORDER)[number];

const IDLE_SAVE: SaveMapState = { status: "idle" };
const IDLE_AUTH: AuthFormState = { status: "idle" };
const IDLE_INTAKE: IntakeFormState = { status: "idle" };

function AnswerFields({ answers, locale }: { answers: MapAnswers; locale: Locale }) {
  return (
    <>
      <input type="hidden" name="stage" value={answers.stage} />
      <input type="hidden" name="constraint" value={answers.constraint} />
      <input type="hidden" name="outcome" value={answers.outcome} />
      <input type="hidden" name="timeline" value={answers.timeline} />
      <input type="hidden" name="resources" value={answers.resources} />
      <input type="hidden" name="locale" value={locale} />
    </>
  );
}

export function MultiplierMap({
  locale,
  signedIn,
}: {
  locale: Locale;
  signedIn: boolean;
}) {
  const copy = MAP_COPY[locale];
  const mountedAtRef = useRef<number | null>(null);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<Record<QuestionKey, string>>>({});
  const [showError, setShowError] = useState(false);
  const [finished, setFinished] = useState(false);
  const [panel, setPanel] = useState<"none" | "save" | "discuss">("none");
  const startedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [saveState, saveDispatch, savePending] = useActionState(saveMapAction, IDLE_SAVE);
  const [otpState, otpDispatch, otpPending] = useActionState(requestOtpAction, IDLE_AUTH);
  const [verifySaveState, verifySaveDispatch, verifySavePending] = useActionState(
    verifyOtpAndSaveMapAction,
    IDLE_SAVE,
  );
  const [intakeState, intakeDispatch, intakePending] = useActionState(
    submitLeadIntakeAction,
    IDLE_INTAKE,
  );

  const questionKey = QUESTION_ORDER[stepIndex];
  const answers = finished ? parseMapAnswers(draft) : null;
  const result = answers ? computeMapResult(answers) : null;

  const pick = (value: string) => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("multiplier_map_started", { locale });
    }
    setShowError(false);
    setDraft((current) => ({ ...current, [questionKey]: value }));
  };

  const focusHeading = () => {
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "nearest" });
    });
  };

  const goNext = () => {
    if (!draft[questionKey]) {
      setShowError(true);
      return;
    }
    trackEvent("multiplier_map_step", {
      step: stepIndex + 1,
      question: questionKey,
      answer: draft[questionKey] ?? "unset",
    });
    if (stepIndex < QUESTION_ORDER.length - 1) {
      setStepIndex(stepIndex + 1);
      focusHeading();
      return;
    }
    const parsed = parseMapAnswers(draft);
    if (!parsed) return;
    const computed = computeMapResult(parsed);
    trackEvent("multiplier_map_completed", { path: computed.path, offer: computed.offer });
    setFinished(true);
    focusHeading();
  };

  const goBack = () => {
    setShowError(false);
    if (finished) {
      setFinished(false);
      setPanel("none");
    } else if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
    focusHeading();
  };

  const restart = () => {
    setDraft({});
    setStepIndex(0);
    setFinished(false);
    setPanel("none");
    setShowError(false);
    focusHeading();
  };

  const question = copy.questions[questionKey];
  const mapSaved =
    saveState.status === "saved" || verifySaveState.status === "saved";
  const saveError =
    saveState.status === "error"
      ? saveState.code
      : verifySaveState.status === "error"
        ? verifySaveState.code
        : otpState.status === "error"
          ? otpState.code
          : null;
  const otpEmail =
    otpState.status === "code_sent" && !emailChangeRequested ? otpState.email : null;

  return (
    <div className="mayda-map-panel">
      <div className="mayda-map-progress">
        <p className="mayda-mono" style={{ margin: 0, color: "var(--mist)" }}>
          {finished
            ? copy.resultKicker
            : `${copy.stepWord} ${stepIndex + 1} / ${QUESTION_ORDER.length}`}
        </p>
        <ol aria-label={copy.progressLabel}>
          {QUESTION_ORDER.map((key, index) => (
            <li
              key={key}
              className={
                finished || index < stepIndex
                  ? "is-complete"
                  : index === stepIndex
                    ? "is-current"
                    : ""
              }
              aria-current={!finished && index === stepIndex ? "step" : undefined}
            >
              <span className="mayda-visually-hidden">{copy.questions[key].label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mayda-map-body">
        {!finished ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              goNext();
            }}
          >
            <fieldset className="mayda-fieldset">
              <legend>
                <h2 ref={headingRef} tabIndex={-1} className="mayda-subheading">
                  {question.label}
                </h2>
              </legend>
              {question.hint ? <p>{question.hint}</p> : null}
              <div className={`mayda-choices ${question.options.length <= 3 ? "is-compact" : ""}`}>
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="mayda-choice"
                    aria-pressed={draft[questionKey] === option.id}
                    onClick={() => pick(option.id)}
                  >
                    <strong>{option.label}</strong>
                    {option.detail ? <small>{option.detail}</small> : null}
                  </button>
                ))}
              </div>
              {showError ? (
                <p className="mayda-field-error" role="alert">
                  {copy.required}
                </p>
              ) : null}
            </fieldset>
            <div className="mayda-map-nav" style={{ marginTop: "1.5rem" }}>
              {stepIndex > 0 ? (
                <button type="button" className="is-back" onClick={goBack}>
                  ← {copy.back}
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="mayda-button">
                {stepIndex < QUESTION_ORDER.length - 1 ? copy.next : copy.seeMap}{" "}
                <span aria-hidden>→</span>
              </button>
            </div>
          </form>
        ) : answers && result ? (
          <div className="mayda-map-result">
            <div className="mayda-map-result-header">
              <h2 ref={headingRef} tabIndex={-1} className="mayda-heading">
                {copy.resultHeading}
              </h2>
              <p className="mayda-body" style={{ maxWidth: "none" }}>
                {copy.rubricNote.replace("{version}", RUBRIC_VERSION)}
              </p>
            </div>

            <div className="mayda-stack">
              <p className="mayda-kicker" style={{ margin: 0 }}>
                {copy.pathLabel}
              </p>
              <h3 className="mayda-subheading">{copy.paths[result.path].title}</h3>
              <p className="mayda-body">{copy.paths[result.path].text}</p>
            </div>

            <div className="mayda-map-move">
              <p className="mayda-kicker" style={{ margin: 0 }}>
                {copy.offerLabel}
              </p>
              <h3>{copy.offers[result.offer].title}</h3>
              <p>{copy.offers[result.offer].text}</p>
            </div>

            <div className="mayda-stack">
              <p className="mayda-kicker" style={{ margin: 0 }}>
                {copy.focusLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.focus.map((capability, index) => (
                  <span key={capability} className={`mayda-tag ${index === 0 ? "is-cobalt" : ""}`}>
                    {copy.capabilities[capability]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mayda-stack">
              <p className="mayda-kicker" style={{ margin: 0 }}>
                {copy.stepsLabel}
              </p>
              <ol className="mayda-map-steps">
                {result.steps.map((step) => (
                  <li key={step}>{copy.steps[step]}</li>
                ))}
              </ol>
            </div>

            {result.notes.map((note) => (
              <p key={note} className="mayda-map-note">
                {copy.notes[note]}
              </p>
            ))}

            <div className="mayda-stack" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.4rem" }}>
              <p className="mayda-kicker" style={{ margin: 0 }}>
                {copy.actionsLabel}
              </p>

              {mapSaved ? (
                <p className="mayda-form-status is-success" role="status">
                  <span aria-hidden>✓</span> {copy.saved} {copy.savedHint}
                </p>
              ) : intakeState.status === "submitted" ? (
                <div className="mayda-form-status is-success" role="status">
                  <span aria-hidden>✓</span>
                  <span>
                    <strong>{copy.discussDone}</strong> {copy.discussDoneHint}
                  </span>
                </div>
              ) : (
                <div className="mayda-map-actions">
                  <button
                    type="button"
                    className="mayda-button"
                    aria-expanded={panel === "discuss"}
                    onClick={() => setPanel(panel === "discuss" ? "none" : "discuss")}
                  >
                    {copy.discussAction}
                  </button>
                  <button
                    type="button"
                    className="mayda-button mayda-button-outline"
                    aria-expanded={panel === "save"}
                    onClick={() => setPanel(panel === "save" ? "none" : "save")}
                  >
                    {copy.saveAction}
                  </button>
                  <button type="button" className="mayda-text-link" onClick={restart} style={{ border: "none", background: "none", cursor: "pointer" }}>
                    {copy.restart}
                  </button>
                </div>
              )}

              {panel === "save" && !mapSaved ? (
                <div className="mayda-stack" style={{ maxWidth: "30rem" }}>
                  <p className="mayda-body">{copy.saveHint}</p>
                  {signedIn ? (
                    <form action={saveDispatch} className="mayda-stack">
                      <AnswerFields answers={answers} locale={locale} />
                      <button type="submit" className="mayda-button" disabled={savePending}>
                        {copy.saveAction}
                      </button>
                    </form>
                  ) : otpEmail ? (
                    <form action={verifySaveDispatch} className="mayda-stack">
                      <AnswerFields answers={answers} locale={locale} />
                      <input type="hidden" name="email" value={otpEmail} />
                      <p className="mayda-body">
                        {copy.codeSentTo} <strong>{otpEmail}</strong>. {copy.codeHint}
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
                        />
                      </label>
                      <div className="mayda-map-actions">
                        <button type="submit" className="mayda-button" disabled={verifySavePending}>
                          {copy.verifyAndSave}
                        </button>
                        <button
                          type="button"
                          className="is-back mayda-text-link"
                          style={{ border: "none", background: "none", cursor: "pointer" }}
                          onClick={() => setEmailChangeRequested(true)}
                        >
                          {copy.changeEmail}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      action={otpDispatch}
                      onSubmit={() => setEmailChangeRequested(false)}
                      className="mayda-stack"
                    >
                      <p className="mayda-body">{copy.authIntro}</p>
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
                      <button type="submit" className="mayda-button" disabled={otpPending}>
                        {copy.sendCode}
                      </button>
                    </form>
                  )}
                  {saveError ? (
                    <p className="mayda-form-status is-error" role="alert">
                      {copy.errors[saveError]}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {panel === "discuss" && intakeState.status !== "submitted" ? (
                <form
                  action={intakeDispatch}
                  className="mayda-stack"
                  style={{ maxWidth: "34rem" }}
                  onSubmit={(event) => {
                    const elapsedInput = event.currentTarget.elements.namedItem("elapsedMs");
                    if (elapsedInput instanceof HTMLInputElement) {
                      elapsedInput.value = String(
                        mountedAtRef.current ? Date.now() - mountedAtRef.current : 0,
                      );
                    }
                    trackEvent("multiplier_map_discussed", { locale });
                  }}
                >
                  <AnswerFields answers={answers} locale={locale} />
                  <input type="hidden" name="mapAnswers" value={JSON.stringify(answers)} />
                  <input type="hidden" name="source" value="multiplier_map" />
                  <input type="hidden" name="elapsedMs" defaultValue="" />
                  <div className="mayda-hp" aria-hidden="true">
                    <label>
                      Website
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <p className="mayda-body">{copy.discussIntro}</p>
                  <div className="mayda-grid-2">
                    <label className="mayda-field">
                      <span>{copy.nameLabel}</span>
                      <input name="name" autoComplete="name" required minLength={2} />
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
                    <span>{copy.companyLabel}</span>
                    <input name="company" autoComplete="organization" />
                  </label>
                  <label className="mayda-field">
                    <span>{copy.messageLabel}</span>
                    <small>{copy.messageHint}</small>
                    <textarea name="message" rows={4} maxLength={4000} />
                  </label>
                  <label className="mayda-checkbox">
                    <input type="checkbox" name="consentContact" required />
                    <span>{copy.consentContact}</span>
                  </label>
                  <label className="mayda-checkbox">
                    <input type="checkbox" name="consentUpdates" />
                    <span>{copy.consentUpdates}</span>
                  </label>
                  <button type="submit" className="mayda-button" disabled={intakePending}>
                    {copy.submitDiscuss}
                  </button>
                  {intakeState.status === "error" ? (
                    <p className="mayda-form-status is-error" role="alert">
                      {intakeState.code === "consent_required"
                        ? copy.errors.consent_required
                        : intakeState.code === "rate_limited"
                          ? copy.errors.rate_limited
                          : intakeState.code === "save_failed"
                            ? copy.errors.save_failed
                            : copy.errors.invalid}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
