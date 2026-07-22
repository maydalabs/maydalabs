import { notFound } from "next/navigation";
import { type Locale, isLocale } from "@/lib/i18n";

export type LocalePageProps = {
  params: Promise<{ lang: string }>;
};

export async function getPageLocale(params: LocalePageProps["params"]): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}
