/*
 * MaydaLabs mark ("Check-M", chosen 3 Sep 2026): an M whose two legs are
 * the gate posts and whose inner stroke IS a check — the approval is the
 * letter itself. Three strokes, one weight, cobalt → mint on dark; `mono`
 * uses currentColor. Candidates that lost live on /brand-preview.
 */

const GRADIENT_ID = "mayda-logo-gradient";

function Gradient({ id, x1 = 6, x2 = 26 }: { id: string; x1?: number; x2?: number }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1="0" x2={x2} y2="0">
        <stop offset="0" stopColor="#4B6BFF" />
        <stop offset="1" stopColor="#42F5B6" />
      </linearGradient>
    </defs>
  );
}

function MarkPaths({ strokeWidth }: { strokeWidth: number }) {
  return (
    <g fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 26V6" />
      <path d="M25 26V6" />
      <path d="M7 13.5 13 20.5 25 6" />
    </g>
  );
}

type MarkProps = {
  size?: number;
  className?: string;
  mono?: boolean;
  title?: string;
};

export function LogoMark({ size = 28, className = "", mono = false, title }: MarkProps) {
  const id = `${GRADIENT_ID}-mark`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {mono ? null : <Gradient id={id} />}
      <g stroke={mono ? "currentColor" : `url(#${id})`}>
        <MarkPaths strokeWidth={2.7} />
      </g>
    </svg>
  );
}

/*
 * Companion badge for payments content: the mark inside a coin ring, its
 * two legs continuing through the ring as ₿'s serifs do. Not a ₿ — the
 * inside is still the gate.
 */
export function LogoMarkBitcoin({ size = 32, className = "", mono = false, title }: MarkProps) {
  const id = `${GRADIENT_ID}-badge`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {mono ? null : <Gradient id={id} x1={3} x2={29} />}
      <g
        stroke={mono ? "currentColor" : `url(#${id})`}
        fill="none"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="16" cy="16" r="12.5" />
        <path d="M11.25 1.4v2M20.75 1.4v2M11.25 28.6v2M20.75 28.6v2" />
        <g transform="translate(16 16) scale(0.56) translate(-16 -16)">
          <MarkPaths strokeWidth={3.6} />
        </g>
      </g>
    </svg>
  );
}

export function Logo({
  className = "",
  withWordmark = true,
  mono = false,
}: {
  className?: string;
  withWordmark?: boolean;
  mono?: boolean;
}) {
  return (
    <span className={`mayda-logo ${mono ? "is-mono" : ""} ${className}`.trim()}>
      <LogoMark className="mayda-logo-mark" size={26} mono={mono} />
      {withWordmark ? (
        <span className="mayda-wordmark">
          MaydaLabs
          <i aria-hidden="true">×</i>
        </span>
      ) : null}
    </span>
  );
}
