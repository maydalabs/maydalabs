"use client";

import { useActionState, useState } from "react";
import { editCompanyAction, type EditResult } from "@/app/actions/cofounder";
import { notify } from "@/components/os/notice";

/* Correcting the company, in place.
 *
 * The same shape as the work item's editor, for the same reason: it sends
 * the change and shows what the database said. It is offered only to an
 * owner, because the policy admits only an owner and a button that is
 * always refused is a trap.
 */

export type CompanyEditorCopy = {
  edit: string;
  nameLabel: string;
  whatLabel: string;
  save: string;
  cancel: string;
  failed: string;
  saved: string;
};

const START: EditResult = { error: null, version: 0 };

export function CompanyEditor({
  companyId,
  name,
  whatWeDo,
  copy,
}: {
  companyId: string;
  name: string;
  whatWeDo: string;
  copy: CompanyEditorCopy;
}) {
  const [state, submit, pending] = useActionState(
    async (previous: EditResult, formData: FormData) => {
      const result = await editCompanyAction(previous, formData);
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
        {copy.edit}
      </button>
    );
  }

  return (
    <form action={submit} className="os-editor">
      <input type="hidden" name="companyId" value={companyId} />
      <label className="mayda-field">
        <span>{copy.nameLabel}</span>
        <input name="name" defaultValue={name} required maxLength={160} autoFocus />
      </label>
      <label className="mayda-field">
        <span>{copy.whatLabel}</span>
        <textarea name="whatWeDo" defaultValue={whatWeDo} rows={3} maxLength={2000} />
      </label>

      {refusal ? (
        <p className="mayda-field-error" role="alert">{copy.failed}</p>
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
