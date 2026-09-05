import type { Metadata } from "next";
import { PilotContent } from "@/components/PilotContent";
import { OsShell } from "@/components/os/OsShell";
import { requireOsSession } from "@/lib/osSession";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = { title: "MaydaOS · pilot", robots: { index: false, follow: false } };
export default async function Page({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const { claims, credits } = await requireOsSession();
  return <OsShell locale={locale} app="pilot" credits={credits}><PilotContent locale={locale} userId={claims.sub} /></OsShell>;
}
