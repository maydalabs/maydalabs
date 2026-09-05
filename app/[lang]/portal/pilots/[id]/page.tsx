import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PilotContent } from "@/components/PilotContent";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale } from "@/lib/localePage";
import { PORTAL_COPY } from "@/components/portalCopy";

export const metadata: Metadata = { title: "Your pilot · MaydaLabs", robots: { index: false, follow: false } };
export default async function PilotDetailPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const locale = await getPageLocale(params);
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const claims = await getVerifiedClaims();
  if (!claims?.sub) redirect(localizePath(`/auth/sign-in?next=/portal/pilots/${id}`, locale));
  return <div className="mayda-shell mayda-section mayda-stack-lg" style={{ maxWidth: "64rem" }}>
    <Link className="mayda-text-link" href={localizePath("/portal", locale)}>← {PORTAL_COPY[locale].heading}</Link>
    <PilotContent locale={locale} userId={claims.sub} pilotId={id} />
  </div>;
}
