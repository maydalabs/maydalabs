import { WorkItemDecision } from "@/components/CofounderPanels";
import {
  completeWorkItemAction,
  decideWorkItemAction,
  dismissWorkItemAction,
} from "@/app/actions/cofounder";
import { OS_COFOUNDER_COPY, OS_DOCUMENT_COPY } from "@/components/osCopy";
import type { Locale } from "@/lib/i18n";

/* What a person can do with a piece of work, from where it stands.
 *
 * Until this, the only moves on the desk were approve and send back, so every
 * item ended its life stranded: approved work sat at `approved` for good,
 * stuck work offered nothing to press, and a note the co-founder filed had no
 * way to be finished or thrown away.
 *
 * Which move is legal is never decided here. Each control names a move; the
 * database's transition map and approval gate say yes or no. All of them are
 * plain form submissions, so they work before any JavaScript arrives.
 */
export function ItemLifecycle({
  locale,
  itemId,
  status,
  requiredAction,
}: {
  locale: Locale;
  itemId: string;
  status: string;
  requiredAction: string | null;
}) {
  const copy = OS_DOCUMENT_COPY[locale];
  if (status === "completed" || status === "canceled") return null;

  const waitingOnPerson = Boolean(requiredAction);

  return (
    <section className="os-doc-section os-doc-decide">
      {status === "review" ? <WorkItemDecision itemId={itemId} copy={OS_COFOUNDER_COPY[locale]} /> : null}

      {/* Approved with an outward act: MaydaOS cannot perform it yet, and
          pretending otherwise would be the one lie this product cannot
          afford. The person does it, then says where it went. */}
      {status === "approved" ? (
        <form action={completeWorkItemAction} className="os-lifecycle">
          <input type="hidden" name="itemId" value={itemId} />
          {waitingOnPerson ? <p className="os-doc-quiet">{copy.manualHint}</p> : null}
          <label className="mayda-field">
            <span>{copy.whereLabel}</span>
            <input name="url" type="url" inputMode="url" maxLength={2000} placeholder="https://" />
          </label>
          <label className="mayda-field">
            <span>{copy.doneNote}</span>
            <input name="note" maxLength={2000} />
          </label>
          <button type="submit" className="mayda-button">{copy.markDone}</button>
        </form>
      ) : null}

      {/* A draft nobody has to approve can simply be finished. One that does
          need approval goes back to review instead — finishing it here would
          be refused by the gate, and a button that is always refused is a
          trap. */}
      {status === "drafted" || status === "pending" || status === "triaged" ? (
        waitingOnPerson ? (
          <form action={decideWorkItemAction} className="os-lifecycle">
            <input type="hidden" name="itemId" value={itemId} />
            <button type="submit" name="decision" value="resubmit" className="mayda-button">
              {copy.resubmit}
            </button>
          </form>
        ) : (
          <form action={completeWorkItemAction} className="os-lifecycle">
            <input type="hidden" name="itemId" value={itemId} />
            <button type="submit" className="mayda-button">{copy.doneDraft}</button>
          </form>
        )
      ) : null}

      {status === "blocked" ? (
        <form action={decideWorkItemAction} className="os-lifecycle">
          <input type="hidden" name="itemId" value={itemId} />
          <button type="submit" name="decision" value="reopen" className="mayda-button">
            {copy.reopen}
          </button>
        </form>
      ) : null}

      {/* Dismissing is always possible and always asks why, quietly. */}
      <form action={dismissWorkItemAction} className="os-lifecycle os-lifecycle-dismiss">
        <input type="hidden" name="itemId" value={itemId} />
        <input name="reason" maxLength={500} placeholder={copy.dismissReason} aria-label={copy.dismissReason} />
        <button type="submit" className="mayda-button mayda-button-outline">{copy.dismiss}</button>
      </form>
    </section>
  );
}
