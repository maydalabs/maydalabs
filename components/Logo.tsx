import { useId } from "react";
import master from "@/brand/mark-geometry.json";

// Solid Gate, direction C approved September 5, 2026. All geometry comes from
// one master. Unique instance IDs prevent header/footer paint collisions.
type MarkProps = { size?: number; className?: string; mono?: boolean; title?: string };

export function LogoMark({ size = 28, className = "", mono = false, title }: MarkProps) {
  const instance = useId().replaceAll(":", "");
  const gradient = `${instance}-solid-gate-color`;
  const mask = `${instance}-solid-gate-cutout`;
  return (
    <svg className={className} width={size} height={size} viewBox={master.viewBox}
      xmlns="http://www.w3.org/2000/svg" aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined} focusable="false" data-logo="solid-gate-v1">
      {title ? <title>{title}</title> : null}
      <defs>
        {!mono ? <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1={master.gradient.x1} y1="16" x2={master.gradient.x2} y2="16">
          <stop stopColor={master.colors.cobalt} /><stop offset="1" stopColor={master.colors.mint} />
        </linearGradient> : null}
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
          <rect width="32" height="32" fill="white" />
          <g fill="none" stroke="black" strokeWidth={master.stroke} strokeLinecap="round" strokeLinejoin="round">
            <path d={master.inputs} /><path d={master.gate} />
          </g>
          <circle cx={master.dot[0]} cy={master.dot[1]} r={master.dot[2]} fill="black" />
        </mask>
      </defs>
      <path d={master.frame} fill={mono ? "currentColor" : `url(#${gradient})`} mask={`url(#${mask})`} />
    </svg>
  );
}

// Compatibility only: there is now one company mark, not a Bitcoin variant.
export const LogoMarkBitcoin = LogoMark;

export function Logo({ className = "", withWordmark = true, mono = false }: {
  className?: string; withWordmark?: boolean; mono?: boolean;
}) {
  return (
    <span className={`mayda-logo ${mono ? "is-mono" : ""} ${className}`.trim()}>
      <LogoMark className="mayda-logo-mark" size={26} mono={mono} />
      {withWordmark ? <span className="mayda-wordmark">MaydaLabs<i aria-hidden="true">×</i></span> : null}
    </span>
  );
}
