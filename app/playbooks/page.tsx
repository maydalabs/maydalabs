import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playbooks – Funnels, tracking, and lifecycle",
  description:
    "Short, practical playbooks from Mayda Labs for fixing common growth problems – tracking sanity checks, funnel tuning, and lifecycle flows.",
};

export default function PlaybooksPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Intro */}
      <section>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            PLAYBOOKS · SYSTEMS, NOT HACKS
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Playbooks for fixing funnels, tracking, and lifecycle.
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Short, practical playbooks for fixing common growth problems – from
            broken tracking to underperforming funnels and lifecycle flows.
          </p>
          <p className="max-w-2xl text-xs text-muted sm:text-sm">
            This section will eventually hold a library of focused playbooks you
            can read, implement, or use as a starting point for a Sprint.
          </p>
        </div>
      </section>

      {/* Playbook themes */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="rounded-2xl border border-border bg-surface/85 p-5 sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              EARLY THEMES
            </p>
            <ul className="ml-4 list-disc space-y-2 text-sm text-muted">
              <li>Tracking sanity check for GA4 and pixels.</li>
              <li>Homepage and offer clarity tuning.</li>
              <li>Cart, checkout, and form friction audits.</li>
              <li>Lifecycle basics: abandon, post-purchase, win-back.</li>
            </ul>
            <p className="mt-4 text-xs text-muted">
              As the library grows, this page will split into categories (tracking,
              funnels, lifecycle) with deeper breakdowns and example implementations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
