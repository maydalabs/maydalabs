import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

/* The marketing site and the account pages: everything that is a page you
 * read, with the site's own navigation around it. MaydaOS deliberately does
 * not live here — see (os). */
export default async function SiteLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      <SiteHeader locale={lang} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter locale={lang} />
    </>
  );
}
