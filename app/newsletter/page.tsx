import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter – Notes on growth and lifecycle",
  description:
    "Mayda Labs’ occasional newsletter with tactical notes on funnels, tracking, CRO, and lifecycle for digital brands, SaaS, and service firms.",
};

export default function NewsletterPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Newsletter
        </h1>
        <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
          Occasional, tactical notes on fixing funnels, tracking, and lifecycle
          without drowning in frameworks.
        </p>
        <p className="max-w-2xl text-xs text-muted sm:text-sm">
          This page will plug into whatever email tool you decide to use. For
          now, treat it as the home for the footer subscribe form and a future
          archive.
        </p>
      </section>

      <section>
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted">
            <li>
              No weekly “content calendar” pressure – only when there&apos;s
              something useful.
            </li>
            <li>Examples pulled from real projects (anonymised).</li>
            <li>Focus on digital brands, SaaS, and service firms.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
