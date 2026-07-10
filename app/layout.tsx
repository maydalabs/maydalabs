import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SITE_URL } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MaydaLabs — Product & growth studio",
    template: "%s · MaydaLabs",
  },
  description:
    "MaydaLabs builds apps, marketplaces, commerce experiences, and growth systems for ambitious founders.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#091017",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${studioSans.variable} ${studioSerif.variable}`}>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />

          <main className="flex-1">{children}</main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
