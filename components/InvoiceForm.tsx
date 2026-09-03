"use client";

import { useActionState } from "react";
import { createInvoiceAction, type InvoiceFormState } from "@/app/actions/payments";

/* Operator form: one invoice, one address. English only, like the rest of
 * the internal screens.
 *
 * The address is pasted from a wallet the operator controls, which is why
 * this needs no xpub, no processor account, and no server: any wallet that
 * can show a receive address can take the payment. Use a fresh address per
 * invoice so two clients are never told to pay the same one. */

const IDLE: InvoiceFormState = { status: "idle" };

function Status({ state }: { state: InvoiceFormState }) {
  if (state.status === "saved") return <span className="mayda-status is-active" role="status">Invoice created</span>;
  if (state.status !== "error") return null;
  const message =
    state.code === "not_authorized"
      ? "Not authorized."
      : state.code === "rate_unavailable"
        ? "Could not read the BTC/USD rate from mempool.space. Try again."
        : state.code === "invalid"
          ? state.field === "address"
            ? "That is not a valid mainnet bitcoin address (checksum failed)."
            : `Invalid input${state.field ? ` (${state.field})` : ""}.`
          : "Save failed.";
  return <span className="mayda-field-error" role="alert">{message}</span>;
}

export function InvoiceForm({ pilotId }: { pilotId: string }) {
  const [state, dispatch, pending] = useActionState(createInvoiceAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem" }}>
      <input type="hidden" name="pilotId" value={pilotId} />
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Label</span>
          <input name="label" required maxLength={120} placeholder="e.g. Pilot fee, or Month 1" />
        </label>
        <label className="mayda-field">
          <span>Amount (USD)</span>
          <input name="amountUsd" required type="number" min="1" max="1000000" step="0.01" placeholder="2500.00" />
        </label>
      </div>
      <label className="mayda-field">
        <span>Receiving address (fresh, from your wallet)</span>
        <input name="address" required maxLength={90} spellCheck={false} autoComplete="off" placeholder="bc1..." />
      </label>
      <p className="mayda-note" style={{ margin: 0 }}>
        The rate is read from mempool.space and locked when you create the invoice. The quote holds for 24 hours.
      </p>
      <div className="mayda-hero-actions" style={{ gap: "0.6rem" }}>
        <button type="submit" className="mayda-button" disabled={pending}>
          {pending ? "Creating..." : "Create invoice"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}
