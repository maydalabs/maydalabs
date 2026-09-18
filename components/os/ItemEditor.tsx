"use client";

import { useActionState, useState } from "react";
import { editWorkItemAction, type EditResult } from "@/app/actions/cofounder";
import { notify } from "@/components/os/notice";
import { OS_LANES } from "@/lib/osWork";

/* Editing a piece of work, in place.
 *
 * Until this, an item was fixed the moment it existed — not the title, not
 * the note. Now everything a person wrote is theirs to change, up to the line
 * the database draws: approved, finished, or already signed for. The editor
 * never decides that line itself. It sends the change and shows what the
 * database said, in the database's words, so the one refusal that matters —
 * "what was approved is what stays" — arrives from the place that enforces it.
 */

export type ItemEditorCopy = {
  edit: string;
  editTitle: string;
  editLane: string;
  editNote: string;
  editDue: string;
  save: string;
  cancel: string;
  frozen: string;
  editFailed: string;
  saved: string;
  lanes: Record<string, string>;
};

const START: EditResult = { error: null, version: 0 };

export function ItemEditor({
  itemId,
  title,
  lane,
  notes,
  dueOn,
  copy,
}: {
  itemId: string;
  title: string;
  lane: string;
  notes: string;
  dueOn: string | null;
  copy: ItemEditorCopy;
}) {
  const [state, submit, pending] = useActionState(
    async (previous: EditResult, formData: FormData) => {
      const result = await editWorkItemAction(previous, formData);
      if (!result.error) notify(copy.saved);
      return result;
    },
    START,
  );
  /* Which submission the editor was opened for. A successful save bumps the
   * version past it and the editor closes by arithmetic, with no effect to
   * set state in; a refusal keeps it open with the reason. */
  const [openedFor, setOpenedFor] = useState<number | null>(null);
  const open = openedFor !== null && (openedFor === state.version || state.error !== null);
  const refusal = open && state.error !== null && openedFor !== null && openedFor < state.version;

  if (!open) {
    return (
      <button type="button" className="os-doc-edit" onClick={() => setOpenedFor(state.version)}>
        {copy.edit}
      </button>
    );
  }

  const lanes = (OS_LANES as readonly string[]).includes(lane) ? OS_LANES : [lane, ...OS_LANES];

  return (
    <form action={submit} className="os-editor">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="mayda-field">
        <span>{copy.editTitle}</span>
        <input name="title" defaultValue={title} required maxLength={200} autoFocus />
      </label>
      <div className="os-editor-row">
        <label className="mayda-field">
          <span>{copy.editLane}</span>
          <select name="lane" defaultValue={lane}>
            {lanes.map((value) => (
              <option key={value} value={value}>{copy.lanes[value] ?? value}</option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>{copy.editDue}</span>
          <input name="due_on" type="date" defaultValue={dueOn ?? ""} />
        </label>
      </div>
      <label className="mayda-field">
        <span>{copy.editNote}</span>
        <textarea name="notes" defaultValue={notes} rows={6} maxLength={8_000} />
      </label>

      {refusal ? (
        <p className="mayda-field-error" role="alert">
          {state.error?.includes("frozen") ? copy.frozen : copy.editFailed}
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
