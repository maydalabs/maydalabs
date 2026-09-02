"use client";

import { useActionState } from "react";
import {
  addPilotUpdateAction,
  createPilotAction,
  deletePilotUpdateAction,
  updatePilotAction,
  type PilotFormState,
} from "@/app/actions/pilots";
import { PILOT_OFFERS, PILOT_STATUSES, PILOT_UPDATE_KINDS } from "@/lib/pilots";

/* Internal (operator) forms — English only by design. */

const IDLE: PilotFormState = { status: "idle" };

function Status({ state }: { state: PilotFormState }) {
  if (state.status === "saved") {
    return (
      <span className="mayda-status is-active" role="status">
        Saved
      </span>
    );
  }
  if (state.status === "error") {
    return (
      <span className="mayda-field-error" role="alert">
        {state.code === "not_authorized"
          ? "Not authorized."
          : state.code === "invalid"
            ? `Invalid input${state.field ? ` (${state.field})` : ""}.`
            : "Save failed."}
      </span>
    );
  }
  return null;
}

export function CreatePilotForm() {
  const [state, dispatch, pending] = useActionState(createPilotAction, IDLE);
  return (
    <form action={dispatch} className="mayda-card mayda-stack" style={{ gap: "0.8rem" }}>
      <h2 className="mayda-subheading">New pilot</h2>
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Client email</span>
          <input name="clientEmail" type="email" required />
        </label>
        <label className="mayda-field">
          <span>Company</span>
          <input name="company" required maxLength={200} />
        </label>
        <label className="mayda-field">
          <span>Workflow (what the pilot runs)</span>
          <input name="workflow" required maxLength={200} placeholder="e.g. Weekly market note" />
        </label>
        <label className="mayda-field">
          <span>Offer</span>
          <select name="offer" defaultValue="ai_operations">
            {PILOT_OFFERS.map((offer) => (
              <option key={offer} value={offer}>
                {offer}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>Status</span>
          <select name="status" defaultValue="proposed">
            {PILOT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
          <label className="mayda-field">
            <span>Starts</span>
            <input name="startsOn" type="date" />
          </label>
          <label className="mayda-field">
            <span>Ends</span>
            <input name="endsOn" type="date" />
          </label>
        </div>
      </div>
      <label className="mayda-field">
        <span>Summary (client-visible)</span>
        <textarea name="summary" rows={2} maxLength={4000} />
      </label>
      <label className="mayda-field">
        <span>Next step (client-visible)</span>
        <input name="nextStep" maxLength={1000} />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="mayda-button mayda-button-small" disabled={pending}>
          Create pilot
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function UpdatePilotForm({
  pilot,
}: {
  pilot: {
    id: string;
    status: string;
    starts_on: string | null;
    ends_on: string | null;
    summary: string | null;
    next_step: string | null;
  };
}) {
  const [state, dispatch, pending] = useActionState(updatePilotAction, IDLE);
  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem" }}>
      <input type="hidden" name="pilotId" value={pilot.id} />
      <div className="mayda-grid-3" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Status</span>
          <select name="status" defaultValue={pilot.status}>
            {PILOT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>Starts</span>
          <input name="startsOn" type="date" defaultValue={pilot.starts_on ?? ""} />
        </label>
        <label className="mayda-field">
          <span>Ends</span>
          <input name="endsOn" type="date" defaultValue={pilot.ends_on ?? ""} />
        </label>
      </div>
      <label className="mayda-field">
        <span>Summary (client-visible)</span>
        <textarea name="summary" rows={2} maxLength={4000} defaultValue={pilot.summary ?? ""} />
      </label>
      <label className="mayda-field">
        <span>Next step (client-visible)</span>
        <input name="nextStep" maxLength={1000} defaultValue={pilot.next_step ?? ""} />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="mayda-button mayda-button-small mayda-button-outline" disabled={pending}>
          Save pilot
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function AddPilotUpdateForm({ pilotId }: { pilotId: string }) {
  const [state, dispatch, pending] = useActionState(addPilotUpdateAction, IDLE);
  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem" }}>
      <input type="hidden" name="pilotId" value={pilotId} />
      <div className="mayda-grid-3" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Kind</span>
          <select name="kind" defaultValue="report">
            {PILOT_UPDATE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>
        <label className="mayda-field">
          <span>Title</span>
          <input name="title" required maxLength={200} />
        </label>
        <label className="mayda-field">
          <span>Period label</span>
          <input name="periodLabel" maxLength={60} placeholder="Week 2" />
        </label>
      </div>
      <div className="mayda-metrics">
        <label className="mayda-field">
          <span>Pieces produced</span>
          <input name="outputCount" type="number" min={0} step={1} />
        </label>
        <label className="mayda-field">
          <span>Median approval (min)</span>
          <input name="approvalLatencyMinutes" type="number" min={0} step={1} />
        </label>
        <label className="mayda-field">
          <span>Source coverage %</span>
          <input name="sourceCoveragePct" type="number" min={0} max={100} step={0.1} />
        </label>
        <label className="mayda-field">
          <span>Cost USD</span>
          <input name="costUsd" type="number" min={0} step={0.01} />
        </label>
      </div>
      <label className="mayda-field">
        <span>Body (client-visible)</span>
        <textarea name="body" rows={3} maxLength={8000} />
      </label>
      <label className="mayda-checkbox">
        <input type="checkbox" name="published" defaultChecked />
        <span>Published (visible to the client)</span>
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="mayda-button mayda-button-small" disabled={pending}>
          Add update
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function DeleteUpdateButton({ updateId }: { updateId: string }) {
  const [, dispatch, pending] = useActionState(deletePilotUpdateAction, IDLE);
  return (
    <form action={dispatch}>
      <input type="hidden" name="updateId" value={updateId} />
      <button
        type="submit"
        className="mayda-status is-muted"
        style={{ cursor: "pointer", background: "none" }}
        disabled={pending}
      >
        Delete
      </button>
    </form>
  );
}
