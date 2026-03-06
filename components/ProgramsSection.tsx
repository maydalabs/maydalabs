import Link from "next/link";
import type { CSSProperties } from "react";
import { getIntroCallUrl } from "@/lib/marketingLinks";

type ProgramId = "baseline-scan" | "momentum-sprint" | "growth-loop";

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
  tagline?: string;
};

const programs: Program[] = [
  {
    id: "baseline-scan",
    name: "Baseline Scan",
    oneLiner: "Audit flows, stack, and data before scaling spend.",
    bestFor:
      "Teams that want an objective map of what’s slowing conversion down.",
    chips: ["2–3 weeks", "Diagnostic + roadmap"],
    price: "$3,900",
    bullets: [
      "Review key funnels end-to-end (home, PDP/LP, checkout, booking).",
      "Fix tracking so events, pixels, and GA4 match reality.",
      "Deliver a prioritized roadmap of what to fix first and what to ignore."
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
    oneLiner: "Fix conversion bottlenecks and ship measurable wins fast.",
    bestFor: "Teams with traffic but weak conversion (≈1–3%).",
    chips: ["3–4 weeks", "CRO & UX sprint"],
    price: "$2,900",
    bullets: [
      "Remove friction in high-intent flows (pricing, forms, booking, checkout).",
      "Lighten pages and scripts for faster, cleaner experiences.",
      "Run focused A/Bs on the 2–3 highest-impact steps."
    ],
    detailsHref: "/programs#momentum-sprint",
    fitCheckHref: getIntroCallUrl("programs", {
      program: "Momentum Sprint",
      utm_term: "momentum-sprint"
    }),
    tagline:
      "Most teams start with a Momentum Sprint, then graduate into Growth Loop."
  },
  {
    id: "growth-loop",
    name: "Growth Loop",
    oneLiner: "Turn growth into a repeatable operating system.",
    bestFor:
      "Teams ready to operationalize lifecycle, paid, and CRO into one rhythm.",
    chips: ["10–12 weeks", "Growth operating system"],
    price: "$3,900/mo",
    bullets: [
      "Automate lifecycle flows that compound retention and revenue.",
      "Run structured paid + creative tests with clean attribution.",
      "Keep a monthly CRO + analytics cadence so compounding doesn’t stall."
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

// Icons under /public/icons/*.svg (solid black glyphs)
const programIconSrc: Record<ProgramId, string> = {
  "baseline-scan": "/icons/baseline-scan.svg",
  "momentum-sprint": "/icons/momentum-sprint.svg",
  "growth-loop": "/icons/growth-loop.svg"
};

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
      className="mayda-section flex items-center lg:min-h-[calc(100vh-var(--chrome-height))]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="mayda-kicker mb-3">Ways to grow</p>
          <h2 className="mayda-section-title text-foreground">
            Pick your starting point.
          </h2>
          <p className="mayda-section-copy mt-3 text-sm sm:text-base">
            Three ways to work together: a fast audit, a focused sprint, or an
            operating system.
          </p>
          <p className="mt-2 text-xs font-medium text-muted sm:text-sm">
            Most teams start with Momentum Sprint, then evolve into Growth Loop.
          </p>
        </header>

        {/* Desktop / tablet grid */}
        <div className="mt-8 hidden gap-6 md:grid md:grid-cols-3">
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
        <div className="mayda-panel-soft mt-8 rounded-2xl px-4 py-3 text-sm text-foreground sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-medium text-foreground">Not sure where to start?</p>
              <p className="text-sm text-muted">
                Book a short intro call and we&apos;ll recommend a program.
                Most teams start with Momentum Sprint.
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
    "group flex h-full flex-col rounded-2xl border border-border bg-surface-card p-5 shadow-[0_18px_45px_rgba(2,6,23,0.56)] backdrop-blur-md transition-transform duration-150 hover:-translate-y-1 hover:border-mayda-teal/45 hover:bg-surface-card-alt/94 hover:shadow-[0_24px_64px_rgba(2,6,23,0.7)] sm:p-6";

  const featuredClasses =
    "md:scale-[1.02] md:border-mayda-teal/60 md:bg-surface-card-alt/96 md:shadow-[0_26px_74px_rgba(2,6,23,0.78)]";

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
      <div className="mt-4 flex flex-col items-center text-center sm:mt-5">
        <ProgramIcon id={program.id} isFeatured={isFeatured} />
        <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {program.name}
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
          {program.oneLiner}
        </p>

        {/* Best for */}
        <p className="mt-3 text-[0.78rem] leading-relaxed text-muted">
          <span className="font-semibold uppercase tracking-[0.16em] text-muted">
            Best for
          </span>{" "}
          <span className="font-medium text-foreground/88">{program.bestFor}</span>
        </p>

        {/* Chips */}
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[0.78rem]">
          {program.chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-border bg-surface-card-alt/92 px-3 py-1 font-semibold text-foreground/88"
            >
              {chip}
            </li>
          ))}
        </ul>

        {/* Momentum-specific tagline */}
        {program.tagline && (
          <p className="mt-3 text-[0.78rem] text-muted">
            {program.tagline}
          </p>
        )}
      </div>

      {/* Bullets */}
      <ul className="mt-4 space-y-2 text-left text-sm leading-relaxed text-muted sm:mt-5">
        {program.bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-mayda-teal/12 text-[0.6rem] text-mayda-teal-soft">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="mt-5 flex flex-col items-center gap-2 sm:mt-6">
        <Link
          href={program.fitCheckHref}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryCtaClasses + " w-full sm:w-auto"}
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

// Program icons: gradient-filled SVG glyphs via CSS mask
function ProgramIcon({
  id,
  isFeatured
}: {
  id: ProgramId;
  isFeatured?: boolean;
}) {
  const gradient =
    id === "momentum-sprint"
      ? "from-emerald-400 via-emerald-300 to-teal-200"
      : id === "baseline-scan"
      ? "from-sky-400 via-cyan-300 to-teal-200"
      : "from-indigo-400 via-violet-400 to-fuchsia-300";

  const src = programIconSrc[id];

  const alt =
    id === "momentum-sprint"
      ? "Momentum Sprint icon"
      : id === "baseline-scan"
      ? "Baseline Scan icon"
      : "Growth Loop icon";

  const maskStyle: CSSProperties = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center"
  };

  const sizeClasses =
    id === "growth-loop" ? "h-12 w-12" : "h-12 w-12 transform scale-110";

  const featuredGlow =
    isFeatured && id === "momentum-sprint"
      ? "md:drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]"
      : "";

  return (
    <div
      role="img"
      aria-label={alt}
      style={maskStyle}
      className={`bg-gradient-to-tr ${gradient} ${sizeClasses} ${featuredGlow}`}
    />
  );
}
