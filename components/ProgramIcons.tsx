export type ProgramVisualId =
  | "baseline-scan"
  | "momentum-sprint"
  | "growth-loop";

export function ProgramBadgeIcon({
  id,
  isFeatured = false,
  badgeClassName = "h-8 w-8 rounded-lg",
  glyphClassName = "h-4 w-4",
}: {
  id: ProgramVisualId;
  isFeatured?: boolean;
  badgeClassName?: string;
  glyphClassName?: string;
}) {
  const alt =
    id === "momentum-sprint"
      ? "Momentum Sprint program icon"
      : id === "baseline-scan"
        ? "Baseline Scan program icon"
        : "Growth Loop program icon";

  const iconTone =
    id === "momentum-sprint"
      ? "border-emerald-300/40 text-emerald-200"
      : id === "baseline-scan"
        ? "border-sky-300/40 text-sky-200"
        : "border-violet-300/40 text-violet-200";

  const featuredGlow =
    isFeatured && id === "momentum-sprint"
      ? "md:drop-shadow-[0_0_14px_rgba(34,211,238,0.55)]"
      : "";

  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-flex items-center justify-center border bg-slate-950/80 ${badgeClassName} ${iconTone} ${featuredGlow}`}
    >
      <ProgramGlyph id={id} className={glyphClassName} />
    </span>
  );
}

function ProgramGlyph({
  id,
  className,
}: {
  id: ProgramVisualId;
  className: string;
}) {
  if (id === "baseline-scan") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" />
      </svg>
    );
  }

  if (id === "momentum-sprint") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13.2 2 5 13h5.3L9.8 22 19 11h-5.3L13.2 2Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7h7a4 4 0 1 1 0 8H9" />
      <path d="m7 7 2.5-2.5M7 7l2.5 2.5" />
      <path d="M17 17h-7a4 4 0 1 1 0-8h5" />
      <path d="m17 17-2.5 2.5M17 17l-2.5-2.5" />
    </svg>
  );
}
