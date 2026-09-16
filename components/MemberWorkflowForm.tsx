"use client";

import { useActionState } from "react";
import { saveMemberWorkflowAction, deleteMemberWorkflowAction, type OsWorkflowFormState } from "@/app/actions/os";
import { asStandingSources, standingSourcesToText, type OsWorkflow } from "@/lib/os";
import type { OsDeskCopy, OsWorkflowCopy } from "@/components/osCopy";

const IDLE: OsWorkflowFormState = { status: "idle" };

/* A member's own workflow. Deliberately absent: the key, which is derived
 * from the name; the budget, which only MaydaLabs sets; and the owner, which
 * is always the person filling this in. None of the three is asked for,
 * and none of them would be accepted if the form sent them anyway. */
export function MemberWorkflowForm({
  copy,
  shapes,
  workflow,
  companies = [],
}: {
  copy: OsWorkflowCopy;
  shapes: OsDeskCopy["shapes"];
  workflow?: OsWorkflow & {
    active?: boolean;
    company_id?: string | null;
    cadence?: string | null;
    required_action?: string | null;
  };
  companies?: { id: string; name: string }[];
}) {
  const [state, dispatch, pending] = useActionState(saveMemberWorkflowAction, IDLE);

  return (
    <form action={dispatch} className="mayda-stack" style={{ gap: "0.7rem" }}>
      {workflow ? <input type="hidden" name="workflowId" value={workflow.id} /> : null}

      <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
        <label className="mayda-field">
          <span>{copy.nameLabel}</span>
          <input name="name" required maxLength={120} defaultValue={workflow?.name ?? ""} placeholder={copy.namePlaceholder} />
        </label>
        <label className="mayda-field">
          <span>{copy.shapeLabel}</span>
          <select name="shape" defaultValue={workflow?.shape ?? "note"}>
            <option value="note">{shapes.note}</option>
            <option value="post">{shapes.post}</option>
            <option value="summary">{shapes.summary}</option>
          </select>
        </label>
      </div>

      <label className="mayda-field">
        <span>{copy.purposeLabel}</span>
        <input name="purpose" required maxLength={300} defaultValue={workflow?.purpose ?? ""} placeholder={copy.purposePlaceholder} />
      </label>

      <label className="mayda-field">
        <span>{copy.briefLabel}</span>
        <textarea name="brief" required rows={4} maxLength={4000} defaultValue={workflow?.brief ?? ""} placeholder={copy.briefPlaceholder} />
      </label>

      <label className="mayda-field">
        <span>{copy.sourcesLabel}</span>
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
          <span>{copy.windowLabel}</span>
          <input name="windowDays" type="number" min="1" max="90" defaultValue={workflow?.window_days ?? 7} />
        </label>
        <label className="mayda-field">
          <span>{copy.maxSourcesLabel}</span>
          <input name="maxSources" type="number" min="1" max="5" defaultValue={workflow?.max_sources ?? 5} />
        </label>
        <label className="mayda-field">
          <span>{copy.destinationLabel}</span>
          <input name="destination" maxLength={200} defaultValue={workflow?.destination ?? ""} placeholder={copy.destinationPlaceholder} />
        </label>
      </div>

      {/* The schedule. Filing into a company is what lets the worker pick
          this up at all, so the two controls sit together: choosing a
          cadence without a queue to file into would be a setting that
          quietly does nothing. */}
      {companies.length > 0 ? (
        <div className="mayda-grid-2" style={{ gap: "0.7rem" }}>
          <label className="mayda-field">
            <span>{copy.companyLabel}</span>
            <select name="companyId" defaultValue={workflow?.company_id ?? ""}>
              <option value="">{copy.companyNone}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mayda-field">
            <span>{copy.cadenceLabel}</span>
            <select name="cadence" defaultValue={workflow?.cadence ?? "manual"}>
              <option value="manual">{copy.cadenceManual}</option>
              <option value="daily">{copy.cadenceDaily}</option>
              <option value="weekly">{copy.cadenceWeekly}</option>
            </select>
          </label>
          <label className="mayda-field">
            <span>{copy.requiredActionLabel}</span>
            <input
              name="requiredAction"
              maxLength={60}
              defaultValue={workflow?.required_action ?? ""}
              placeholder={copy.requiredActionPlaceholder}
            />
          </label>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={workflow?.active ?? true} /> {copy.activeLabel}
      </label>

      <div className="mayda-hero-actions" style={{ gap: "0.6rem" }}>
        <button type="submit" className="mayda-button" disabled={pending}>
          {pending ? copy.saving : copy.save}
        </button>
        {state.status === "saved" ? <span className="mayda-status is-active" role="status">{copy.saved}</span> : null}
        {state.status === "error" ? (
          <span className="mayda-field-error" role="alert">
            {state.code === "too_many"
              ? copy.limitReached
              : state.code === "not_authorized"
                ? copy.notYourCompany
                : copy.failed}
          </span>
        ) : null}
      </div>
      {companies.length > 0 ? (
        <p className="mayda-note" style={{ margin: 0 }}>{copy.scheduleNote}</p>
      ) : null}
      <p className="mayda-note" style={{ margin: 0 }}>{copy.budgetNote}</p>
    </form>
  );
}

export function DeleteWorkflowButton({ id, label, confirmText }: { id: string; label: string; confirmText: string }) {
  return (
    <form
      action={deleteMemberWorkflowAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="workflowId" value={id} />
      <button type="submit" className="mayda-status is-muted" style={{ cursor: "pointer", background: "none" }}>
        {label}
      </button>
    </form>
  );
}
