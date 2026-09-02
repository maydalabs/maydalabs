import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PILOT_COPY } from "@/components/pilotCopy";
import { PilotSummary } from "@/components/PilotView";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: { title: "Your pilot", socialTitle: "Your pilot · MaydaLabs", description: "Pilot status, timeline, and reports." },
  tr: { title: "Pilotunuz", socialTitle: "Pilotunuz · MaydaLabs", description: "Pilot durumu, zaman çizelgesi ve raporlar." },
  fr: { title: "Votre pilote", socialTitle: "Votre pilote · MaydaLabs", description: "Statut, calendrier et rapports du pilote." },
} as const;

type PageProps = LocalePageProps & { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...META[locale], path: "/portal", locale, socialCard: "portal" });
}

export default async function PilotDetailPage({ params }: PageProps) {
  const locale = await getPageLocale(params);
  const { id } = await params;
  const copy = PILOT_COPY[locale];

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  // RLS: clients only ever see their own pilot and its published updates.
  const supabase = await createSupabaseServerClient();
  const [{ data: pilot }, { data: updates }] = await Promise.all([
    supabase
      .from("pilots")
      .select("id, company, workflow, offer, status, starts_on, ends_on, summary, next_step")
      .eq("id", id)
      .eq("client_user_id", claims.sub)
      .maybeSingle(),
    supabase
      .from("pilot_updates")
      .select("id, kind, title, body, period_label, output_count, approval_latency_minutes, source_coverage_pct, cost_usd, created_at")
      .eq("pilot_id", id)
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);
  if (!pilot) notFound();

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "50rem" }}>
      <div className="mayda-stack-lg">
        <Link href={localizePath("/portal", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
          ← {copy.back}
        </Link>
        <h1 className="mayda-heading">{copy.sectionHeading}</h1>
        <PilotSummary pilot={pilot} updates={updates ?? []} locale={locale} />
      </div>
    </div>
  );
}
