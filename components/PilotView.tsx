import Link from "next/link";
import { PILOT_COPY, PILOT_STEPS, type PilotStatus } from "@/components/pilotCopy";
import { localizePath, type Locale } from "@/lib/i18n";

/* Client-facing pilot rendering shared by the portal overview and detail. */

export type PilotRecord = {
  id: string;
  company: string;
  workflow: string;
  offer: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  summary: string | null;
  next_step: string | null;
};

export type PilotUpdateRecord = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  period_label: string | null;
  output_count: number | null;
  approval_latency_minutes: number | null;
  source_coverage_pct: number | null;
  cost_usd: number | null;
  created_at: string;
};

export function PilotStepper({ status, locale }: { status: string; locale: Locale }) {
  const copy = PILOT_COPY[locale];
  const currentIndex = PILOT_STEPS.indexOf(status as PilotStatus);
  return (
    <ol className="mayda-stepper" aria-label={copy.timelineLabel}>
      {PILOT_STEPS.map((step, index) => (
        <li
          key={step}
          className={index < currentIndex ? "is-done" : index === currentIndex ? "is-current" : ""}
          aria-current={index === currentIndex ? "step" : undefined}
        >
          {copy.statuses[step]}
        </li>
      ))}
    </ol>
  );
}

export function PilotUpdateCard({ update, locale }: { update: PilotUpdateRecord; locale: Locale }) {
  const copy = PILOT_COPY[locale];
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const hasMetrics =
    update.output_count !== null ||
    update.approval_latency_minutes !== null ||
    update.source_coverage_pct !== null ||
    update.cost_usd !== null;

  return (
    <article className="mayda-update">
      <header>
        <h3>
          {update.period_label ? `${update.period_label} · ` : ""}
          {update.title}
        </h3>
        <span className="mayda-mono" style={{ color: "var(--mist)" }}>
          {copy.kinds[update.kind as keyof typeof copy.kinds] ?? update.kind} ·{" "}
          {dateFormat.format(new Date(update.created_at))}
        </span>
      </header>
      {hasMetrics ? (
        <div className="mayda-metrics">
          {update.output_count !== null ? (
            <div className="mayda-metric">
              <strong>{update.output_count}</strong>
              <span>{copy.metrics.output}</span>
            </div>
          ) : null}
          {update.approval_latency_minutes !== null ? (
            <div className="mayda-metric">
              <strong>
                {update.approval_latency_minutes} {copy.metrics.minutes}
              </strong>
              <span>{copy.metrics.latency}</span>
            </div>
          ) : null}
          {update.source_coverage_pct !== null ? (
            <div className="mayda-metric">
              <strong>{Number(update.source_coverage_pct)}%</strong>
              <span>{copy.metrics.coverage}</span>
            </div>
          ) : null}
          {update.cost_usd !== null ? (
            <div className="mayda-metric">
              <strong>${Number(update.cost_usd).toFixed(0)}</strong>
              <span>{copy.metrics.cost}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {update.body ? <p>{update.body}</p> : null}
    </article>
  );
}

export function PilotSummary({
  pilot,
  updates,
  locale,
  compact = false,
}: {
  pilot: PilotRecord;
  updates: PilotUpdateRecord[];
  locale: Locale;
  compact?: boolean;
}) {
  const copy = PILOT_COPY[locale];
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const timeline = [pilot.starts_on, pilot.ends_on]
    .map((value) => (value ? dateFormat.format(new Date(value)) : null))
    .filter(Boolean)
    .join(" → ");

  return (
    <div className="mayda-card mayda-stack" style={{ borderColor: "var(--cobalt-line)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mayda-kicker" style={{ margin: 0 }}>
            {copy.offers[pilot.offer as keyof typeof copy.offers] ?? pilot.offer}
          </p>
          <h3 className="mayda-subheading" style={{ marginTop: "0.4rem" }}>
            {pilot.company} · {pilot.workflow}
          </h3>
        </div>
        <span className={`mayda-status ${pilot.status === "paused" ? "is-muted" : "is-active"}`}>
          {copy.statuses[pilot.status as PilotStatus] ?? pilot.status}
        </span>
      </div>

      {pilot.status === "paused" ? <p className="mayda-map-note">{copy.pausedNote}</p> : <PilotStepper status={pilot.status} locale={locale} />}

      <dl className="mayda-dl">
        {timeline ? (
          <div>
            <dt>{copy.timelineLabel}</dt>
            <dd>{timeline}</dd>
          </div>
        ) : null}
        {pilot.summary ? (
          <div>
            <dt>{copy.summaryLabel}</dt>
            <dd style={{ whiteSpace: "pre-wrap" }}>{pilot.summary}</dd>
          </div>
        ) : null}
        {pilot.next_step ? (
          <div>
            <dt>{copy.nextStepLabel}</dt>
            <dd>{pilot.next_step}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mayda-stack" style={{ gap: "0.6rem" }}>
        <p className="mayda-kicker" style={{ margin: 0 }}>
          {copy.updatesLabel}
        </p>
        {updates.length ? (
          (compact ? updates.slice(0, 2) : updates).map((update) => (
            <PilotUpdateCard key={update.id} update={update} locale={locale} />
          ))
        ) : (
          <p className="mayda-body" style={{ fontSize: "0.9rem" }}>
            {copy.noUpdates}
          </p>
        )}
        {compact ? (
          <Link href={localizePath("/os/pilot", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
            {copy.viewAll} <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
