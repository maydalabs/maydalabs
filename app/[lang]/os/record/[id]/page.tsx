import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OsShell } from "@/components/os/OsShell";
import { OsRunCard, type OsRunRecord } from "@/components/OsRunCard";
import { OS_DESK_COPY } from "@/components/osCopy";
import { requireOsSession } from "@/lib/osSession";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "MaydaOS · Record",
  robots: { index: false, follow: false },
};

type PageProps = LocalePageProps & { params: Promise<{ lang: string; id: string }> };

/* One run, in full: the draft, every claim beside its source, what you
 * decided, and where it ended up. */
export default async function OsRunPage({ params }: PageProps) {
  const locale = await getPageLocale(params);
  const { id } = await params;
  const copy = OS_DESK_COPY[locale];
  const { supabase, credits } = await requireOsSession();

  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { data: run } = await supabase
    .from("os_runs")
    .select("id, shape, topic, sources, status, draft, claims, decision, decision_note, published_url, error, created_at, input_tokens, output_tokens, cost_usd, model, effort")
    .eq("id", id)
    .maybeSingle();

  if (!run) notFound();

  return (
    <OsShell locale={locale} app="record" credits={credits}>
      <div className="mayda-stack-lg">
        <Link href={localizePath("/os/record", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
          ← {copy.runsHeading}
        </Link>

        <OsRunCard run={run as OsRunRecord} copy={copy} />

        <dl className="mayda-dl">
          <div>
            <dt>What this run cost</dt>
            <dd>
              {run.input_tokens} in · {run.output_tokens} out · ${Number(run.cost_usd ?? 0).toFixed(4)} · {run.model}
              {run.effort ? ` · effort ${run.effort}` : ""}
            </dd>
          </div>
        </dl>
      </div>
    </OsShell>
  );
}
