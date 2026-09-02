/*
 * Two-lane pipeline diagram for /proof: which stages the machine runs and
 * where the human sits. Decorative; the numbered list next to it is the
 * accessible version. Hidden on narrow screens via CSS.
 */

type Stage = { key: string; label: string; lane: "machine" | "human"; highlight?: boolean };

const STAGES: Stage[] = [
  { key: "intake", label: "Intake", lane: "machine" },
  { key: "triage", label: "Triage", lane: "machine" },
  { key: "drafting", label: "Drafting", lane: "machine" },
  { key: "evidence", label: "Evidence", lane: "human" },
  { key: "approval", label: "Approval", lane: "human", highlight: true },
  { key: "publish", label: "Publish", lane: "machine" },
  { key: "reconcile", label: "Reconcile", lane: "machine" },
];

const LANE_Y = { machine: 78, human: 190 };
const X0 = 130;
const STEP = 128;

export function PipelineDiagram({
  laneLabels,
  className = "",
}: {
  laneLabels: { machine: string; human: string };
  className?: string;
}) {
  const points = STAGES.map((stage, index) => ({
    ...stage,
    x: X0 + index * STEP,
    y: LANE_Y[stage.lane],
  }));

  const connectors = points.slice(1).map((point, index) => {
    const previous = points[index];
    const midX = (previous.x + point.x) / 2;
    return `M${previous.x + 18} ${previous.y} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x - 18} ${point.y}`;
  });

  return (
    <svg
      className={`pipeline-diagram ${className}`}
      viewBox="0 0 940 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="pipeline-lane" x="8" y="38" width="924" height="80" rx="16" />
      <rect className="pipeline-lane is-human" x="8" y="150" width="924" height="80" rx="16" />
      <text className="pipeline-lane-label" x="28" y={LANE_Y.machine + 4}>
        {laneLabels.machine}
      </text>
      <text className="pipeline-lane-label is-mint" x="28" y={LANE_Y.human + 4}>
        {laneLabels.human}
      </text>

      {connectors.map((d, index) => (
        <path key={index} className="pipeline-connector" d={d} />
      ))}

      {points.map((point, index) => (
        <g key={point.key} transform={`translate(${point.x} ${point.y})`}>
          {point.highlight ? <circle className="pipeline-ring" r="26" /> : null}
          <circle className={`pipeline-node ${point.lane === "human" ? "is-human" : ""}`} r="18" />
          <text className="pipeline-number" textAnchor="middle" y="4">
            {String(index + 1).padStart(2, "0")}
          </text>
          <text
            className={`pipeline-stage ${point.highlight ? "is-mint" : ""}`}
            textAnchor="middle"
            y={point.lane === "machine" ? -30 : 40}
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
