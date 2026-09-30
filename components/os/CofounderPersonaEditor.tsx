"use client";

import { useActionState, useState } from "react";
import { savePersonaAction } from "@/app/actions/persona";
import type { EditResult } from "@/app/actions/cofounder";
import { COFOUNDER_VOICES, PERSONA_LIMITS, type CofounderVoice } from "@/lib/osPersona";
import { notify } from "@/components/os/notice";

/* Giving the co-founder a name and a manner.
 *
 * The same shape as the company editor: a form sends the change and shows
 * what the server said. Offered only to an owner, because the policy admits
 * only an owner and a control that is always refused is a trap. There is no
 * clear button: an empty name, the plain voice and an empty note are the
 * default again, and saving them says so.
 */

export type CofounderPersonaCopy = {
  nameIt: string; change: string; name: string; voice: string;
  voices: Record<CofounderVoice, { label: string; help: string }>;
  note: string; noteHint: string; saved: string; failed: string;
  reasons: Record<string, string>; save: string; cancel: string;
};

const START: EditResult = { error: null, version: 0 };

export function CofounderPersonaEditor({ companyId, name, voice, note, copy }: {
  companyId: string; name: string | null; voice: CofounderVoice; note: string | null; copy: CofounderPersonaCopy;
}) {
  const [state, submit, pending] = useActionState(
    async (previous: EditResult, formData: FormData) => {
      const result = await savePersonaAction(previous, formData);
      if (!result.error) notify(copy.saved);
      return result;
    },
    START,
  );
  /* Opened for a submission; a successful save moves the version past it and
   * the editor closes by arithmetic, a refusal keeps it open with the why. */
  const [openedFor, setOpenedFor] = useState<number | null>(null);
  const open = openedFor !== null && (openedFor === state.version || state.error !== null);
  const refusal = open && state.error !== null && openedFor !== null && openedFor < state.version;

  if (!open) {
    return (
      <button type="button" className="os-doc-edit" onClick={() => setOpenedFor(state.version)}>
        {name ? copy.change : copy.nameIt}
      </button>
    );
  }

  return (
    <form action={submit} className="os-editor">
      <input type="hidden" name="companyId" value={companyId} />
      <label className="mayda-field">
        <span>{copy.name}</span>
        <input name="name" defaultValue={name ?? ""} maxLength={PERSONA_LIMITS.name} placeholder="Ada" autoFocus />
      </label>

      <fieldset className="mayda-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>{copy.voice}</legend>
        {COFOUNDER_VOICES.map((option) => (
          <label key={option} className="os-choice">
            <input type="radio" name="voice" value={option} defaultChecked={option === voice} />
            <span>
              <strong>{copy.voices[option].label}</strong>
              <span className="os-doc-quiet"> {copy.voices[option].help}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="mayda-field">
        <span>{copy.note}</span>
        {/* A single-line input, not a textarea: a textarea invites paragraphs. */}
        <input name="note" defaultValue={note ?? ""} maxLength={PERSONA_LIMITS.note} />
        <span className="os-doc-quiet">{copy.noteHint}</span>
      </label>

      {refusal ? (
        <p className="mayda-field-error" role="alert">
          {copy.failed.replace("{reason}", copy.reasons[state.error ?? ""] ?? state.error ?? "")}
        </p>
      ) : null}

      <div className="os-editor-actions">
        <button type="submit" className="mayda-button" disabled={pending}>{copy.save}</button>
        <button type="button" className="mayda-button mayda-button-outline" onClick={() => setOpenedFor(null)}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
