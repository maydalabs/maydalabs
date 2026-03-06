import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { AnnouncementStrip } from "../components/AnnouncementStrip";
import { SiteFooter } from "../components/SiteFooter";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MaydaLabs – Growth partner for digital-first brands",
  description:
    "MaydaLabs helps digital brands, SaaS, and service firms turn underperforming traffic into meetings, clients, and revenue with clean tracking, focused CRO sprints, and lifecycle systems.",
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
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden text-foreground antialiased mayda-aurora-bg">
        <div className="flex min-h-screen flex-col">
          {/* Slim status strip – scrolls away */}
          <AnnouncementStrip />

          {/* Sticky main header */}
          <SiteHeader />

          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-7 lg:max-w-7xl lg:px-8">
              {children}
            </div>
          </main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
