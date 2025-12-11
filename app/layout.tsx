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
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <AnnouncementStrip />
          <SiteHeader />
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 md:px-6 md:pt-12">
              {children}
            </div>
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
