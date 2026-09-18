import { ItemEditor } from "@/components/os/ItemEditor";
import { ItemLifecycle } from "@/components/os/ItemLifecycle";
import { OS_DOCUMENT_COPY, OS_RECORD_COPY, OS_WORKAPP_COPY } from "@/components/osCopy";
import { needsAPerson } from "@/lib/osWork";
import type { Locale } from "@/lib/i18n";

/* A work item, opened.
 *
 * Until this, the queue showed a title and an Approve button, and the draft —
 * the thing being approved — was nowhere on screen. Approving blind is the
 * one act this product exists to make impossible, and its own queue was
 * asking for it.
 *
 * Everything here is laid out as evidence. The draft is set in the
 * co-founder's serif because it wrote it. Each claim sits beside the source it
 * came from, or says plainly that it came from none. The history says who did
 * what, and a null actor is not missing data — it is the answer. The decision
 * is at the bottom, after all of that, because that is the order a person
 * should meet it in.
 */

export type ItemRecord = {
  id: string;
  title: string;
  lane: string;
  kind: string;
  status: string;
  required_action: string | null;
  notes: string | null;
  sources: unknown;
  artifacts: unknown;
  metadata: unknown;
  updated_at: string;
  due_on: string | null;
  /* From the database's clock, for open work; null for finished work and
   * for anything undated. */
  due_in_days: number | null;
};

export type ItemEvent = {
  event: string;
  actor: string | null;
  at: string;
};

type Source = { url?: string; title?: string; chars?: number };
type Outcome = { kind?: string; url?: string; note?: string; at?: string };

function asOutcomes(value: unknown): Outcome[] {
  return Array.isArray(value)
    ? value.filter((v): v is Outcome => Boolean(v) && typeof v === "object" && (v as Outcome).kind === "outcome")
    : [];
}
type Claim = { text?: string; source_url?: string | null };

function asSources(value: unknown): Source[] {
  return Array.isArray(value) ? value.filter((v): v is Source => Boolean(v) && typeof v === "object") : [];
}

function asClaims(value: unknown): Claim[] {
  const claims = (value as { claims?: unknown } | null)?.claims;
  return Array.isArray(claims) ? claims.filter((v): v is Claim => Boolean(v) && typeof v === "object") : [];
}

function author(value: unknown): string | null {
  const by = (value as { by?: unknown } | null)?.by;
  return typeof by === "string" ? by : null;
}

export function ItemDocument({ locale, item, events }: { locale: Locale; item: ItemRecord; events: ItemEvent[] }) {
  const copy = OS_DOCUMENT_COPY[locale];
  const sources = asSources(item.sources);
  const outcomes = asOutcomes(item.artifacts);
  const over = item.status === "completed" || item.status === "canceled";
  const claims = asClaims(item.metadata);
  const by = author(item.metadata);
  /* The serif means "the co-founder wrote this". Work a person added
   * themselves is theirs, and what arrived from outside is someone else's;
   * both say so in the type. */
  const mine = by === "person";
  const arrived = by === "signal";
  const when = new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const day = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const lanes = OS_WORKAPP_COPY[locale].lanes;
  /* Everything a person wrote is theirs to change until the database draws
   * the line — approved, finished, or already signed for. The editor is not
   * offered past the first two, and the third is the database's to refuse. */
  const editable = !over && item.status !== "approved";

  return (
    <article className="os-doc">
      <header className="os-doc-head">
        <p className="mayda-kicker">
          {lanes[item.lane] ?? item.lane} / {item.kind}
          {by && copy.draftedBy[by] ? ` · ${copy.draftedBy[by]}` : ""}
        </p>
        <h1 className="os-doc-title">{item.title}</h1>
        <p className="os-doc-meta">
          {/* Colour means "this needs a person". Finished or dismissed work
              does not, and must not say it is still waiting on anything — a
              completed reply reading "Waiting on send" is the record
              contradicting itself in its own header. */}
          {/* The same words the Work app uses, so an item is not "New" in one
              window and "pending" in the next — and the same rule for colour:
              it means this needs a person, which a new task does not. */}
          <span className={`mayda-status${needsAPerson(item.status) ? " is-active" : ""}`}>
            {OS_WORKAPP_COPY[locale].status[item.status] ?? item.status}
          </span>
          {item.required_action && !over ? (
            <span className="os-doc-waiting">
              {copy.waitingOn} <code>{item.required_action}</code>
            </span>
          ) : null}
          {item.due_on && !over ? (
            <span className="os-doc-due" data-overdue={item.due_in_days !== null && item.due_in_days < 0}>
              {(item.due_in_days !== null && item.due_in_days < 0 ? copy.overdue : copy.due).replace(
                "{date}",
                day.format(new Date(`${item.due_on}T00:00:00`)),
              )}
            </span>
          ) : null}
        </p>
        {editable ? (
          <ItemEditor
            itemId={item.id}
            title={item.title}
            lane={item.lane}
            notes={item.notes ?? ""}
            dueOn={item.due_on}
            copy={{
              edit: copy.edit,
              editTitle: copy.editTitle,
              editLane: copy.editLane,
              editNote: copy.editNote,
              editDue: copy.editDue,
              save: copy.save,
              cancel: copy.cancel,
              frozen: copy.frozen,
              editFailed: copy.editFailed,
              saved: copy.notices.saved,
              lanes,
            }}
          />
        ) : null}
      </header>

      {/* Where it went comes first on finished work: it is the answer to the
          only question anyone opens a finished item to ask. */}
      {outcomes.length > 0 ? (
        <section className="os-doc-section">
          <h2 className="os-doc-label">{copy.whereItWent}</h2>
          <ul className="os-doc-sources">
            {outcomes.map((outcome, index) => (
              <li key={index}>
                {outcome.url ? (
                  <a href={outcome.url} target="_blank" rel="noopener noreferrer">{outcome.url}</a>
                ) : (
                  <span>{copy.finished}</span>
                )}
                {outcome.note ? <span className="os-doc-chars"> {outcome.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="os-doc-section">
        <h2 className="os-doc-label">{mine ? copy.yourNote : arrived ? copy.arrived : copy.draft}</h2>
        {item.notes?.trim() ? (
          <div className="os-doc-draft" data-voice={mine || arrived ? "person" : "cofounder"}>{item.notes}</div>
        ) : (
          <p className="os-doc-quiet">{copy.nothingWritten}</p>
        )}
      </section>

      {claims.length > 0 ? (
        <section className="os-doc-section">
          <h2 className="os-doc-label">{copy.claims}</h2>
          <ol className="os-doc-claims">
            {claims.map((claim, index) => (
              <li key={index} className="os-doc-claim" data-supported={Boolean(claim.source_url)}>
                <span className="os-doc-claim-text">{claim.text}</span>
                {claim.source_url ? (
                  <a className="os-doc-claim-source" href={claim.source_url} target="_blank" rel="noopener noreferrer">
                    {new URL(claim.source_url).hostname}
                  </a>
                ) : (
                  <span className="os-doc-claim-source">{copy.unsupported}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {sources.length > 0 ? (
        <section className="os-doc-section">
          <h2 className="os-doc-label">{copy.sources}</h2>
          <ul className="os-doc-sources">
            {sources.map((source, index) =>
              source.url ? (
                <li key={index}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title || source.url}
                  </a>
                  {typeof source.chars === "number" ? (
                    <span className="os-doc-chars"> {source.chars.toLocaleString(locale)}</span>
                  ) : null}
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

      <section className="os-doc-section">
        <h2 className="os-doc-label">{copy.history}</h2>
        {events.length === 0 ? (
          <p className="os-doc-quiet">{copy.nothingHappened}</p>
        ) : (
          <ol className="os-record">
            {events.map((event, index) => (
              <li key={index} className="os-record-line">
                <span className="os-record-who" data-person={event.actor !== null}>
                  {event.actor !== null ? copy.byPerson : copy.bySystem}
                </span>
                {/* The record's verbs, so the same act is not "arrived" in
                    one window and "received" in the next. */}
                <span className="os-record-what">
                  {OS_RECORD_COPY[locale].events[event.event] ?? event.event.replace(/_/g, " ")}
                </span>
                <span className="os-record-when">{when.format(new Date(event.at))}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ItemLifecycle
        locale={locale}
        itemId={item.id}
        status={item.status}
        requiredAction={item.required_action}
      />
    </article>
  );
}
