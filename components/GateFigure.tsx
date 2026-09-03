/*
 * The approval-gate figure: many sources flow into the machine, pass
 * through a single human gate, and fan out as published outputs. This is
 * the product drawn as a picture. Decorative; the page text carries the
 * meaning. Pulses stop under prefers-reduced-motion (see field.css).
 */

const SOURCE_Y = [80, 140, 200, 260];
// One of the sources is the chain itself — the only orange in the hero.
const BTC_SOURCE_Y = 260;
const OUTPUT_Y = [110, 170, 230];
const MACHINE = { x: 190, y: 170 };
const GATE = { x: 350, y: 170 };

function sourcePath(y: number) {
  return `M24 ${y} C 90 ${y}, 120 ${MACHINE.y}, ${MACHINE.x - 26} ${MACHINE.y}`;
}

function outputPath(y: number) {
  return `M${GATE.x + 24} ${GATE.y} C 420 ${GATE.y}, 450 ${y}, 536 ${y}`;
}

export function GateFigure({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`field-figure gate-figure ${className}`}
      viewBox="0 0 560 340"
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

      {SOURCE_Y.map((y) => (
        <g key={y}>
          <path className={`field-line ${y === BTC_SOURCE_Y ? "is-btc" : ""}`} d={sourcePath(y)} />
          <circle className={`gate-source ${y === BTC_SOURCE_Y ? "is-btc" : ""}`} cx="24" cy={y} r="4" />
        </g>
      ))}

      <path className="field-line is-input" d={`M${MACHINE.x + 26} ${MACHINE.y} H ${GATE.x - 24}`} />

      {OUTPUT_Y.map((y) => (
        <g key={y}>
          <path className="field-line is-output" d={outputPath(y)} />
          <circle className="field-tip" cx="536" cy={y} r="4" />
        </g>
      ))}

      <path className="field-pulse" d={`${sourcePath(80)} H ${GATE.x - 24}`} />
      <path className="field-pulse is-second is-btc" d={`${sourcePath(260)} H ${GATE.x - 24}`} />
      <path className="field-pulse is-third" d={outputPath(170)} />

      <g className="gate-machine" transform={`translate(${MACHINE.x - 26} ${MACHINE.y - 26})`}>
        <rect width="52" height="52" rx="12" />
        <rect x="16" y="16" width="20" height="20" rx="4" />
        <path d="M26 8v8M26 36v8M8 26h8M36 26h8" />
      </g>

      <g className="gate-human" transform={`translate(${GATE.x} ${GATE.y})`}>
        <circle r="30" className="gate-ring" />
        <circle r="22" />
        <path d="M-9 1l6 6 12-12" />
      </g>

      <text className="gate-label" x="24" y="300" textAnchor="start">
        SOURCES
      </text>
      <text className="gate-label" x={MACHINE.x} y="300" textAnchor="middle">
        AI
      </text>
      <text className="gate-label is-mint" x={GATE.x} y="300" textAnchor="middle">
        HUMAN APPROVAL
      </text>
      <text className="gate-label" x="536" y="300" textAnchor="end">
        OUT
      </text>
    </svg>
  );
}
