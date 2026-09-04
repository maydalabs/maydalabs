import Link from "next/link";
import { redirect } from "next/navigation";
import { OsRunCard, type OsRunRecord } from "@/components/OsRunCard";
import { OsRunForm } from "@/components/OsRunForm";
import { OS_DESK_COPY, fillCredits } from "@/components/osCopy";
import { OS_EXAMPLE_LABEL, OS_EXAMPLE_NOTE, osExampleRun } from "@/components/osExample";
import { OS_STARTING_CREDITS, creditsLeft } from "@/lib/os";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isOsConfigured } from "@/lib/osDraft";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: { title: "MaydaOS desk", socialTitle: "MaydaOS desk · MaydaLabs", description: "Give it sources. It produces the work. You decide what leaves." },
  tr: { title: "MaydaOS masası", socialTitle: "MaydaOS masası · MaydaLabs", description: "Kaynakları siz verin. İşi o üretsin. Neyin çıkacağına siz karar verin." },
  fr: { title: "Bureau MaydaOS", socialTitle: "Bureau MaydaOS · MaydaLabs", description: "Donnez-lui les sources. Il produit le travail. Vous decidez de ce qui sort." },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return {
    ...createPageMetadata({ ...META[locale], path: "/os/desk", locale, socialCard: "studio" }),
    // A private workspace has nothing to offer a crawler.
    robots: { index: false, follow: false },
  };
}

export default async function OsDeskPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = OS_DESK_COPY[locale];

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in?next=/os/desk", locale));

  const supabase = await createSupabaseServerClient();
  const [{ data: credit }, { data: runs }] = await Promise.all([
    supabase.from("os_credits").select("granted, used").maybeSingle(),
    supabase
      .from("os_runs")
      .select("id, shape, topic, sources, status, draft, claims, decision, decision_note, error, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const granted = credit?.granted ?? OS_STARTING_CREDITS;
  const used = credit?.used ?? 0;
  const left = creditsLeft(granted, used);
  const rows = (runs ?? []) as OsRunRecord[];
  const drafted = rows.filter((run) => run.status === "drafted");
  const approved = drafted.filter((run) => run.decision === "approved");
  const citedSources = new Set(
    drafted.flatMap((run) => (Array.isArray(run.sources) ? (run.sources as { url?: string }[]) : []).map((source) => source?.url).filter(Boolean)),
  );

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "52rem" }}>
      <div className="mayda-stack-lg">
        <header className="mayda-stack">
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-display" style={{ fontSize: "clamp(1.7rem,3.6vw,2.6rem)" }}>{copy.heading}</h1>
          <p className="mayda-os-credits">
            <strong>{fillCredits(copy.creditsLeft, left, granted)}</strong>
            {drafted.length > 0 ? (
              <span>
                {" · "}
                {drafted.length} {copy.recordRuns} · {approved.length} {copy.recordApproved} · {citedSources.size}{" "}
                {copy.recordSources}
              </span>
            ) : null}
          </p>
        </header>

        {!isOsConfigured() ? (
          <section className="mayda-card">
            <p className="mayda-body">The beta is not open yet. Nothing here will run.</p>
          </section>
        ) : left > 0 ? (
          <section className="mayda-card">
            <OsRunForm copy={copy} disabled={false} />
          </section>
        ) : (
          <section className="mayda-card mayda-stack" style={{ gap: "0.7rem" }}>
            <h2 className="mayda-h3">{copy.outOfHeading}</h2>
            <p className="mayda-body">{copy.outOfBody}</p>
            <dl className="mayda-dl">
              <div>
                <dt>{copy.recordHeading}</dt>
                <dd>
                  {drafted.length} {copy.recordRuns} · {approved.length} {copy.recordApproved} · {citedSources.size} {copy.recordSources}
                </dd>
              </div>
            </dl>
            <div className="mayda-hero-actions">
              <Link href={localizePath("/contact", locale)} className="mayda-button">{copy.outOfCta} →</Link>
            </div>
          </section>
        )}

        <section className="mayda-stack" style={{ gap: "1rem" }}>
          <h2 className="mayda-h3">{copy.runsHeading}</h2>
          {rows.length === 0 ? (
            <>
              <p className="mayda-body">{copy.empty}</p>
              <p className="mayda-note" style={{ margin: 0 }}>{OS_EXAMPLE_NOTE[locale]}</p>
              <OsRunCard run={osExampleRun(locale)} copy={copy} exampleLabel={OS_EXAMPLE_LABEL[locale]} />
            </>
          ) : (
            rows.map((run) => <OsRunCard key={run.id} run={run} copy={copy} />)
          )}
        </section>
      </div>
    </div>
  );
}
