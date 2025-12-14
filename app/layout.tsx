import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { AnnouncementStrip } from "../components/AnnouncementStrip";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "MaydaLabs – Growth partner for digital-first brands",
  description:
    "MaydaLabs helps digital brands, SaaS, and service firms turn underperforming traffic into meetings, clients, and revenue with clean tracking, focused CRO sprints, and lifecycle systems.",
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
            <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:max-w-7xl lg:px-8">
              {children}
            </div>
          </main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
