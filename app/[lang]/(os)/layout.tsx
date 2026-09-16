import { Source_Serif_4 } from "next/font/google";
import "../../os.css";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

/* A serif, loaded only here.
 *
 * The desk sets everything the co-founder wrote in a serif and everything the
 * interface says in sans, so you can see which is which before reading a
 * word. The marketing site has no use for it and does not pay for it. */
const osSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-os-serif",
  display: "swap",
});

/* MaydaOS owns the viewport.
 *
 * No header, no footer, no <main> — those belong to the marketing site, and a
 * desktop with a navigation bar above it is a web page with ambitions. This
 * is why the locale tree was split into (site) and (os): the difference
 * between them is not styling, it is what the page is.
 */
export default async function OsLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <div className={osSerif.variable} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
