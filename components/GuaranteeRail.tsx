"use client";

import { useState } from "react";
import Link from "next/link";
import { primaryCtaClasses } from "./ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const DEFAULT_PLEDGES = [
  "Owner docs + launch checklist",
  "NDA + least-privilege access",
  "Fixed-scope sprints",
  "Clean tracking + weekly demo with next steps",
  "Same-day replies (≤24h on weekdays)",
  "Pause or cancel between sprints"
];

interface GuaranteeRailProps {
  id?: string;
  pledges?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function GuaranteeRail({
  id = "guarantee",
  pledges = DEFAULT_PLEDGES,
  ctaLabel = "Book a 15-min Intro Call",
  ctaHref = getIntroCallUrl("guarantee")
}: GuaranteeRailProps) {
  const [open, setOpen] = useState(false);

  // duplicate once for seamless loop
  const allPledges = [...pledges, ...pledges];

  const handleToggleDetails = () => {
    setOpen((prev) => !prev);
  };

  return (
    <section
      id={id}
      aria-label="Service guarantees and working pledges"
      className="relative py-4 sm:py-5"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: badge + details */}
        <div className="flex min-w-max flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-3">
          <span className="inline-flex items-center justify-center rounded-full border border-teal-400/60 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-50 shadow-[0_10px_30px_rgba(15,23,42,0.6)]">
            Guarantee
          </span>
          <button
            type="button"
            onClick={handleToggleDetails}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={`${id}-dialog`}
            className="inline-flex w-max border-b border-teal-400/80 pb-[2px] text-[12px] font-semibold text-slate-100 hover:text-teal-100"
          >
            {open ? "Hide details" : "What's included"}
          </button>
        </div>

        {/* Right: pledge rail */}
        <div className="relative min-w-0 flex-1">
          <div className="guar-rail relative h-10">
            <div className="guar-marquee flex h-full items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="guar-track flex items-center gap-2.5">
                {allPledges.map((text, idx) => (
                  <span
                    key={`${text}-${idx}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-slate-700 bg-slate-950/80 px-3.5 py-1.5 text-[12px] font-medium text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.7)]"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
          id={`${id}-dialog`}
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950/90 shadow-[0_28px_90px_rgba(2,6,23,0.95)]">
            <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-50">
                {"What's included in the guarantee"}
              </h3>
              <button
                type="button"
                onClick={handleToggleDetails}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-full border border-slate-700 bg-slate-900/80 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-slate-50"
              >
                ×
              </button>
            </header>

            <div className="space-y-4 px-4 py-4 text-sm text-slate-100">
              <p className="text-[13px] text-slate-200">
                If we miss the agreed weekly checklist for reasons on our side,
                we work an extra week at no cost.
              </p>

              <ul className="space-y-2 text-[13px]">
                <li className="relative pl-4">
                  <span className="absolute left-0 top-[2px] text-[11px] text-emerald-400">
                    ✓
                  </span>
                  <strong className="text-slate-50">Scope:</strong>{" "}
                  Items in your signed weekly checklist.
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-[2px] text-[11px] text-emerald-400">
                    ✓
                  </span>
                  <strong className="text-slate-50">On-time:</strong>{" "}
                  By sprint Friday, 6pm (your timezone).
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-[2px] text-[11px] text-emerald-400">
                    ✓
                  </span>
                  <strong className="text-slate-50">Exclusions:</strong>{" "}
                  Missing access/assets, force majeure, or mid-sprint scope
                  changes.
                </li>
                <li className="relative pl-4">
                  <span className="absolute left-0 top-[2px] text-[11px] text-emerald-400">
                    ✓
                  </span>
                  <strong className="text-slate-50">Remedy:</strong>{" "}
                  One additional week at no cost, scheduled in the next sprint,
                  as long as you met your side of the checklist.
                </li>
              </ul>

              <div className="border-t border-slate-800 pt-3 text-[12px] text-slate-300">
                <span className="font-semibold text-slate-100">
                  Process layer:
                </span>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Least-privilege access; NDA available on request.</li>
                  <li>Weekly demo + decision log so nothing gets lost.</li>
                  <li>KPIs agreed and tracking verified end-to-end.</li>
                </ul>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-slate-800 px-4 py-3">
              <button
                type="button"
                onClick={handleToggleDetails}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-slate-50"
              >
                Close
              </button>
              <Link
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses + " text-xs"}
              >
                {ctaLabel}
              </Link>
            </footer>
          </div>
        </div>
      )}

      {/* local styles for marquee */}
      <style jsx>{`
        .guar-rail {
          position: relative;
        }
        .guar-marquee {
          position: relative;
        }
        .guar-track {
          width: max-content;
          will-change: transform;
          animation: guarantee-marquee 120s linear infinite;
        }
        .guar-marquee:hover .guar-track {
          animation-play-state: paused;
        }

        @keyframes guarantee-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 768px) {
          .guar-track {
            animation-duration: 210s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .guar-track {
            animation: none;
          }
          .guar-marquee {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </section>
  );
}
