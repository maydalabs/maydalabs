import type { Metadata } from "next";
import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "Contact – Book a 15-min Intro Call",
  description:
    "Book a short intro call with Mayda Labs to review bottlenecks, numbers, and the right next growth step.",
};

const CONTACT_HERO_URL = getIntroCallUrl("contact_hero");
const CONTACT_BOTTOM_URL = getIntroCallUrl("contact_bottom");

export default function ContactPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            Contact · Mayda Labs
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Book a short intro call.
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            In 15 minutes, we&apos;ll pressure-test fit and identify the fastest
            next move for your funnel.
          </p>
          <Link
            href={CONTACT_HERO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryCtaClasses}
          >
            Book a 15-min Intro Call
          </Link>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            What we&apos;ll cover in 15 minutes
          </h2>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted">
            <li>Your current numbers and where signal quality breaks down.</li>
            <li>The biggest bottleneck in conversion, handoff, or retention.</li>
            <li>The most realistic next step: Scan, Sprint, or Growth Loop.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:max-w-7xl">
          <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              What happens after
            </h2>
            <ul className="ml-4 mt-3 list-disc space-y-1 text-muted">
              <li>
                If there&apos;s fit: we recommend the right program and confirm scope,
                timeline, and next steps.
              </li>
              <li>
                If there&apos;s no fit: you still leave with 2–3 practical ideas and a
                better direction.
              </li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Prefer email?
            </h2>
            <p className="mt-3 text-muted">
              You can also reach us directly at{" "}
              <a
                href="mailto:info@maydalabs.com"
                className="font-semibold text-mayda-teal hover:underline"
              >
                info@maydalabs.com
              </a>
              .
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 sm:p-6 lg:max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Ready to talk through your case?
              </h2>
              <p className="text-sm text-muted">
                We&apos;ll keep it direct and actionable.
              </p>
            </div>
            <Link
              href={CONTACT_BOTTOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryCtaClasses}
            >
              Book a 15-min Intro Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
