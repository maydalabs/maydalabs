import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

/* The portal became one app inside MaydaOS. One account surface, not two. */
export default async function PortalPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  redirect(localizePath("/os/account", locale));
}
