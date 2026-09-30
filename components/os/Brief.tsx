import { OpenApp } from "@/components/os/OpenApp";
import { OpenItem } from "@/components/os/OpenItem";
import { OsClock } from "@/components/os/OsClock";
import { OS_BRIEF_COPY, OS_DOCUMENT_COPY, OS_RECORD_COPY, OS_SHELL_COPY, OS_WORKAPP_COPY } from "@/components/osCopy";
import { countSentence, waitedPhrase, type Brief as BriefModel } from "@/lib/osBrief";
import { needsAPerson } from "@/lib/osWork";
import { fill, type Locale } from "@/lib/i18n";

/* The brief, on the desk itself.
 *
 * Not a window: it has no title bar and cannot be closed, because it is the
 * desk's own surface, the way a date on a lock screen is not an app. Windows
 * open over it. It is set in the co-founder's serif because these are the
 * desk's words, not a form's — and when the co-founder can speak, its own
 * sentence goes in the same place.
 *
 * Order is who is waiting on whom: what is late, who is waiting outside, what
 * waits on a decision, what happened without you, then what stands. A fact
 * is said once; a sentence is added only when it adds one; the brief stops
 * before it becomes the Record.
 */

const MAX_SENTENCES = 5;

export function Brief({ locale, brief, hasCompany, companyName, configured, cofounderName = null }: {
  locale: Locale; brief: BriefModel; hasCompany: boolean; companyName?: string | null; configured?: boolean;
  /* What the company calls it; the brief says the name where it speaks of it. */
  cofounderName?: string | null;
}) {
  const copy = OS_BRIEF_COPY[locale];
  const status = OS_WORKAPP_COPY[locale].status;
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const company = companyName ?? "";
  const knowsForms = cofounderName
    ? {
        none: fill(copy.knows.noneNamed, { name: cofounderName }),
        one: fill(copy.knows.oneNamed, { name: cofounderName }),
        many: fill(copy.knows.manyNamed, { name: cofounderName, company }),
      }
    : { none: copy.knows.none, one: copy.knows.one, many: fill(copy.knows.many, { company }) };

  if (!hasCompany) {
    return (
      <div className="os-brief-inner">
        <p className="os-brief-date"><OsClock locale={locale} form="date" /></p>
        <h1 className="os-brief-headline">{OS_SHELL_COPY[locale].noCompany}</h1>
      </div>
    );
  }

  /* The first day says what the desk is, once, and then never again. */
  if (brief.firstDay) {
    return (
      <div className="os-brief-inner">
        <p className="os-brief-date"><OsClock locale={locale} form="date" /></p>
        <h1 className="os-brief-headline">{fill(copy.firstDay.title, { company })}</h1>
        <div className="os-brief-rest">
          <p>{countSentence(brief.knows, knowsForms)}</p>
          <p>
            {configured === false
              ? cofounderName ? fill(copy.firstDay.hintDormantNamed, { name: cofounderName }) : copy.firstDay.hintDormant
              : cofounderName ? fill(copy.firstDay.hintNamed, { name: cofounderName }) : copy.firstDay.hint}
          </p>
          <p>{configured === false ? copy.firstDay.recordDormant : copy.firstDay.record}</p>
          {/* Once, on the first day, and gone the moment it has a name. */}
          {configured !== false && !cofounderName ? <p>{copy.firstDay.unnamed}</p> : null}
        </div>
      </div>
    );
  }

  /* The headline is the count, which is the one thing a person wants before
   * coffee, split by what is asked when the split is known and mixed. */
  const splitParts = brief.routes
    ? ([["decide", brief.routes.decide], ["finish", brief.routes.finish], ["blocked", brief.routes.blocked]] as const)
        .filter(([, n]) => n > 0)
        .map(([route, n]) => countSentence(n, { none: "", ...copy.split[route] }))
    : [];
  const headline = brief.needCount === 0 && brief.dueCount > 0
    ? countSentence(brief.dueCount, { none: "", one: `${copy.due}: ${brief.due[0]?.title ?? ""}`, many: `${copy.due}: {n}` })
    : countSentence(brief.needCount, copy.needs) + (splitParts.length > 1 ? ` ${splitParts.join(", ")}.` : "");

  /* Sentences after the lists, in tier order, with a budget. */
  const sentences: { key: string; text: string; className?: string }[] = [];
  for (const [index, lead] of brief.leads.entries()) {
    if (index > 0) break;
    const at = lead.company ? fill(copy.leadAt, { company: lead.company }) : "";
    const reply = lead.itemId === null ? "" : lead.dueInDays === null ? copy.leadReply.open : lead.dueInDays < 0 ? copy.leadReply.overdue : lead.dueInDays === 0 ? copy.leadReply.today : copy.leadReply.tomorrow;
    sentences.push({ key: "lead", text: `${countSentence(brief.leadCount, { none: "", one: fill(copy.lead.one, { name: lead.name, at }), many: fill(copy.lead.many, { name: lead.name, at }) })} ${reply}`.trim() });
  }
  if (brief.proposed.count > 0) {
    sentences.push({ key: "proposed", text: countSentence(brief.proposed.count, { none: "", one: fill(copy.proposed.one, { when: copy.proposedWhen }), many: fill(copy.proposed.many, { when: copy.proposedWhen }) }) });
  }
  for (const run of brief.ran) {
    // The view's own count of days; the page never reads its clock.
    sentences.push({ key: `ran-${run.name}-${run.at}`, text: fill(copy.ran[run.status], { name: run.name, when: relative.format(-run.daysAgo, "day") }) });
  }
  /* Nothing is said about changes on a first visit: "nothing has changed
   * since you last looked" would be a lie told by a default. The count is
   * repeated only when it exceeds what the sentences above already named. */
  const itemised = brief.leads.length + brief.ran.length;
  if (brief.changes !== null && (brief.changes === 0 || brief.changes > itemised)) {
    sentences.push({ key: "changes", text: countSentence(brief.changes, copy.changes) });
    if (brief.lastChange && brief.changes > 0) {
      sentences.push({
        key: "last", className: "os-brief-last",
        text: fill(copy.lastChange, {
          who: brief.lastChange.byAPerson ? OS_RECORD_COPY[locale].byYou : OS_RECORD_COPY[locale].bySystem,
          event: OS_RECORD_COPY[locale].events[brief.lastChange.event] ?? brief.lastChange.event,
          title: brief.lastChange.title,
        }),
      });
    }
  }
  const nextLine = !brief.next
    ? copy.nextNone
    : brief.next.paused
      ? fill(copy.nextPaused, { name: brief.next.name })
      : brief.next.dueInHours === null || brief.next.dueInHours < 1
        ? fill(copy.nextSoon, { name: brief.next.name })
        : fill(copy.nextDue, {
            name: brief.next.name,
            when: brief.next.dueInHours < 48 ? relative.format(brief.next.dueInHours, "hour") : relative.format(Math.round(brief.next.dueInHours / 24), "day"),
          });
  sentences.push({ key: "next", text: nextLine });
  if (brief.finishedThisFortnight > 0) sentences.push({ key: "finished", text: countSentence(brief.finishedThisFortnight, copy.finished) });
  /* Standing state, said on a quiet desk: what is in flight and what it
   * knows. The budget below still cuts the brief before it becomes the Record. */
  const quiet = brief.needs.length === 0 && brief.due.length === 0;
  if (quiet && brief.openCount > 0) sentences.unshift({ key: "flight", text: countSentence(brief.openCount, copy.inFlight) });
  if (quiet) sentences.push({ key: "knows", text: countSentence(brief.knows, knowsForms) });

  return (
    <div className="os-brief-inner">
      <p className="os-brief-date"><OsClock locale={locale} form="date" /></p>
      <h1 className="os-brief-headline">{headline}</h1>

      {brief.needs.length > 0 ? (
        <ol className="os-brief-needs">
          {brief.needs.map((need) => (
            <li key={need.id} data-needs={needsAPerson(need.status)}>
              <span className="os-brief-status">
                {need.route === "finish"
                  ? copy.finishAction[need.requiredAction === "send" ? "send" : need.requiredAction === "publish" ? "publish" : "other"]
                  : need.route === "blocked" ? copy.blocked : status[need.status] ?? need.status}
              </span>
              <OpenItem id={need.id} title={need.title} label={OS_DOCUMENT_COPY[locale].open} />
              <span className="os-brief-waited">{waitedPhrase(need.waitingDays, need.updatedAt, locale, { since: copy.waitedSince })}</span>
            </li>
          ))}
          {brief.needCount > brief.needs.length ? (
            <li className="os-brief-more">
              <OpenApp app="needs-you">
                {fill(copy.more, { n: String(brief.needCount - brief.needs.length), app: OS_SHELL_COPY[locale].apps.needsYou })}
              </OpenApp>
            </li>
          ) : null}
        </ol>
      ) : brief.openCount === 0 && brief.leads.length === 0 && brief.proposed.count === 0 && brief.ran.length === 0 ? (
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
                {item.dueInDays < 0 ? countSentence(-item.dueInDays, { none: "", ...copy.overdue }) : item.dueInDays === 0 ? copy.dueToday : copy.dueTomorrow}
              </span>
            </li>
          ))}
          {brief.dueCount > brief.due.length ? (
            <li className="os-brief-more">
              <OpenApp app="work">{fill(copy.more, { n: String(brief.dueCount - brief.due.length), app: OS_WORKAPP_COPY[locale].title })}</OpenApp>
            </li>
          ) : null}
        </ol>
      ) : null}

      <div className="os-brief-rest">
        {sentences.slice(0, MAX_SENTENCES).map((s) => <p key={s.key} className={s.className}>{s.text}</p>)}
      </div>
    </div>
  );
}
