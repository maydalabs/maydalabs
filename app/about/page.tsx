import type { Metadata } from "next";
import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const ABOUT_HERO_URL = getIntroCallUrl("about_hero");
const ABOUT_BOTTOM_URL = getIntroCallUrl("about_bottom");

const HOW_WE_WORK_STEPS = [
  {
    title: "Diagnose",
    detail: "Align on goals, verify tracking, and identify the highest-leverage bottlenecks."
  },
  {
    title: "Prioritize",
    detail: "Turn findings into a ranked plan so the team works on what moves revenue first."
  },
  {
    title: "Implement",
    detail: "Ship fixes and experiments weekly instead of waiting for a long redesign cycle."
  },
  {
    title: "Compound",
    detail: "Keep what works, cut what does not, and build a repeatable growth rhythm."
  }
];

export const metadata: Metadata = {
  title: "About – Mayda Labs",
  description:
    "Mayda Labs is a growth partner focused on conversion, retention, and compounding gains through clear execution.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            About · Mayda Labs
          </p>
          <h1 className="max-w-3xl text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Growth partner for teams that want measurable gains, not marketing theater.
          </h1>
          <p className="max-w-3xl text-sm text-muted sm:text-[0.95rem]">
            We focus on conversion, retention, and clean measurement so existing
            traffic compounds into better revenue outcomes.
          </p>
          <Link
            href={ABOUT_HERO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryCtaClasses}
          >
            Book a 15-min Intro Call
          </Link>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:max-w-7xl">
          <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
            <h2 className="text-lg font-semibold text-foreground">Best for</h2>
            <ul className="ml-4 mt-3 list-disc space-y-1 text-muted">
              <li>Teams with steady traffic but weak conversion efficiency.</li>
              <li>Founders/operators who want execution, not advisory-only slides.</li>
              <li>Brands needing tracking and attribution they can actually trust.</li>
              <li>Businesses ready for weekly shipping cadence and clear priorities.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
            <h2 className="text-lg font-semibold text-foreground">Not for</h2>
            <ul className="ml-4 mt-3 list-disc space-y-1 text-muted">
              <li>Teams looking for a full-service ad agency replacement.</li>
              <li>Projects needing random feature work with no growth objective.</li>
              <li>Organizations that cannot provide access or decision ownership.</li>
              <li>“Set and forget” expectations without experimentation discipline.</li>
            </ul>
          </article>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            How we work
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {HOW_WE_WORK_STEPS.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-border bg-surface/80 p-4 text-sm"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            What you get
          </h2>
          <ul className="ml-4 mt-3 list-disc space-y-1 text-sm text-muted">
            <li>Documented funnel and conversion audit.</li>
            <li>Prioritized implementation roadmap (what to do now vs later).</li>
            <li>Experiment backlog with clear hypotheses and owners.</li>
            <li>Tracking and attribution verification notes.</li>
            <li>Weekly updates with decisions and next actions.</li>
            <li>Handoff-ready documentation for your internal team.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Why trust us
          </h2>
          <ul className="ml-4 mt-3 list-disc space-y-1 text-sm text-muted">
            <li>Recent projects have produced double-digit lifts on key funnel steps.</li>
            <li>Tracking cleanup regularly reveals hidden reporting errors before optimization.</li>
            <li>First meaningful movement is usually visible within the first sprint window.</li>
            <li>Work is scoped in writing before kickoff to avoid surprise scope creep.</li>
            <li>The same team handling strategy is responsible for implementation.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 sm:p-6 lg:max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Want to see if there&apos;s a fit?
              </h2>
              <p className="text-sm text-muted">
                We&apos;ll review your numbers and suggest the best starting point.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ABOUT_BOTTOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                Book a 15-min Intro Call
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
              >
                View programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
