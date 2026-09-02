import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../field.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GoogleTagManager } from "@/components/GoogleTagManager";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SITE_URL } from "@/lib/site";
import {
  LOCALES,
  SITE_DESCRIPTIONS,
  type Locale,
  isLocale,
} from "@/lib/i18n";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";

const fieldSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-field-sans",
});

// Display face: opinionated grotesque for headings and the wordmark only.
const fieldDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-field-display",
});

const hasVercelRuntime = process.env.VERCEL === "1";

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
      default: "MaydaLabs — Bitcoin operations company",
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
  themeColor: "#0A0B0F",
};

function getStructuredData(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#company`,
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
          "Bitcoin",
          "BTCPay Server",
          "Bitcoin payments",
          "AI-assisted operations",
          "Workflow automation",
          "Editorial systems",
          "Product engineering",
          "Online marketplaces",
        ],
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/profile#mehmet-e-mayda`,
        name: "Mehmet E. Mayda",
        url: `${SITE_URL}/profile`,
        jobTitle: "Founder and Full-Stack Product Builder",
        worksFor: { "@id": `${SITE_URL}/#company` },
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
      className={`${fieldSans.variable} ${fieldDisplay.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <GoogleTagManager />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SiteHeader locale={lang} />
        <main className="min-h-screen">{children}</main>
        <SiteFooter locale={lang} />
        {hasVercelRuntime ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
        <SiteAnalytics />
      </body>
    </html>
  );
}
