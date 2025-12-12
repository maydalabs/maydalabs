import Link from "next/link";
import type { CSSProperties } from "react";

type ProgramId = "momentum" | "foundation" | "scale";

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

const baseFitCheckUrl =
  "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=programs&program=";

const programs: Program[] = [
  {
    id: "foundation",
    name: "Baseline Scan",
    oneLiner: "Audit your flows, stack, and data before you touch anything.",
    bestFor:
      "Teams that want a fast, objective read on what’s slowing conversion down.",
    chips: ["2–3 weeks", "Diagnostic + roadmap"],
    price: "$3,900",
    bullets: [
      "Performance and UX scan across key flows (home, PDP/LP, checkout, booking).",
      "Tracking and analytics audit so numbers match reality (events, pixels, GA4).",
      "Prioritized roadmap showing where to start and what to ignore."
    ],
    detailsHref: "/programs#baseline-scan",
    fitCheckHref: `${baseFitCheckUrl}Baseline+Scan`
  },
  {
    id: "momentum",
    name: "Momentum Sprint",
    badge: "Most teams start here",
    oneLiner: "Fix conversion bottlenecks and ship measurable wins fast.",
    bestFor:
      "Teams with traffic but weak conversion (≈1–3%) because of UX, speed, or data issues.",
    chips: ["3–4 weeks", "CRO & UX sprint"],
    price: "$2,900",
    bullets: [
      "Remove friction in key flows (pricing, forms, booking, checkout).",
      "Streamline assets/scripts for lighter, faster key pages.",
      "Verify tracking and run focused A/Bs on high-impact steps."
    ],
    detailsHref: "/programs#momentum-sprint",
    fitCheckHref: `${baseFitCheckUrl}Momentum+Sprint`,
    tagline: "Most teams start with a Momentum Sprint, then graduate into Growth Loop."
  },
  {
    id: "scale",
    name: "Growth Loop",
    oneLiner: "Turn growth into a repeatable operating system.",
    bestFor:
      "Teams ready to operationalize lifecycle, paid, and CRO into one rhythm.",
    chips: ["10–12 weeks", "Growth operating system"],
    price: "$3,900/mo",
    bullets: [
      "Automate lifecycle flows that compound retention and revenue.",
      "Run structured paid + creative tests with clean attribution.",
      "Keep a monthly CRO + analytics cadence that compounds over time."
    ],
    detailsHref: "/programs#growth-loop",
    fitCheckHref: `${baseFitCheckUrl}Growth+Loop`
  }
];

// Canonical primary CTA: dark pill with teal accent
export const primaryCtaClasses =
  "inline-flex items-center justify-center rounded-full border border-teal-400/70 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-teal-100 shadow-sm shadow-black/30 transition hover:bg-slate-950/80 hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

// Icons under /public/icons/*.svg (solid black glyphs)
const programIconSrc: Record<ProgramId, string> = {
  momentum: "/icons/momentum.svg",
  foundation: "/icons/foundation.svg",
  scale: "/icons/scale.svg"
};

// Desktop order: Baseline Scan – Momentum Sprint – Growth Loop (Momentum in the middle)
const desktopProgramOrder: ProgramId[] = ["foundation", "momentum", "scale"];

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
      className="flex min-h-screen items-center py-16 sm:py-24"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Ways to grow
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Pick your starting point.
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
            Baseline Scan shows you where you&apos;re leaking. Momentum Sprint fixes
            the biggest bottlenecks. Growth Loop turns wins into a repeatable
            system across lifecycle, paid, and CRO.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400 sm:text-sm">
            Most teams run a Momentum Sprint first, then evolve into Growth Loop.
          </p>
        </header>

        {/* Desktop / tablet grid */}
        <div className="mt-10 hidden gap-6 md:grid md:grid-cols-3">
          {desktopProgramOrder.map((id) => (
            <ProgramCard
              key={id}
              program={programsById[id]}
              isFeatured={id === "momentum"}
            />
          ))}
        </div>

        {/* Mobile swipe deck (Momentum first in data order) */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:hidden">
          {programs.map((program) => (
            <div key={program.id} className="min-w-[85%] snap-center">
              <ProgramCard
                program={program}
                isFeatured={program.id === "momentum"}
              />
            </div>
          ))}
        </div>

        {/* Bridge fit-check strip */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-200 shadow-[0_18px_45px_rgba(2,6,23,0.7)] backdrop-blur sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-medium text-slate-50">
                Not sure which program fits?
              </p>
              <p className="text-sm text-slate-300">
                Book a 15-min fit check and we&apos;ll recommend a starting point — most teams
                start with a Momentum Sprint.
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <a
                href="https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=fit-check&utm_content=programs-section"
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                Book a 15-min fit check
              </a>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[0.78rem] font-medium uppercase tracking-[0.18em] text-slate-500">
          Kickoff in 7 days or we comp your first week.
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
    "group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-[0_18px_45px_rgba(2,6,23,0.65)] backdrop-blur-md transition-transform duration-150 hover:-translate-y-1 hover:border-teal-300/60 hover:shadow-[0_26px_70px_rgba(15,23,42,0.9)]";

  const featuredClasses =
    "md:scale-[1.03] md:border-teal-400/80 md:bg-slate-900/90 md:shadow-[0_26px_80px_rgba(15,23,42,0.95)]";

  return (
    <article
      className={`${baseCardClasses} ${isFeatured ? featuredClasses : ""}`}
    >
      {/* Badge + price */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2">
          {program.badge && (
            <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-300">
              {program.badge}
            </span>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-950/90 px-3 py-1 text-[0.7rem] font-semibold text-slate-50 shadow-[0_10px_28px_rgba(15,23,42,0.8)]">
          {program.price}
        </span>
      </div>

      {/* Icon + title */}
      <div className="mt-5 flex flex-col items-center text-center">
        <ProgramIcon id={program.id} isFeatured={isFeatured} />
        <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
          {program.name}
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">
          {program.oneLiner}
        </p>

        {/* Best for */}
        <p className="mt-3 text-[0.78rem] leading-relaxed text-slate-400">
          <span className="font-semibold uppercase tracking-[0.16em] text-slate-400">
            Best for
          </span>{" "}
          <span className="font-medium text-slate-300">
            {program.bestFor}
          </span>
        </p>

        {/* Chips */}
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[0.78rem]">
          {program.chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 font-semibold text-slate-200"
            >
              {chip}
            </li>
          ))}
        </ul>

        {/* Momentum-specific tagline */}
        {program.tagline && (
          <p className="mt-3 text-[0.78rem] text-slate-400">
            {program.tagline}
          </p>
        )}
      </div>

      {/* Bullets */}
      <ul className="mt-5 space-y-2 text-left text-sm leading-relaxed text-slate-300">
        {program.bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-500/12 text-[0.6rem] text-emerald-300">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <Link
          href={program.fitCheckHref}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryCtaClasses + " w-full sm:w-auto"}
        >
          Book a 15-min fit check
        </Link>
        <Link
          href={program.detailsHref}
          className="text-xs font-semibold text-slate-300 underline-offset-4 hover:text-teal-300 hover:underline"
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
    id === "momentum"
      ? "from-emerald-400 via-emerald-300 to-teal-200"
      : id === "foundation"
      ? "from-sky-400 via-cyan-300 to-teal-200"
      : "from-indigo-400 via-violet-400 to-fuchsia-300";

  const src = programIconSrc[id];

  const alt =
    id === "momentum"
      ? "Momentum Sprint icon"
      : id === "foundation"
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

  // Momentum + Baseline slightly scaled up to visually match Growth Loop
  const sizeClasses =
    id === "scale"
      ? "h-12 w-12"
      : "h-12 w-12 transform scale-110";

  const featuredGlow =
    isFeatured && id === "momentum"
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
