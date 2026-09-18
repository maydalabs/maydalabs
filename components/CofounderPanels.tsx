"use client";

import { useActionState } from "react";
import { startCompanyAction, decideWorkItemAction, type CofounderState } from "@/app/actions/cofounder";
import type { OsCofounderCopy } from "@/components/osCopy";
import { ActionForm } from "@/components/os/ActionForm";

const IDLE: CofounderState = { status: "idle" };

export function StartCompanyForm({ copy }: { copy: OsCofounderCopy }) {
  const [state, dispatch, pending] = useActionState(startCompanyAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem", maxWidth: "34rem" }}>
      <label className="mayda-field">
        <span>{copy.nameLabel}</span>
        <input name="name" required maxLength={160} />
      </label>
      <label className="mayda-field">
        <span>{copy.whatLabel}</span>
        <textarea name="whatWeDo" rows={3} maxLength={2000} placeholder={copy.whatPlaceholder} />
      </label>
      <div className="mayda-hero-actions" style={{ gap: "0.6rem" }}>
        <button type="submit" className="mayda-button" disabled={pending}>
          {pending ? copy.starting : copy.start}
        </button>
        {state.status === "error" ? (
          <span className="mayda-field-error" role="alert">
            {state.code === "too_many" ? copy.tooMany : copy.startFailed}
          </span>
        ) : null}
      </div>
    </form>
  );
}

/* Approve and send back. The form says which it did when it is done: a
 * decision that lands in silence is a decision you make twice. */
export function WorkItemDecision({
  itemId,
  copy,
  notices,
}: {
  itemId: string;
  copy: OsCofounderCopy;
  notices: { approve: string; send_back: string };
}) {
  return (
    <ActionForm action={decideWorkItemAction} done={notices} className="mayda-os-decide">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="mayda-field" style={{ flex: "1 1 16rem" }}>
        <span>{copy.noteLabel}</span>
        <input name="note" maxLength={2000} />
      </label>
      <div className="mayda-hero-actions" style={{ gap: "0.6rem" }}>
        <button type="submit" name="decision" value="approve" className="mayda-button">
          {copy.approve}
        </button>
        <button type="submit" name="decision" value="send_back" className="mayda-button mayda-button-outline">
          {copy.sendBack}
        </button>
      </div>
    </ActionForm>
  );
}
