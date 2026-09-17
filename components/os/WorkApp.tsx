import { addWorkItemAction } from "@/app/actions/cofounder";
import { OpenItem } from "@/components/os/OpenItem";
import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import { OS_DOCUMENT_COPY, OS_WORKAPP_COPY } from "@/components/osCopy";
import { OS_LANES, groupWork, needsAPerson } from "@/lib/osWork";
import type { ItemRecord } from "@/components/os/ItemDocument";
import type { Locale } from "@/lib/i18n";

/* Everything open.
 *
 * The queue is the urgent subset; this is the whole. A note the co-founder
 * filed needs nobody, so it appeared in no queue and could be found only by
 * typing its name into ⌘K — which is nearly the same as losing it.
 *
 * It is also where a person adds their own work. Until this, every item on
 * the desk was made by the co-founder or the worker, and neither runs without
 * a model key — so on the live desk there was no way to have any work at all,
 * and everything built on top of a work item was unreachable in practice.
 *
 * The rows come from the page, which already loads them for the documents:
 * one query feeding two views of the same work, not two queries that could
 * disagree about what is open.
 */
export function WorkApp({ locale, items }: { locale: Locale; items: ItemRecord[] }) {
  const copy = OS_WORKAPP_COPY[locale];
  const openLabel = OS_DOCUMENT_COPY[locale].open;
  const { open, finished } = groupWork(items);
  // Formatting a stored timestamp is pure; reading the clock would not be.
  const when = new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit" });

  const row = (item: ItemRecord) => (
    <li key={item.id} className="os-work-row">
      <span className="os-work-status" data-needs={needsAPerson(item.status)}>
        {copy.status[item.status] ?? item.status}
      </span>
      <OpenItem id={item.id} title={item.title} label={openLabel} />
      <span className="os-work-kind">{item.kind}</span>
      <span className="os-work-when">{when.format(new Date(item.updated_at))}</span>
    </li>
  );

  return (
    <div className="os-work">
      {/* One line: what, and which part of the business. A plain form, so it
          works before any JavaScript arrives. */}
      <form action={addWorkItemAction} className="os-work-add">
        <input
          name="title"
          required
          maxLength={200}
          placeholder={copy.addPlaceholder}
          aria-label={copy.addLabel}
        />
        <select name="lane" defaultValue="ops" aria-label={copy.laneLabel}>
          {OS_LANES.map((lane) => (
            <option key={lane} value={lane}>{lane}</option>
          ))}
        </select>
        <button type="submit" className="mayda-button">{copy.add}</button>
      </form>

      {open.length === 0 && finished.length === 0 ? <OsPaneEmpty>{copy.empty}</OsPaneEmpty> : null}

      {open.map((group) => (
        <section key={group.lane} className="os-work-group">
          <h2 className="os-work-lane">
            <span>{group.lane}</span>
            <span className="os-work-count">
              {group.needsYou > 0 ? copy.needYou(group.needsYou) : group.items.length}
            </span>
          </h2>
          <ul className="os-work-list">{group.items.map(row)}</ul>
        </section>
      ))}

      {finished.length > 0 ? (
        <section className="os-work-group os-work-finished">
          <h2 className="os-work-lane">
            <span>{copy.finished}</span>
            <span className="os-work-count">{finished.length}</span>
          </h2>
          <ul className="os-work-list">{finished.map(row)}</ul>
        </section>
      ) : null}
    </div>
  );
}
