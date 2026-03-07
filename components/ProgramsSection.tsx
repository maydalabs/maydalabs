import Link from "next/link";
import { ProgramBadgeIcon, type ProgramVisualId } from "./ProgramIcons";
import { getIntroCallUrl } from "@/lib/marketingLinks";

type ProgramId = ProgramVisualId;

type Program = {
  id: ProgramId;
  name: string;
  oneLiner: string;
  bestFor: string;
  chips: string[];
  price: string;
  badge?: string;
  bullets: string[];
  detailsHref: string;
  fitCheckHref: string;
};

const programs: Program[] = [
  {
    id: "baseline-scan",
    name: "Baseline Scan",
    oneLiner: "Find what is slowing conversion before you change spend.",
    bestFor: "Teams that need a clear diagnosis and ranked roadmap.",
    chips: ["2–3 weeks", "Diagnostic roadmap"],
    price: "$3,900",
    bullets: [
      "Audit the key funnel, UX friction, and tracking setup.",
      "Leave with a fix-first plan for the next sprint."
    ],
    detailsHref: "/programs#baseline-scan",
    fitCheckHref: getIntroCallUrl("programs", {
      program: "Baseline Scan",
      utm_term: "baseline-scan"
    })
  },
  {
    id: "momentum-sprint",
    name: "Momentum Sprint",
    badge: "Most teams start here",
    oneLiner: "Ship the fastest fixes in conversion, UX, and performance.",
    bestFor: "Teams with traffic already coming in but weak conversion.",
    chips: ["3–4 weeks", "Focused sprint"],
    price: "$2,900",
    bullets: [
      "Fix the highest-friction steps in checkout, booking, or forms.",
      "Test a small set of changes tied directly to revenue."
    ],
    detailsHref: "/programs#momentum-sprint",
    fitCheckHref: getIntroCallUrl("programs", {
      program: "Momentum Sprint",
      utm_term: "momentum-sprint"
    })
  },
  {
    id: "growth-loop",
    name: "Growth Loop",
    oneLiner: "Turn CRO, lifecycle, and paid into one operating rhythm.",
    bestFor: "Teams ready to compound gains instead of chasing spikes.",
    chips: ["10–12 weeks", "Ongoing loop"],
    price: "$3,900/mo",
    bullets: [
      "Connect lifecycle, paid, and onsite conversion work.",
      "Run a steady monthly experiment and reporting cadence."
    ],
    detailsHref: "/programs#growth-loop",
    fitCheckHref: getIntroCallUrl("programs", {
      program: "Growth Loop",
      utm_term: "growth-loop"
    })
  }
];

// Canonical primary CTA: dark pill with teal accent
export const primaryCtaClasses =
  "inline-flex items-center justify-center rounded-full border border-mayda-teal/45 bg-surface-card px-4 py-2 text-sm font-semibold text-foreground shadow-[0_14px_34px_rgba(2,6,23,0.38)] transition hover:border-mayda-teal/65 hover:bg-surface-alt/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayda-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Desktop order: Baseline Scan – Momentum Sprint – Growth Loop (Momentum in the middle)
const desktopProgramOrder: ProgramId[] = [
  "baseline-scan",
  "momentum-sprint",
  "growth-loop"
];

// Helper: index programs by id for ordering
const programsById: Record<ProgramId, Program> = programs.reduce(
  (acc, program) => {
    acc[program.id] = program;
    return acc;
  },
  {} as Record<ProgramId, Program>
);

export function ProgramsSection() {
  return (
    <section
      id="programs"
      aria-label="Programs"
      className="mayda-section relative pt-16 md:pt-20"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(106,170,180,0.08),transparent_72%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="mayda-kicker mb-3">Programs</p>
          <h2 className="mayda-section-title text-foreground">
            Choose the right first engagement.
          </h2>
          <p className="mayda-section-copy mt-3 text-sm sm:text-base">
            Baseline finds the gaps, Momentum ships the highest-leverage fixes,
            and Growth Loop turns that into a repeatable rhythm.
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-muted/80 sm:text-[0.78rem]">
            Most teams begin with Momentum Sprint.
          </p>
        </header>

        {/* Desktop / tablet grid */}
        <div className="mt-8 hidden gap-5 md:grid md:grid-cols-3">
          {desktopProgramOrder.map((id) => (
            <ProgramCard
              key={id}
              program={programsById[id]}
              isFeatured={id === "momentum-sprint"}
            />
          ))}
        </div>

        {/* Mobile swipe deck (Momentum first in data order) */}
        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:hidden">
          {programs.map((program) => (
            <div key={program.id} className="min-w-[85%] snap-center">
              <ProgramCard
                program={program}
                isFeatured={program.id === "momentum-sprint"}
              />
            </div>
          ))}
        </div>

        {/* Bridge discovery-call strip */}
        <div className="mt-7 rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,21,29,0.78),rgba(9,16,23,0.5))] px-4 py-3 text-sm text-foreground shadow-[0_18px_40px_rgba(2,6,23,0.26)] sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-medium text-foreground">Not sure where to start?</p>
              <p className="text-sm text-muted">
                Book a short intro call and we&apos;ll point you to the best fit.
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <a
                href={getIntroCallUrl("programs")}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                Book a 15-min Intro Call
              </a>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[0.78rem] font-medium uppercase tracking-[0.18em] text-muted/70">
          Kickoff within 7 days or the first week is on us.
        </p>
      </div>
    </section>
  );
}

function ProgramCard({
  program,
  isFeatured = false
}: {
  program: Program;
  isFeatured?: boolean;
}) {
  const baseCardClasses =
    "group flex h-full flex-col rounded-[1.75rem] border border-white/8 bg-surface-card p-5 shadow-[0_18px_42px_rgba(2,6,23,0.34)] backdrop-blur-sm transition duration-150 hover:-translate-y-1 hover:border-mayda-teal/35 hover:bg-surface-card-alt hover:shadow-[0_22px_52px_rgba(2,6,23,0.42)] sm:p-6";

  const featuredClasses =
    "md:-translate-y-1 md:border-mayda-teal/40 md:bg-surface-card-alt md:shadow-[0_24px_58px_rgba(2,6,23,0.48)]";

  return (
    <article
      className={`${baseCardClasses} ${isFeatured ? featuredClasses : ""}`}
    >
      {/* Badge + price */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2">
          {program.badge && (
            <span className="inline-flex items-center rounded-full border border-border bg-surface-card-alt/92 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {program.badge}
            </span>
          )}
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-surface-card-alt/96 px-3 py-1 text-[0.7rem] font-semibold text-foreground shadow-[0_10px_28px_rgba(2,6,23,0.42)]">
          {program.price}
        </span>
      </div>

      {/* Icon + title */}
      <div className="mt-4 flex items-start gap-3 sm:mt-5">
        <ProgramBadgeIcon
          id={program.id}
          isFeatured={isFeatured}
          badgeClassName="h-10 w-10 rounded-xl"
          glyphClassName="h-5 w-5"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {program.name}
          </h3>
          <p className="mt-1 text-sm font-medium leading-relaxed text-muted">
            {program.oneLiner}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[0.82rem] leading-relaxed text-muted">
        <span className="font-semibold text-foreground/88">Best for:</span>{" "}
        {program.bestFor}
      </p>

      {/* Chips */}
      <ul className="mt-3 flex flex-wrap items-center gap-2 text-[0.78rem]">
          {program.chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-border bg-surface-card-alt/92 px-3 py-1 font-semibold text-foreground/88"
            >
              {chip}
            </li>
          ))}
      </ul>

      {/* Bullets */}
      <ul className="mt-4 space-y-2 text-left text-[0.92rem] leading-relaxed text-muted sm:mt-5">
        {program.bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-mayda-teal/10 text-[0.6rem] text-mayda-teal-soft">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="mt-5 flex flex-col items-start gap-2 sm:mt-6">
        <Link
          href={program.fitCheckHref}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryCtaClasses + " w-full justify-center sm:w-auto"}
        >
          Book a 15-min Intro Call
        </Link>
        <Link
          href={program.detailsHref}
          className="text-xs font-semibold text-muted underline-offset-4 hover:text-mayda-teal-soft hover:underline"
        >
          View full program details
        </Link>
      </div>
    </article>
  );
}
