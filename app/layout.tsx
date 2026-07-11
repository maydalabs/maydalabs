import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SITE_URL } from "@/lib/site";
import { Newsreader, Space_Grotesk } from "next/font/google";

const SITE_DESCRIPTION =
  "MaydaLabs builds apps, marketplaces, commerce experiences, and growth systems for ambitious founders.";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MaydaLabs — Product & growth studio",
    template: "%s · MaydaLabs",
  },
  description: SITE_DESCRIPTION,
  applicationName: "MaydaLabs",
  authors: [{ name: "MaydaLabs", url: SITE_URL }],
  creator: "MaydaLabs",
  publisher: "MaydaLabs",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MaydaLabs",
    url: SITE_URL,
    title: "MaydaLabs — Product & growth studio",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "MaydaLabs — Product & growth studio",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090909",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "MaydaLabs",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  email: "info@maydalabs.com",
  areaServed: "Worldwide",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Istanbul",
    addressCountry: "TR",
  },
  sameAs: ["https://www.linkedin.com/in/mehmet-e-mayda/"],
  knowsAbout: [
    "Product strategy",
    "Web applications",
    "Mobile applications",
    "Online marketplaces",
    "Shopify",
    "Growth systems",
    "Bitcoin products",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${studioSans.variable} ${studioSerif.variable}`}>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />

          <main className="flex-1">{children}</main>

          <SiteFooter />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
