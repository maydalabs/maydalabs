import type { ReactNode } from "react";

/*
 * Logo-mark candidates, hand-drawn as SVG in the brand's stroke language
 * (32-unit grid, one stroke weight, round caps), shown on /brand-preview in
 * context so the choice is made on the real thing: gradient on the void,
 * header lockup, 16 px favicon on a tab, app tile, mono on frost.
 */

export type LogoCandidate = {
  id: string;
  name: string;
  idea: string;
  // Paint callback: stroke/fill colour (gradient url or currentColor).
  draw: (paint: string) => ReactNode;
};

const W = 2.8;

export const LOGO_CANDIDATES: LogoCandidate[] = [
  {
    id: "check-m",
    name: "Check-M",
    idea: "An M whose inner stroke is a check: the two legs are the gate posts, the approval is the letter itself.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 26V6" />
        <path d="M25 26V6" />
        <path d="M7 13.5 13 20.5 25 6" />
      </g>
    ),
  },
  {
    id: "bar-check",
    name: "Bar & check",
    idea: "The human gate as one vertical bar; the work leaves it approved. No letter, reads at any size.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 6V26" />
        <path d="M13.5 16.5 18.5 21.5 27.5 10.5" />
      </g>
    ),
  },
  {
    id: "signal-gate",
    name: "Signal gate",
    idea: "Three strands converge, pass one gate bar, leave as a single line that ends in a dot: input → approval → output.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9C9.5 9 9.5 16 13 16" />
        <path d="M4 16H13" />
        <path d="M4 23C9.5 23 9.5 16 13 16" />
        <path d="M17.5 8V24" />
        <path d="M22 16H25.5" />
        <circle cx="28.5" cy="16" r="2" fill={paint} stroke="none" />
      </g>
    ),
  },
  {
    id: "gate-ring",
    name: "Gate ring",
    idea: "A ring (the block, the coin's silhouette without the ₿) with the gate bar through it and the signal crossing.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="11.5" />
        <path d="M16 9.5V22.5" />
        <path d="M8.5 16H12.5" />
        <path d="M19.5 16H23.5" />
      </g>
    ),
  },
  {
    id: "block-gate",
    name: "Block gate",
    idea: "One block of the chain, the gate bar inside it, the signal entering and leaving as a dot.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="5" width="22" height="22" rx="6.5" />
        <path d="M16 11V21" />
        <path d="M9.5 16H12.5" />
        <circle cx="21" cy="16" r="1.9" fill={paint} stroke="none" />
      </g>
    ),
  },
  {
    id: "current",
    name: "Current mark (for reference)",
    idea: "The one on the site now: gate legs and a signal dipping into a check.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 27V5" />
        <path d="M24.5 27V5" />
        <path d="M7.5 9.5 13.5 22.5 24.5 9.5" />
      </g>
    ),
  },
];

export function CandidateMark({
  candidate,
  size = 32,
  mono = false,
  className = "",
}: {
  candidate: LogoCandidate;
  size?: number;
  mono?: boolean;
  className?: string;
}) {
  const id = `cand-${candidate.id}-${size}${mono ? "-m" : ""}`;
  const paint = mono ? "currentColor" : `url(#${id})`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      {mono ? null : (
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="4" y1="0" x2="28" y2="0">
            <stop offset="0" stopColor="#4B6BFF" />
            <stop offset="1" stopColor="#42F5B6" />
          </linearGradient>
        </defs>
      )}
      {candidate.draw(paint)}
    </svg>
  );
}

export function LogoCandidateGallery() {
  return (
    <div className="bp-candidates">
      {LOGO_CANDIDATES.map((candidate, index) => (
        <article key={candidate.id} className="bp-candidate" id={`candidate-${candidate.id}`}>
          <header>
            <span className="mayda-mono">
              {index + 1} · {candidate.id}
            </span>
            <strong>{candidate.name}</strong>
            <p>{candidate.idea}</p>
          </header>
          <div className="bp-candidate-row">
            <div className="bp-cell is-void">
              <CandidateMark candidate={candidate} size={96} />
            </div>
            <div className="bp-cell is-void">
              <span className="mayda-logo">
                <CandidateMark candidate={candidate} size={26} className="mayda-logo-mark" />
                <span className="mayda-wordmark">
                  MaydaLabs<i aria-hidden="true">×</i>
                </span>
              </span>
            </div>
            <div className="bp-cell is-tab">
              <span className="bp-tab">
                <CandidateMark candidate={candidate} size={16} />
                <span>maydalabs.com</span>
              </span>
            </div>
            <div className="bp-cell is-void">
              <span className="bp-tile">
                <CandidateMark candidate={candidate} size={40} />
              </span>
            </div>
            <div className="bp-cell is-frost">
              <CandidateMark candidate={candidate} size={44} mono />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
