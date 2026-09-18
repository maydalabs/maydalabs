import { OpenApp } from "@/components/os/OpenApp";
import { OpenItem } from "@/components/os/OpenItem";
import { OsClock } from "@/components/os/OsClock";
import { OS_BRIEF_COPY, OS_DOCUMENT_COPY, OS_RECORD_COPY, OS_SHELL_COPY, OS_WORKAPP_COPY } from "@/components/osCopy";
import { countSentence, type Brief as BriefModel } from "@/lib/osBrief";
import { needsAPerson } from "@/lib/osWork";
import type { Locale } from "@/lib/i18n";

/* The brief, on the desk itself.
 *
 * Not a window: it has no title bar and cannot be closed, because it is the
 * desk's own surface, the way a date on a lock screen is not an app. Windows
 * open over it. It is set in the co-founder's serif because these are the
 * desk's words, not a form's — and when the co-founder can speak, its own
 * sentence goes in the same place.
 */
export function Brief({ locale, brief, hasCompany }: { locale: Locale; brief: BriefModel; hasCompany: boolean }) {
  const copy = OS_BRIEF_COPY[locale];
  const status = OS_WORKAPP_COPY[locale].status;
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const nextLine = !brief.next
    ? copy.nextNone
    : brief.next.paused
      ? copy.nextPaused.replace("{name}", brief.next.name)
      : brief.next.dueInHours === null || brief.next.dueInHours < 1
        ? copy.nextSoon.replace("{name}", brief.next.name)
        : copy.nextDue
            .replace("{name}", brief.next.name)
            .replace(
              "{when}",
              brief.next.dueInHours < 48
                ? relative.format(brief.next.dueInHours, "hour")
                : relative.format(Math.round(brief.next.dueInHours / 24), "day"),
            );

  const lastLine =
    brief.lastChange &&
    copy.lastChange
      .replace("{who}", brief.lastChange.byAPerson ? OS_RECORD_COPY[locale].byYou : OS_RECORD_COPY[locale].bySystem)
      .replace("{event}", OS_RECORD_COPY[locale].events[brief.lastChange.event] ?? brief.lastChange.event)
      .replace("{title}", brief.lastChange.title);

  return (
    <div className="os-brief-inner">
      <p className="os-brief-date">
        <OsClock locale={locale} form="date" />
      </p>

      {/* The headline is the count, which is the one thing a person wants
          before coffee. Everything under it is why. */}
      <h1 className="os-brief-headline">{hasCompany ? countSentence(brief.needCount, copy.needs) : OS_SHELL_COPY[locale].noCompany}</h1>

      {brief.needs.length > 0 ? (
        <ol className="os-brief-needs">
          {brief.needs.map((need) => (
            <li key={need.id} data-needs={needsAPerson(need.status)}>
              <span className="os-brief-status">{status[need.status] ?? need.status}</span>
              <OpenItem id={need.id} title={need.title} label={OS_DOCUMENT_COPY[locale].open} />
              <span className="os-brief-waited">{relative.format(-need.waitingDays, "day")}</span>
            </li>
          ))}
          {brief.needCount > brief.needs.length ? (
            <li className="os-brief-more">
              <OpenApp app="needs-you">
                {copy.more
                  .replace("{n}", String(brief.needCount - brief.needs.length))
                  .replace("{app}", OS_SHELL_COPY[locale].apps.needsYou)}
              </OpenApp>
            </li>
          ) : null}
        </ol>
      ) : hasCompany && brief.due.length === 0 ? (
        <p className="os-brief-hint">{copy.emptyHint}</p>
      ) : null}

      {/* Dated work whose day has come. It sits under the queue in the same
          shape, because it is the same kind of fact: this needs a person, and
          here is why. */}
      {brief.due.length > 0 ? (
        <ol className="os-brief-needs">
          {brief.due.map((item) => (
            <li key={item.id} data-needs={item.dueInDays <= 0}>
              <span className="os-brief-status">{copy.due}</span>
              <OpenItem id={item.id} title={item.title} label={OS_DOCUMENT_COPY[locale].open} />
              <span className="os-brief-waited">
                {item.dueInDays < 0
                  ? countSentence(-item.dueInDays, { none: "", ...copy.overdue })
                  : item.dueInDays === 0
                    ? copy.dueToday
                    : copy.dueTomorrow}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {hasCompany ? (
        <div className="os-brief-rest">
          {/* Nothing is said about changes on a first visit: "nothing has
              changed since you last looked" would be a lie told by a default. */}
          {brief.changes !== null ? <p>{countSentence(brief.changes, copy.changes)}</p> : null}
          {lastLine ? <p className="os-brief-last">{lastLine}</p> : null}
          <p>{nextLine}</p>
          <p>{countSentence(brief.finishedThisFortnight, copy.finished)}</p>
        </div>
      ) : null}
    </div>
  );
}
