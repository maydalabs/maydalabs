import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact – Book a 15 min fit check",
  description:
    "Book a short fit check call or email Mayda Labs with a snapshot of your traffic, stack, and goals to see whether a Scan, Sprint, or Growth Loop makes sense.",
};

export default function ContactPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      {/* Intro */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Contact
        </h1>
        <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
          Easiest way to start is a short fit check call. If you prefer email,
          send a quick snapshot of your traffic, stack, and goals and we&apos;ll
          take it from there.
        </p>
      </section>

      {/* Fit check strip */}
      <section>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-alt/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Book a 15&nbsp;min fit check.
            </h2>
            <p className="max-w-xl text-sm text-muted sm:text-[0.95rem]">
              We&apos;ll look at your current funnel, ask a few focused
              questions, and tell you in plain English whether a Scan, Sprint,
              or Growth Loop makes sense – or if you&apos;re better off doing
              something else first.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm text-muted">
              <li>No sales script, no pressure.</li>
              <li>We can screen-share if it&apos;s useful.</li>
              <li>You leave with 2–3 concrete ideas, either way.</li>
            </ul>
          </div>
          <div>
            <Link
              href="https://calendly.com/"
              className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
            >
              Book a 15&nbsp;min fit check
            </Link>
          </div>
        </div>
      </section>

      {/* Email + what to include */}
      <section>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Prefer email?
            </h2>
            <p className="max-w-xl text-sm text-muted sm:text-[0.95rem]">
              Send a short note with a few basics and we&apos;ll reply with
              thoughts and next steps.
            </p>
            <p className="text-sm text-muted">
              Email:{" "}
              <a
                href="mailto:hello@emayda.com"
                className="font-medium text-mayda-teal hover:underline"
              >
                hello@emayda.com
              </a>{" "}
              (can be updated later to match the final Mayda Labs domain).
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Useful things to include
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Your website / product URL and rough monthly sessions.</li>
              <li>
                What you&apos;re trying to grow (revenue, MRR, qualified leads,
                something else).
              </li>
              <li>
                Anything you already know is broken (tracking, mobile UX,
                lifecycle, etc.).
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
