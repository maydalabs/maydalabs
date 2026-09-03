/*
 * Bitcoin payments, drawn: an invoice goes over the rail (on-chain or
 * Lightning) into BTCPay Server, settles, and lands reconciled in the
 * ledger. One pulse rides the rail (brand.css); static under reduced
 * motion. Decorative — aria-hidden.
 */

const RAIL_Y = 104;
const NODES = { invoice: 64, btcpay: 240, settled: 380, ledger: 500 };

// ₿ from components/icons.tsx, minus its ring (24-unit grid).
const BTC_GLYPH =
  "M9.5 7.5h4a2 2 0 0 1 0 4h-4zM9.5 11.5h4.5a2 2 0 0 1 0 4h-4.5zM9.5 7.5v8M11 6v1.5M11 15.5V17M13 6v1.5M13 15.5V17";

export function PaymentsFlow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-figure payments-flow ${className}`.trim()}
      viewBox="0 0 560 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pf-rail" gradientUnits="userSpaceOnUse" x1="84" y1="0" x2="480" y2="0">
          <stop offset="0" stopColor="#4B6BFF" />
          <stop offset="1" stopColor="#42F5B6" />
        </linearGradient>
      </defs>

      <path className="pf-rail" d={`M84 ${RAIL_Y} H 480`} />
      <path className="pf-pulse" d={`M84 ${RAIL_Y} H 480`} />

      {/* Lightning on the rail */}
      <circle className="pf-void" cx="150" cy={RAIL_Y} r="12" />
      <path className="pf-bolt" d="M153 93l-8 12.5h6l-3 9.5 8.5-13h-6l2.5-9z" />

      {/* Invoice */}
      <g transform={`translate(${NODES.invoice} ${RAIL_Y})`}>
        <path className="pf-node" d="M-20-28h28l12 12v44h-40z" />
        <path className="pf-line-dim" d="M8-28v12h12" />
        <path className="pf-line-dim" d="M-10-4h20M-10 6h20M-10 16h10" />
      </g>

      {/* BTCPay Server */}
      <g transform={`translate(${NODES.btcpay} ${RAIL_Y})`}>
        <rect className="pf-ring" x="-38" y="-38" width="76" height="76" rx="18" />
        <rect className="pf-node is-primary" x="-32" y="-32" width="64" height="64" rx="14" />
        <g className="pf-btc" transform="scale(2.1) translate(-12.75 -11.5)">
          <path d={BTC_GLYPH} />
        </g>
      </g>

      {/* Settled */}
      <g transform={`translate(${NODES.settled} ${RAIL_Y})`}>
        <circle className="pf-node is-mint" r="20" />
        <path className="pf-check" d="M-8 0l5.5 5.5L9-6" />
      </g>

      {/* Reconciled ledger */}
      <g transform={`translate(${NODES.ledger} ${RAIL_Y})`}>
        <rect className="pf-node" x="-20" y="-26" width="40" height="52" rx="6" />
        <path className="pf-line-dim" d="M-10-12h20M-10-2h20" />
        <path className="pf-line-mint" d="M-10 8h12" />
        <path className="pf-check is-small" d="M6 9l2.5 2.5L14 6" />
      </g>

      <text className="pf-label" x={NODES.invoice} y="166" textAnchor="middle">
        Invoice
      </text>
      <text className="pf-label" x={NODES.btcpay} y="166" textAnchor="middle">
        BTCPay Server
      </text>
      <text className="pf-label is-mint" x={NODES.settled} y="166" textAnchor="middle">
        Settled
      </text>
      <text className="pf-label" x={NODES.ledger} y="166" textAnchor="middle">
        Reconciled
      </text>
    </svg>
  );
}
