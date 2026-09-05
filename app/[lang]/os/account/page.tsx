import type { Metadata } from "next";
import { AccountContent } from "@/components/AccountContent";
import { OsShell } from "@/components/os/OsShell";
import { requireOsSession } from "@/lib/osSession";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = { title: "MaydaOS · account", robots: { index: false, follow: false } };
export default async function Page({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const { claims, credits } = await requireOsSession();
  return <OsShell locale={locale} app="account" credits={credits}><AccountContent locale={locale} userId={claims.sub} email={typeof claims.email === "string" ? claims.email : null} /></OsShell>;
}
