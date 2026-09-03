/*
 * The founder's review screen, abstracted: four AI drafts as bars and
 * source chips, one row in focus with Hold / Approve and its evidence
 * count. Focus walks down the queue every six seconds (brand.css); under
 * reduced motion the second row stays focused. Decorative — aria-hidden.
 */

const ROWS = [
  { y: 70, title: 214, chips: [54, 70, 46], evidence: 1 },
  { y: 130, title: 168, chips: [62, 48], evidence: 0.66 },
  { y: 190, title: 236, chips: [50, 74, 58], evidence: 1 },
  { y: 250, title: 190, chips: [66, 52], evidence: 0.33 },
];

const STATIC_ROW = 1;

export function ApprovalQueue({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-figure approval-queue ${className}`.trim()}
      viewBox="0 0 560 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="aq-panel" x="16" y="16" width="528" height="308" rx="14" />

      <rect className="aq-bar is-dim" x="36" y="36" width="76" height="8" rx="4" />
      <rect className="aq-bar is-faint" x="120" y="36" width="40" height="8" rx="4" />
      <text className="aq-label" x="524" y="43" textAnchor="end">
        REVIEW QUEUE
      </text>
      <line className="aq-divider" x1="16" y1="58" x2="544" y2="58" />

      {ROWS.map((row, index) => {
        let chipX = 58;
        return (
          <g key={row.y}>
            <circle className="aq-dot" cx="44" cy={row.y + 17} r="3" />
            <rect className="aq-bar" x="58" y={row.y + 12} width={row.title} height="9" rx="4.5" />
            {row.chips.map((width, chipIndex) => {
              const x = chipX;
              chipX += width + 8;
              return (
                <g key={chipIndex}>
                  <rect className="aq-chip" x={x} y={row.y + 29} width={width} height="12" rx="6" />
                  <circle className="aq-chip-dot" cx={x + 8} cy={row.y + 35} r="2" />
                </g>
              );
            })}
            <rect className="aq-track" x="436" y={row.y + 16} width="88" height="3" rx="1.5" />
            <rect
              className={`aq-fill ${row.evidence < 1 ? "is-partial" : ""}`.trim()}
              x="436"
              y={row.y + 16}
              width={88 * row.evidence}
              height="3"
              rx="1.5"
            />
            {index < ROWS.length - 1 ? (
              <line className="aq-divider is-soft" x1="28" y1={row.y + 52} x2="532" y2={row.y + 52} />
            ) : null}
          </g>
        );
      })}

      {ROWS.map((row, index) => (
        <g
          key={`focus-${row.y}`}
          className={`aq-focus ${index === STATIC_ROW ? "is-static" : ""}`.trim()}
          style={{ animationDelay: `${index * 6}s` }}
        >
          <rect className="aq-focus-bg" x="330" y={row.y + 6} width="204" height="40" rx="8" />
          <rect className="aq-focus-ring" x="26" y={row.y + 3} width="508" height="46" rx="10" />
          <circle className="aq-dot is-mint" cx="44" cy={row.y + 17} r="3" />
          <text className="aq-label is-mint" x="352" y={row.y + 30} textAnchor="end">
            Sources 3/3
          </text>
          <rect className="aq-btn-ghost" x="366" y={row.y + 15} width="52" height="22" rx="11" />
          <text className="aq-btn-text" x="392" y={row.y + 30} textAnchor="middle">
            Hold
          </text>
          <rect className="aq-btn-approve" x="428" y={row.y + 15} width="96" height="22" rx="11" />
          <text className="aq-btn-text is-dark" x="476" y={row.y + 30} textAnchor="middle">
            Approve
          </text>
        </g>
      ))}

      <text className="aq-label is-faint" x="36" y="314">
        Source · mempool.space
      </text>
      <text className="aq-label is-faint" x="524" y="314" textAnchor="end">
        Human approval
      </text>
    </svg>
  );
}
