"use client";

import { useActionState } from "react";
import { runOsDraftAction, type OsRunState } from "@/app/actions/os";
import { OS_MAX_SOURCES, OS_SHAPES, OS_TOPIC_LIMIT } from "@/lib/os";
import type { OsDeskCopy } from "@/components/osCopy";

const IDLE: OsRunState = { status: "idle" };

function Message({ state, copy }: { state: OsRunState; copy: OsDeskCopy }) {
  if (state.status !== "error") return null;
  const fallback =
    state.code === "invite_only"
      ? "The beta is invite-only for now."
      : state.code === "no_credits"
        ? copy.outOfHeading
      : state.code === "daily_cap"
        ? "The beta has hit its budget for today. Try again tomorrow."
        : state.code === "not_signed_in"
          ? "Sign in first."
          : "That did not work.";
  return <span className="mayda-field-error" role="alert">{state.message ?? fallback}</span>;
}

export function OsRunForm({ copy, disabled }: { copy: OsDeskCopy; disabled: boolean }) {
  const [state, dispatch, pending] = useActionState(runOsDraftAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.8rem" }}>
      <label className="mayda-field">
        <span>{copy.topicLabel}</span>
        <input name="topic" required maxLength={OS_TOPIC_LIMIT} placeholder={copy.topicPlaceholder} disabled={disabled} />
      </label>

      <label className="mayda-field">
        <span>{copy.shapeLabel}</span>
        <select name="shape" defaultValue="note" disabled={disabled}>
          {OS_SHAPES.map((shape) => (
            <option key={shape} value={shape}>{copy.shapes[shape]}</option>
          ))}
        </select>
      </label>

      <label className="mayda-field">
        <span>{copy.sourcesLabel}</span>
        <textarea
          name="sources"
          required
          rows={4}
          spellCheck={false}
          disabled={disabled}
          placeholder={`https://example.com/article\nhttps://example.org/report`}
        />
      </label>

      <div className="mayda-hero-actions" style={{ gap: "0.7rem" }}>
        <button type="submit" className="mayda-button" disabled={pending || disabled}>
          {pending ? copy.running : copy.run}
        </button>
        <Message state={state} copy={copy} />
      </div>
      <p className="mayda-note" style={{ margin: 0 }}>
        {copy.creditsNote} Up to {OS_MAX_SOURCES} links.
      </p>
    </form>
  );
}
