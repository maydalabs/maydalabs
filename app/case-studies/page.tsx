import type { Metadata } from "next";
import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

type CaseCard = {
  slug: string;
  title: string;
  context: string;
  work: string[];
  result: string[];
};

const CASE_HERO_URL = getIntroCallUrl("case_hero");
const CASE_BOTTOM_URL = getIntroCallUrl("case_bottom");

const CASES: CaseCard[] = [
  {
    slug: "dtc-checkout-recovery",
    title: "DTC checkout recovery sprint",
    context: "Established ecommerce brand with steady traffic and weak checkout completion.",
    work: [
      "Mapped drop-off points across product, cart, and checkout states.",
      "Implemented focused UX and speed fixes tied to purchase intent."
    ],
    result: [
      "Double-digit lift on key checkout steps within the sprint window.",
      "Cleaner conversion measurement after tracking repair."
    ]
  },
  {
    slug: "saas-activation-flow",
    title: "SaaS activation flow cleanup",
    context: "B2B product with sign-ups but inconsistent onboarding activation.",
    work: [
      "Reworked onboarding sequence around real product events.",
      "Built lifecycle nudges aligned to activation milestones."
    ],
    result: [
      "Early activation moved up meaningfully in the first 30 days.",
      "Team gained a clearer baseline for trial-to-paid decisions."
    ]
  },
  {
    slug: "services-lead-handoff",
    title: "Services lead handoff optimization",
    context: "Service firm with lead volume but low qualified consultations.",
    work: [
      "Simplified contact and qualification flow from first click to call.",
      "Added structured follow-up rules for no-response and no-show scenarios."
    ],
    result: [
      "More qualified conversations from the same traffic base.",
      "Less leakage between form submit and scheduled call."
    ]
  },
  {
    slug: "retention-lifecycle-foundation",
    title: "Retention lifecycle foundation",
    context: "Growth-stage team lacking a reliable lifecycle operating system.",
    work: [
      "Built core post-purchase and win-back lifecycle flows.",
      "Linked lifecycle reporting to weekly decision cadence."
    ],
    result: [
      "Improved repeat-engagement trend after initial rollout.",
      "Faster iteration cycles due to clearer signal quality."
    ]
  }
];

export const metadata: Metadata = {
  title: "Case Studies – Outcomes and implementation proof",
  description:
    "Selected Mayda Labs case snapshots focused on context, execution, and measured outcomes.",
};

export default function CaseStudiesPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            Case studies
          </p>
          <h1 className="max-w-3xl text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Outcomes, not fluff.
          </h1>
          <p className="max-w-3xl text-sm text-muted sm:text-[0.95rem]">
            Snapshot views of recent engagement types: context, what we changed,
            and what moved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={CASE_HERO_URL}
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
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:max-w-7xl">
          {CASES.map((item) => (
            <article
              key={item.slug}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/85 p-5 text-sm"
            >
              <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>

              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Context
                </p>
                <p className="mt-1 text-muted">{item.context}</p>
              </div>

              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  What we did
                </p>
                <ul className="ml-4 mt-1 list-disc space-y-1 text-muted">
                  {item.work.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Result
                </p>
                <ul className="ml-4 mt-1 list-disc space-y-1 text-muted">
                  {item.result.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-1">
                <Link
                  href={getIntroCallUrl("case_card", { utm_term: item.slug })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryCtaClasses}
                >
                  Book a 15-min Intro Call
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl text-sm text-muted lg:max-w-7xl">
          More case writeups coming — visuals are being refreshed.
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 sm:p-6 lg:max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Want to discuss a similar scenario?
              </h2>
              <p className="text-sm text-muted">
                We&apos;ll walk through fit, likely gains, and the right entry point.
              </p>
            </div>
            <Link
              href={CASE_BOTTOM_URL}
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
