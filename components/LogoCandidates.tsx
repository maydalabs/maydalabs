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
    id: "block-gate",
    name: "Block gate · first draft",
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
    id: "block-gate-a",
    name: "Polish A · tuned",
    idea: "Same drawing, better proportions: the block fills the square, the gate bar is taller, the signal has room, the dot is heavier.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="24" height="24" rx="6.5" />
        <path d="M16.5 10V22" />
        <path d="M8.5 16H12.5" />
        <circle cx="22" cy="16" r="2.1" fill={paint} stroke="none" />
      </g>
    ),
  },
  {
    id: "block-gate-b",
    name: "Polish B · chosen, final",
    idea: "Two strands converge into the gate and leave as one dot — the site's own figure, inside the block.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="24" height="24" rx="6.5" />
        <path d="M8.5 12.5C11.5 12.5 11 16 13 16" />
        <path d="M8.5 19.5C11.5 19.5 11 16 13 16" />
        <path d="M17 10V22" />
        <circle cx="22.5" cy="16" r="2.1" fill={paint} stroke="none" />
      </g>
    ),
  },
  {
    id: "block-gate-c",
    name: "Polish C · through and out",
    idea: "The signal visibly crosses the gate: a line in, a line out, the dot at the exit. Direction is unmistakable.",
    draw: (paint) => (
      <g fill="none" stroke={paint} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="24" height="24" rx="6.5" />
        <path d="M16 10V22" />
        <path d="M8.5 16H12.5" />
        <path d="M19.5 16H21" />
        <circle cx="23.5" cy="16" r="1.9" fill={paint} stroke="none" />
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
