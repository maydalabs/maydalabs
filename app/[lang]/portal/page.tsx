import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountContent } from "@/components/AccountContent";
import { PilotContent } from "@/components/PilotContent";
import { WorkContent } from "@/components/WorkContent";
import { getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { PORTAL_COPY } from "@/components/portalCopy";

export const metadata: Metadata = { title: "Your account · MaydaLabs", robots: { index: false, follow: false } };

/* One signed-in surface for a client.
 *
 * Work first when there is any: the question a client opens this page with is
 * "what needs me now", and the answer must not be below their invoices. A
 * client with no workflow installed sees the page exactly as before, because
 * the work section renders nothing at all for them.
 */
export default async function PortalPage(props: LocalePageProps) {
  const locale = await getPageLocale(props.params);
  const claims = await getVerifiedClaims();
  if (!claims?.sub) redirect(localizePath("/auth/sign-in", locale));
  return <div className="mayda-shell mayda-section mayda-stack-lg" style={{ maxWidth: "64rem" }}>
    <h1 className="mayda-heading">{PORTAL_COPY[locale].heading}</h1>
    <WorkContent locale={locale} />
    <PilotContent locale={locale} userId={claims.sub} />
    <AccountContent locale={locale} userId={claims.sub} email={typeof claims.email === "string" ? claims.email : null} />
  </div>;
}
