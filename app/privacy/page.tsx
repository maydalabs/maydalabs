import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy – Mayda Labs",
  description:
    "High-level overview of how Mayda Labs handles website analytics, form submissions, email lists, and client project data.",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      {/* Intro */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Privacy policy
        </h1>
        <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
          High-level overview of how Mayda Labs handles data across the website,
          analytics, and client work.
        </p>
        <p className="max-w-2xl text-xs text-muted sm:text-sm">
          This is a placeholder to avoid 404s. When you&apos;re ready, this will
          be replaced with a proper policy, written with legal counsel or a
          standard template adapted to your stack.
        </p>
      </section>

      {/* High-level bullets */}
      <section>
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted">
            <li>Website analytics (GA4 and similar tools).</li>
            <li>Form submissions and contact details.</li>
            <li>Email list management.</li>
            <li>Client project data and access.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
