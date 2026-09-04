import type { Metadata } from "next";
import { OsRunCard, type OsRunRecord } from "@/components/OsRunCard";
import { OsRunForm } from "@/components/OsRunForm";
import { OS_DESK_COPY } from "@/components/osCopy";
import { OS_EXAMPLE_LABEL, OS_EXAMPLE_NOTE, osExampleRun } from "@/components/osExample";
import { OsShell } from "@/components/os/OsShell";
import { isOsConfigured } from "@/lib/osDraft";
import { isOsAllowed } from "@/lib/osAccess";
import { requireOsSession } from "@/lib/osSession";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "MaydaOS · Desk",
  robots: { index: false, follow: false },
};

export default async function OsDeskPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = OS_DESK_COPY[locale];
  const { claims, supabase, credits } = await requireOsSession(locale, "desk");
  const allowed = isOsAllowed(claims.email);

  const { data: runs } = await supabase
    .from("os_runs")
    .select("id, shape, topic, sources, status, draft, claims, decision, decision_note, error, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = (runs ?? []) as OsRunRecord[];
  const pending = rows.filter((run) => run.status === "drafted" && run.decision === "pending");
  const rest = rows.filter((run) => !pending.includes(run));

  return (
    <OsShell locale={locale} app="desk" credits={credits}>
      <div className="mayda-stack-lg">
        <section className="mayda-stack" style={{ gap: "0.8rem" }}>
          <h2 className="mayda-subheading" style={{ margin: 0 }}>{copy.heading}</h2>
          {!isOsConfigured() ? (
            <p className="mayda-body">The beta is not open yet. Nothing here will run.</p>
          ) : !allowed ? (
            <p className="mayda-body">
              The beta is invite-only while it finds its feet. Ask for a seat and you can run it here.
            </p>
          ) : (
            credits.left > 0 ? (
              <OsRunForm copy={copy} disabled={false} />
            ) : (
              <p className="mayda-body">{copy.outOfHeading} {copy.outOfBody}</p>
            )
          )}
        </section>

        {pending.length > 0 ? (
          <section className="mayda-stack" style={{ gap: "1rem" }}>
            <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.decisions.pending}</h3>
            {pending.map((run) => <OsRunCard key={run.id} run={run} copy={copy} />)}
          </section>
        ) : null}

        <section className="mayda-stack" style={{ gap: "1rem" }}>
          <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.runsHeading}</h3>
          {rows.length === 0 ? (
            <>
              <p className="mayda-body">{copy.empty}</p>
              <p className="mayda-note" style={{ margin: 0 }}>{OS_EXAMPLE_NOTE[locale]}</p>
              <OsRunCard run={osExampleRun(locale)} copy={copy} exampleLabel={OS_EXAMPLE_LABEL[locale]} />
            </>
          ) : (
            rest.map((run) => <OsRunCard key={run.id} run={run} copy={copy} />)
          )}
        </section>
      </div>
    </OsShell>
  );
}
