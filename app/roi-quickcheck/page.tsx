import type { Metadata } from "next";
import Link from "next/link";
import { RoiQuickcheckSection } from "@/components/RoiQuickcheck";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "Advanced ROI Quickcheck – Mayda Labs",
  description:
    "Plug in your numbers, estimate monthly and yearly upside, and get a realistic recommendation between Baseline Scan, Momentum Sprint, and Growth Loop.",
};

export default function AdvancedRoiPage() {
  return (
    <div className="mayda-page-stack">
      <RoiQuickcheckSection
        kicker="Advanced ROI quickcheck"
        heading="Advanced ROI Quickcheck"
        subheading="Directional, back-of-the-envelope math to estimate the upside from better conversion or close rate."
        primaryCtaHref={getIntroCallUrl("roi")}
        advancedHref="/roi-quickcheck"
        prefillFromSearch
        showPrefillSourceNote
        showAdvancedLinkButton={false}
      />

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface-card p-5 shadow-[0_18px_45px_rgba(2,6,23,0.52)] sm:p-6 lg:max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Want to compare recommendations and scope details before booking?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
              >
                View programs
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
