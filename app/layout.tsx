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
      <body>
        <div className="site">
          <AnnouncementStrip />
          <SiteHeader />
          <div className="site-inner">
            <main className="site-main">{children}</main>
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
