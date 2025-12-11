import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { AnnouncementStrip } from "../components/AnnouncementStrip";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Mayda Labs – Growth partner for digital-first brands",
  description:
    "Mayda Labs helps digital brands, SaaS, and service firms turn underperforming traffic into meetings, clients, and revenue with clean tracking, focused CRO sprints, and lifecycle systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-foreground antialiased mayda-aurora-bg">
        <div className="flex min-h-screen flex-col overflow-hidden">
          <AnnouncementStrip />
          <SiteHeader />

          <main className="flex-1">
            <div className="px-4 pb-12 pt-8 sm:px-6 lg:px-10">
              {children}
            </div>
          </main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
