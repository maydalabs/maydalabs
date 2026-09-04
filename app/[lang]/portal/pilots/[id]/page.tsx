import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

/* Pilots moved into the MaydaOS Pilot app. */
export default async function PilotDetailPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  redirect(localizePath("/os/pilot", locale));
}
