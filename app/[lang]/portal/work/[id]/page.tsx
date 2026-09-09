import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OsRunCard, type OsRunRecord } from "@/components/OsRunCard";
import { OS_DESK_COPY } from "@/components/osCopy";
import { formatUsd } from "@/lib/os";
import { requireOsSession } from "@/lib/osSession";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = { title: "Your work", robots: { index: false, follow: false } };

const COPY = {
  en: { back: "Everything that happened", cost: "What this run cost" },
  tr: { back: "Olan biten her şey", cost: "Bu çalıştırmanın maliyeti" },
  fr: { back: "Tout ce qui s'est passé", cost: "Ce que cette exécution a coûté" },
} as const;

type PageProps = LocalePageProps & { params: Promise<{ lang: string; id: string }> };

/* One run, in full: the draft, every claim beside its source, what you
 * decided, and where it ended up. */
export default async function PortalRunPage({ params }: PageProps) {
  const locale = await getPageLocale(params);
  const { id } = await params;
  const copy = OS_DESK_COPY[locale];
  const page = COPY[locale];
  const { claims, supabase } = await requireOsSession();

  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { data: run } = await supabase
    .from("os_runs")
    .select("id, shape, topic, sources, status, draft, claims, decision, decision_note, published_url, error, created_at, input_tokens, output_tokens, cost_usd, model, effort")
    .eq("id", id)
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (!run) notFound();

  return (
    <div className="mayda-shell mayda-section mayda-stack-lg" style={{ maxWidth: "64rem" }}>
      <Link href={localizePath("/portal/work", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
        ← {page.back}
      </Link>

      <OsRunCard run={run as OsRunRecord} copy={copy} />

      <dl className="mayda-dl">
        <div>
          <dt>{page.cost}</dt>
          <dd>
            {run.input_tokens} in · {run.output_tokens} out · {formatUsd(Number(run.cost_usd ?? 0))} · {run.model}
            {run.effort ? ` · effort ${run.effort}` : ""}
          </dd>
        </div>
      </dl>
    </div>
  );
}
