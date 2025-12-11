import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter – Notes on growth and lifecycle",
  description:
    "Mayda Labs’ occasional newsletter with tactical notes on funnels, tracking, CRO, and lifecycle for digital brands, SaaS, and service firms.",
};

export default function NewsletterPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Intro */}
      <section>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            NEWSLETTER · MAYDA LABS
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Occasional notes on growth and lifecycle.
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Tactical notes on fixing funnels, tracking, and lifecycle without
            drowning in frameworks or generic “growth hacks”.
          </p>
          <p className="max-w-2xl text-xs text-muted sm:text-sm">
            This page will eventually plug into your email tool and host the
            archive. For now, treat it as the home for the footer subscribe form
            and a simple promise of what you&apos;ll get.
          </p>
        </div>
      </section>

      {/* What you'll get */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="rounded-2xl border border-border bg-surface/85 p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              WHAT TO EXPECT
            </p>
            <ul className="ml-4 list-disc space-y-2 text-sm text-muted">
              <li>
                No weekly “content calendar” pressure – only when there&apos;s
                something useful.
              </li>
              <li>Examples pulled from real projects (anonymised).</li>
              <li>Focus on digital brands, SaaS, and service firms.</li>
            </ul>
            <p className="mt-4 text-xs text-muted">
              You can subscribe via the form in the footer for now. As the list
              and archive grow, this page will house past issues and featured
              breakdowns.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
