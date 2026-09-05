import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOsSession } from "@/lib/osSession";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = { title: "Private workspace", robots: { index: false, follow: false } };

export default async function OsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  await requireOsSession();
  redirect(localizePath("/os/desk", locale));
}
