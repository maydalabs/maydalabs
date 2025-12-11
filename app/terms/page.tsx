import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms – Mayda Labs",
  description:
    "Basic terms for using the Mayda Labs site and engaging with Mayda Labs as a growth partner.",
};

export default function TermsPage() {
  return (
    <div className="space-y-12 md:space-y-16">
      {/* Intro */}
      <header>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            TERMS
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Terms
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Basic terms for using the site and engaging with Mayda Labs as a
            growth partner.
          </p>
          <p className="max-w-2xl text-xs text-muted sm:text-sm">
            This placeholder will be replaced with a proper terms document. The
            aim is to keep things simple, fair, and readable – not a 20-page
            wall of legal boilerplate.
          </p>
        </div>
      </header>

      {/* High-level bullets */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="rounded-2xl border border-border bg-surface/85 p-5 sm:p-6">
            <ul className="ml-4 list-disc space-y-2 text-sm text-muted">
              <li>How information on the site can and can&apos;t be used.</li>
              <li>Scope of responsibility around advice and content.</li>
              <li>High-level engagement expectations for client work.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
