type TraceVariant = "hero" | "panel";

type TraceConfig = {
  viewBox: string;
  basePath: string;
  echoPath: string;
  guides: string[];
  nodes: Array<{ cx: number; cy: number }>;
};

const TRACE_CONFIGS: Record<TraceVariant, TraceConfig> = {
  hero: {
    viewBox: "0 0 360 220",
    basePath:
      "M18 176C52 176 64 144 98 142C126 140 142 168 172 164C204 160 218 98 250 92C282 86 304 112 342 44",
    echoPath:
      "M18 190C62 186 74 156 110 152C140 149 156 174 186 168C214 162 232 112 262 106C294 100 314 116 342 72",
    guides: ["M18 192H342", "M18 140H342", "M18 88H342"],
    nodes: [
      { cx: 98, cy: 142 },
      { cx: 172, cy: 164 },
      { cx: 250, cy: 92 },
      { cx: 318, cy: 88 },
    ],
  },
  panel: {
    viewBox: "0 0 360 180",
    basePath:
      "M18 136C58 136 76 110 108 108C140 106 150 134 184 130C214 126 230 74 264 68C294 63 314 79 342 38",
    echoPath:
      "M18 148C66 146 84 120 118 118C148 116 160 138 194 134C224 130 242 88 274 82C304 76 324 90 342 60",
    guides: ["M18 154H342", "M18 112H342", "M18 70H342"],
    nodes: [
      { cx: 108, cy: 108 },
      { cx: 184, cy: 130 },
      { cx: 264, cy: 68 },
      { cx: 314, cy: 79 },
    ],
  },
};

export function GrowthTrace({
  className = "",
  variant = "hero",
}: {
  className?: string;
  variant?: TraceVariant;
}) {
  const trace = TRACE_CONFIGS[variant];

  return (
    <div
      aria-hidden="true"
      className={`growth-trace growth-trace--${variant}${className ? ` ${className}` : ""}`}
    >
      <svg
        viewBox={trace.viewBox}
        preserveAspectRatio="none"
        className="growth-trace-svg"
      >
        {trace.guides.map((guide, index) => (
          <path
            key={guide}
            d={guide}
            className={`growth-trace-guide ${
              index === 1 ? "growth-trace-guide--dashed" : ""
            }`}
          />
        ))}
        <path d={trace.echoPath} className="growth-trace-path growth-trace-path--echo" />
        <path d={trace.basePath} className="growth-trace-path growth-trace-path--base" />
        <path d={trace.basePath} className="growth-trace-signal" pathLength={150} />
        {trace.nodes.map((node, index) => (
          <circle
            key={`${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r="2.5"
            className={`growth-trace-node growth-trace-node--${index + 1}`}
          />
        ))}
      </svg>
    </div>
  );
}
