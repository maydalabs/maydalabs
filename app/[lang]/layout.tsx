import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SoundLayer } from "@/components/SoundLayer";
import { GoogleTagManager } from "@/components/GoogleTagManager";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SITE_URL } from "@/lib/site";
import {
  LOCALES,
  SITE_DESCRIPTIONS,
  type Locale,
  isLocale,
} from "@/lib/i18n";
import { Newsreader, Space_Grotesk } from "next/font/google";

const studioSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-studio-sans",
});

const studioSerif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-studio-serif",
});

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const description = SITE_DESCRIPTIONS[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "MaydaLabs — Product & growth studio",
      template: "%s · MaydaLabs",
    },
    description,
    applicationName: "MaydaLabs",
    authors: [
      { name: "Mehmet E. Mayda", url: `${SITE_URL}/profile` },
      { name: "MaydaLabs", url: SITE_URL },
    ],
    creator: "Mehmet E. Mayda",
    publisher: "MaydaLabs",
    category: "technology",
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090909",
};

function getStructuredData(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#studio`,
        name: "MaydaLabs",
        url: SITE_URL,
        description: SITE_DESCRIPTIONS[locale],
        inLanguage: locale,
        email: "info@maydalabs.com",
        areaServed: "Worldwide",
        founder: { "@id": `${SITE_URL}/profile#mehmet-e-mayda` },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Istanbul",
          addressCountry: "TR",
        },
        sameAs: [
          "https://github.com/maydalabs",
          "https://x.com/maydalabs",
          "https://www.linkedin.com/in/mehmet-e-mayda/",
        ],
        knowsAbout: [
          "Product strategy",
          "Web applications",
          "Mobile applications",
          "Online marketplaces",
          "Shopify",
          "Growth systems",
          "Bitcoin products",
        ],
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/profile#mehmet-e-mayda`,
        name: "Mehmet E. Mayda",
        url: `${SITE_URL}/profile`,
        jobTitle: "Founder and Full-Stack Product Builder",
        worksFor: { "@id": `${SITE_URL}/#studio` },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Istanbul",
          addressCountry: "TR",
        },
        sameAs: [
          "https://github.com/maydalabs",
          "https://www.linkedin.com/in/mehmet-e-mayda/",
        ],
        knowsAbout: [
          "Full-stack product engineering",
          "Growth systems",
          "Technical SEO",
          "Analytics",
          "Localization",
          "Bitcoin products",
          "AI-assisted operations",
        ],
      },
    ],
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const structuredData = getStructuredData(lang);

  return (
    <html
      lang={lang}
      className={`${studioSans.variable} ${studioSerif.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <GoogleTagManager />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="flex min-h-screen flex-col">
          <SiteChrome>
            <SiteHeader locale={lang} />
          </SiteChrome>

          <main className="flex-1">{children}</main>

          <SiteChrome>
            <SiteFooter locale={lang} />
          </SiteChrome>
        </div>
        <div className="studio-grain" aria-hidden="true" />
        <SoundLayer />
        <Analytics />
        <SpeedInsights />
        <SiteAnalytics />
      </body>
    </html>
  );
}
