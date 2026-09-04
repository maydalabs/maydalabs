"use client";

import { useActionState } from "react";
import { saveOsWorkflowAction, type OsWorkflowFormState } from "@/app/actions/os";
import { asStandingSources, standingSourcesToText, type OsWorkflow } from "@/lib/os";

/* Installing a workflow, which is the operator's core move: a pilot is a
 * workflow installed by hand, and the product is the same thing self-serve
 * later. English-only internal surface. */

const IDLE: OsWorkflowFormState = { status: "idle" };

export function OsWorkflowForm({
  workflow,
  ownerEmail,
}: {
  workflow?: OsWorkflow & { active?: boolean };
  ownerEmail?: string;
}) {
  const [state, dispatch, pending] = useActionState(saveOsWorkflowAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem" }}>
      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Key (lowercase, no spaces)</span>
          <input name="key" required maxLength={60} defaultValue={workflow?.key ?? ""} placeholder="weekly_market_note" readOnly={Boolean(workflow)} />
        </label>
        <label className="mayda-field">
          <span>Name (the client sees this)</span>
          <input name="name" required maxLength={120} defaultValue={workflow?.name ?? ""} placeholder="Weekly market note" />
        </label>
      </div>

      <label className="mayda-field">
        <span>Purpose (one line, the client sees this)</span>
        <input name="purpose" required maxLength={300} defaultValue={workflow?.purpose ?? ""} placeholder="Turn this week's reading into a note the founder can act on." />
      </label>

      <label className="mayda-field">
        <span>Brief — the instruction the system follows. This is the workflow.</span>
        <textarea name="brief" required rows={4} maxLength={4000} defaultValue={workflow?.brief ?? ""} placeholder="a short internal note, 120 to 180 words, plain sentences, no headings. Lead with the single most useful fact." />
      </label>

      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Shape (recorded on each run)</span>
          <select name="shape" defaultValue={workflow?.shape ?? "note"}>
            <option value="note">note</option>
            <option value="post">post</option>
            <option value="summary">summary</option>
          </select>
        </label>
        <label className="mayda-field">
          <span>Max sources</span>
          <input name="maxSources" type="number" min="1" max="5" defaultValue={workflow?.max_sources ?? 5} />
        </label>
      </div>

      <label className="mayda-field">
        <span>Sources it always reads — one per line, prefix a feed with &quot;feed&quot;</span>
        <textarea
          name="standingSources"
          rows={3}
          spellCheck={false}
          defaultValue={standingSourcesToText(asStandingSources(workflow?.standing_sources))}
          placeholder={"feed https://example.com/rss.xml\nhttps://example.org/page"}
        />
      </label>

      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>Feed window (days)</span>
          <input name="windowDays" type="number" min="1" max="90" defaultValue={workflow?.window_days ?? 7} />
        </label>
        <label className="mayda-field">
          <span>Destination (where it is meant to go)</span>
          <input name="destination" maxLength={200} defaultValue={workflow?.destination ?? ""} placeholder="LinkedIn, or the founder's inbox" />
        </label>
        <label className="mayda-field">
          <span>Installed for (client email — blank means everyone)</span>
          <input name="clientEmail" type="email" defaultValue={ownerEmail ?? ""} placeholder="founder@client.com" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={workflow?.active ?? true} /> Active
      </label>

      <div className="mayda-hero-actions" style={{ gap: "0.6rem" }}>
        <button type="submit" className="mayda-button" disabled={pending}>
          {pending ? "Saving..." : workflow ? "Save workflow" : "Install workflow"}
        </button>
        {state.status === "saved" ? <span className="mayda-status is-active" role="status">Saved</span> : null}
        {state.status === "error" ? (
          <span className="mayda-field-error" role="alert">
            {state.code === "unknown_client"
              ? "No account with that email yet. They must sign in once first."
              : state.code === "not_authorized"
                ? "Not authorized."
                : state.code === "invalid"
                  ? `Invalid input${state.field ? ` (${state.field})` : ""}.`
                  : "Save failed."}
          </span>
        ) : null}
      </div>
    </form>
  );
}
