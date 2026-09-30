"use client";

import { useActionState } from "react";
import { setAddressAction } from "@/app/actions/persona";
import type { EditResult } from "@/app/actions/cofounder";
import { PERSONA_LIMITS } from "@/lib/osPersona";
import { notify } from "@/components/os/notice";

/* How the co-founder addresses you, in conversation.
 *
 * One field, yours alone, on your own membership row. Every member sees the
 * same form and each sets only their own; clearing is saving an empty field.
 */

export type AddressEditorCopy = {
  placeholder: string; save: string; saved: string; failed: string; reasons: Record<string, string>;
};

const START: EditResult = { error: null, version: 0 };

export function AddressEditor({ address, copy }: { address: string | null; copy: AddressEditorCopy }) {
  const [state, submit, pending] = useActionState(
    async (previous: EditResult, formData: FormData) => {
      const result = await setAddressAction(previous, formData);
      if (!result.error) notify(copy.saved);
      return result;
    },
    START,
  );

  return (
    <form action={submit} className="os-editor os-settings-address">
      <input
        name="address"
        defaultValue={address ?? ""}
        maxLength={PERSONA_LIMITS.addressAs}
        placeholder={copy.placeholder}
        aria-label={copy.placeholder}
      />
      <button type="submit" className="mayda-button mayda-button-outline" disabled={pending}>{copy.save}</button>
      {state.error ? (
        <p className="mayda-field-error" role="alert">
          {copy.failed.replace("{reason}", copy.reasons[state.error] ?? state.error)}
        </p>
      ) : null}
    </form>
  );
}
