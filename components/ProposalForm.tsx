"use client";

import { useActionState } from "react";
import { deletePilotProposalAction, upsertPilotProposalAction, type PilotFormState } from "@/app/actions/pilots";
import { PROPOSAL_ORIGINS } from "@/lib/pilots";
import type { ProposalRecord } from "@/components/ProposalView";
import { asObservations, asScope } from "@/components/ProposalView";

/* Operator form for the "prepared for you" proposal. English only. */

const IDLE: PilotFormState = { status: "idle" };

function Status({ state }: { state: PilotFormState }) {
  if (state.status === "saved") return <span className="mayda-status is-active" role="status">Saved</span>;
  if (state.status === "error") {
    return (
      <span className="mayda-field-error" role="alert">
        {state.code === "not_authorized" ? "Not authorized." : state.code === "invalid" ? `Invalid input${state.field ? ` (${state.field})` : ""}.` : "Save failed."}
      </span>
    );
  }
  return null;
}

export function ProposalForm({ pilotId, proposal }: { pilotId: string; proposal: ProposalRecord | null }) {
  const [state, dispatch, pending] = useActionState(upsertPilotProposalAction, IDLE);
  const observations = proposal ? asObservations(proposal.observations) : [];
  const scope = proposal ? asScope(proposal.scope) : [];

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.8rem" }}>
      <input type="hidden" name="pilotId" value={pilotId} />
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Headline (client-visible)</span>
          <input name="headline" required maxLength={200} defaultValue={proposal?.headline ?? ""} placeholder="e.g. A weekly market note for Acme, run by the gate" />
        </label>
        <label className="mayda-field">
          <span>Origin</span>
          <select name="origin" defaultValue={proposal?.origin ?? "outreach"}>
            {PROPOSAL_ORIGINS.map((origin) => (
              <option key={origin} value={origin}>{origin}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mayda-field">
        <span>Why I reached out (first person, in Mehmet&apos;s words; blank line = paragraph)</span>
        <textarea name="angle" rows={4} required maxLength={2000} defaultValue={proposal?.angle ?? ""} />
      </label>
      <label className="mayda-field">
        <span>What we noticed — one per line: <code>observation | https://source | Source label</code></span>
        <textarea
          name="observations"
          rows={4}
          maxLength={6000}
          defaultValue={observations.map((o) => [o.text, o.source_url ?? "", o.source_label ?? ""].filter((v, i) => i === 0 || v).join(" | ")).join("\n")}
          placeholder={"Their newsletter went out 3 times in August, then stopped | https://... | Newsletter archive"}
        />
      </label>
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Sample title</span>
          <input name="sampleTitle" maxLength={200} defaultValue={proposal?.sample_title ?? ""} placeholder="e.g. Market note · week of 1 Sep" />
        </label>
        <label className="mayda-field">
          <span>How the sample was made (sources, date)</span>
          <input name="sampleNote" maxLength={600} defaultValue={proposal?.sample_note ?? ""} placeholder="Drafted 3 Sep from 4 public sources; unreviewed by Acme" />
        </label>
      </div>
      <label className="mayda-field">
        <span>Sample body (## heading, - bullets, **bold**, blank line = paragraph)</span>
        <textarea name="sampleBody" rows={10} maxLength={12000} defaultValue={proposal?.sample_body ?? ""} />
      </label>
      <label className="mayda-field">
        <span>Scope — one per line: <code>Week 1 | Title | Detail</code></span>
        <textarea
          name="scope"
          rows={4}
          maxLength={4000}
          defaultValue={scope.map((s) => [s.label, s.title, s.detail ?? ""].join(" | ")).join("\n")}
          placeholder={"Week 1 | Scope and install | One workflow, your accounts, your approver\nWeeks 2–3 | Operate daily | AI drafts, you approve in minutes\nWeek 4 | Report | Volume, approval latency, source coverage, cost"}
        />
      </label>
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Role title (job_application only)</span>
          <input name="roleTitle" maxLength={200} defaultValue={proposal?.role_title ?? ""} />
        </label>
        <label className="mayda-field">
          <span>Terms (price, duration, what they keep)</span>
          <input name="terms" maxLength={2000} defaultValue={proposal?.terms ?? ""} placeholder="Pilot from $2,500 fixed, 3–4 weeks; then from $1,000/month or keep the system" />
        </label>
      </div>
      <label className="mayda-field">
        <span>The role, and the alternative (job_application only; rich text)</span>
        <textarea name="roleNote" rows={4} maxLength={4000} defaultValue={proposal?.role_note ?? ""} />
      </label>
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>CTA label</span>
          <input name="ctaLabel" maxLength={80} defaultValue={proposal?.cta_label ?? ""} placeholder="Book a 20-minute call" />
        </label>
        <label className="mayda-field">
          <span>CTA link (https:// or mailto:)</span>
          <input name="ctaUrl" maxLength={500} defaultValue={proposal?.cta_url ?? ""} placeholder="mailto:info@maydalabs.com?subject=Pilot" />
        </label>
      </div>
      <label className="mayda-checkbox">
        <input type="checkbox" name="published" defaultChecked={proposal?.published ?? false} />
        <span>Published (visible to the client once they sign in with the pilot&apos;s email)</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="mayda-button mayda-button-small" disabled={pending}>
          {proposal ? "Save proposal" : "Create proposal"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function DeleteProposalButton({ proposalId }: { proposalId: string }) {
  const [state, dispatch, pending] = useActionState(deletePilotProposalAction, IDLE);
  return (
    <form action={dispatch} className="flex items-center gap-2">
      <input type="hidden" name="proposalId" value={proposalId} />
      <button type="submit" className="mayda-text-link" disabled={pending} style={{ color: "var(--error)" }}>
        Delete proposal
      </button>
      <Status state={state} />
    </form>
  );
}
