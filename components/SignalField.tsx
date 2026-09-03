/*
 * Hero background: sparse signals drift in from the left, converge on a
 * single vertical gate at ~62% width, and leave as one clean line. Pure
 * CSS/SVG motion (see brand.css), static under reduced motion, masked so
 * it stays faint behind the headline. The parent must be position:relative;
 * put the hero content in a sibling with position:relative so it stacks above.
 */

const GATE_X = 744;
const GATE_Y = 300;
const RAIL_Y = [96, 168, 240, 312, 384, 456, 528];

function railPath(y: number) {
  const bend = 300 + (y - GATE_Y) * 0.18;
  return `M-40 ${y} C 280 ${y}, 520 ${bend}, ${GATE_X} ${GATE_Y}`;
}

const DOTS = [
  { x: 120, y: 168, delay: 0 },
  { x: 310, y: 96, delay: -3 },
  { x: 220, y: 312, delay: -6 },
  { x: 420, y: 456, delay: -2 },
  { x: 160, y: 528, delay: -8 },
  { x: 480, y: 240, delay: -5 },
];

export function SignalField({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`signal-field ${className}`.trim()}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sf-rail" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={GATE_X} y2="0">
          <stop offset="0" stopColor="#4B6BFF" stopOpacity="0" />
          <stop offset="0.45" stopColor="#4B6BFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#42F5B6" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="sf-out" gradientUnits="userSpaceOnUse" x1={GATE_X} y1="0" x2="1240" y2="0">
          <stop offset="0" stopColor="#42F5B6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#42F5B6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sf-gate" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="560">
          <stop offset="0" stopColor="#42F5B6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#42F5B6" stopOpacity="0.8" />
          <stop offset="1" stopColor="#42F5B6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sf-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
        <mask id="sf-mask">
          <rect x="-40" y="0" width="1280" height="600" fill="url(#sf-fade)" />
        </mask>
      </defs>

      <g mask="url(#sf-mask)">
        {RAIL_Y.map((y) => (
          <path key={y} className="sf-rail" d={railPath(y)} />
        ))}

        {DOTS.map((dot) => (
          <circle
            key={`${dot.x}-${dot.y}`}
            className="sf-dot"
            cx={dot.x}
            cy={dot.y}
            r="2"
            style={{ animationDelay: `${dot.delay}s` }}
          />
        ))}

        <path className="sf-pulse" d={railPath(168)} />
        <path className="sf-pulse is-second" d={railPath(384)} />
        <path className="sf-pulse is-third" d={railPath(240)} />

        <line className="sf-gate" x1={GATE_X} y1="40" x2={GATE_X} y2="560" />
        <circle className="sf-ring" cx={GATE_X} cy={GATE_Y} r="14" />
        <circle className="sf-node" cx={GATE_X} cy={GATE_Y} r="3.5" />

        <path className="sf-out" d={`M${GATE_X} ${GATE_Y} H 1240`} />
        <path className="sf-pulse is-out" d={`M${GATE_X} ${GATE_Y} H 1240`} />
      </g>
    </svg>
  );
}
