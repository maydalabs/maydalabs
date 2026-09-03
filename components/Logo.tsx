/*
 * MaydaLabs mark — "Block gate", chosen by Mehmet on 3 Sep 2026 and polished
 * as variant B: one block of the chain; inside it two signal strands
 * converge into the human gate bar and leave as a single approved dot.
 * One stroke weight, cobalt → mint on dark; `mono` uses currentColor.
 * The other candidates live on /brand-preview for the record.
 */

const GRADIENT_ID = "mayda-logo-gradient";

function Gradient({ id, x1 = 4, x2 = 28 }: { id: string; x1?: number; x2?: number }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1="0" x2={x2} y2="0">
        <stop offset="0" stopColor="#4B6BFF" />
        <stop offset="1" stopColor="#42F5B6" />
      </linearGradient>
    </defs>
  );
}

/* The interior: strands → gate → dot. Shared by the mark, the badge, and
 * the icons (see app/icon.svg and app/apple-icon.tsx for the same geometry). */
export function MarkInterior({ paint, strokeWidth }: { paint: string; strokeWidth: number }) {
  return (
    <g fill="none" stroke={paint} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 12.5C11.5 12.5 11 16 13 16" />
      <path d="M8.5 19.5C11.5 19.5 11 16 13 16" />
      <path d="M17 10V22" />
      <circle cx="22.5" cy="16" r="2.1" fill={paint} stroke="none" />
    </g>
  );
}

function MarkPaths({ paint, strokeWidth }: { paint: string; strokeWidth: number }) {
  return (
    <>
      <rect x="4" y="4" width="24" height="24" rx="6.5" fill="none" stroke={paint} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <MarkInterior paint={paint} strokeWidth={strokeWidth} />
    </>
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
  const paint = mono ? "currentColor" : `url(#${id})`;
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
      <MarkPaths paint={paint} strokeWidth={2.7} />
    </svg>
  );
}

/*
 * Companion badge for payments content: the same block with the two serif
 * ticks that run past the top and bottom the way ₿'s do. Not a ₿ — the
 * inside is still the gate.
 */
export function LogoMarkBitcoin({ size = 32, className = "", mono = false, title }: MarkProps) {
  const id = `${GRADIENT_ID}-badge`;
  const paint = mono ? "currentColor" : `url(#${id})`;
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
      <g transform="translate(16 16) scale(0.86) translate(-16 -16)">
        <MarkPaths paint={paint} strokeWidth={2.9} />
      </g>
      {/* The ₿-style serifs carry the one orange in the mark family. */}
      <g stroke={mono ? "currentColor" : "#F7931A"} strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 1.6v2.2M20 1.6v2.2M12 28.2v2.2M20 28.2v2.2" />
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
