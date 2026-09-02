/*
 * The Multiplier Field: one input becoming several connected outputs.
 * Pure SVG + CSS animation (see field.css); decorative, hidden from
 * assistive tech, and fully legible as a static figure when
 * prefers-reduced-motion is set.
 */

const BRANCH_ENDS = [46, 116, 186, 256, 326];

function branchPath(endY: number) {
  return `M150 186 C 250 186, 300 ${endY}, 466 ${endY}`;
}

export function FieldFigure({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`field-figure ${className}`}
      viewBox="0 0 520 372"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="field-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4B6BFF" />
          <stop offset="1" stopColor="#42F5B6" />
        </linearGradient>
      </defs>

      <path className="field-line is-input" d="M10 186 H 150" />

      {BRANCH_ENDS.map((endY) => (
        <path key={endY} className="field-line is-output" d={branchPath(endY)} />
      ))}

      <path className="field-pulse" d={`M10 186 H 150 ${branchPath(46).slice(1)}`} />
      <path className="field-pulse is-second" d={`M10 186 H 150 ${branchPath(186).slice(1)}`} />
      <path className="field-pulse is-third" d={`M10 186 H 150 ${branchPath(326).slice(1)}`} />

      <circle className="field-node" cx="150" cy="186" r="6" />

      {BRANCH_ENDS.map((endY) => (
        <circle key={endY} className="field-tip" cx="466" cy={endY} r="4" />
      ))}
    </svg>
  );
}
