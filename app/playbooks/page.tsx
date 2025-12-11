import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playbooks – Funnels, tracking, and lifecycle",
  description:
    "Short, practical playbooks from Mayda Labs for fixing common growth problems – tracking sanity checks, funnel tuning, and lifecycle flows.",
};

export default function PlaybooksPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      {/* Intro */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Playbooks
        </h1>
        <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
          Short, practical playbooks for fixing common growth problems – from
          broken tracking to underperforming funnels and lifecycle flows.
        </p>
        <p className="max-w-2xl text-xs text-muted sm:text-sm">
          This section will eventually hold a library of focused playbooks you
          can read, implement, or use as a starting point for a Sprint.
        </p>
      </section>

      {/* List of playbook themes */}
      <section>
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted">
            <li>Tracking sanity check for GA4 and pixels.</li>
            <li>Homepage and offer clarity tuning.</li>
            <li>Cart, checkout, and form friction audits.</li>
            <li>Lifecycle basics: abandon, post-purchase, win-back.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
