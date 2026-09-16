import "../../os.css";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

/* MaydaOS owns the viewport.
 *
 * No header, no footer, no <main> — those belong to the marketing site, and
 * a desktop with a navigation bar above it is a web page with ambitions.
 * This is why the locale tree was split into (site) and (os): the difference
 * between them is not styling, it is what the page is.
 */
export default async function OsLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return children;
}
