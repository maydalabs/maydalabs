/*
 * Small line-icon set in the Multiplier Field language: 24px grid, 1.6px
 * strokes, currentColor. Decorative by default (aria-hidden); pass a
 * `title` when an icon carries meaning on its own.
 */

export type IconName =
  | "source"
  | "gate"
  | "pipeline"
  | "bitcoin"
  | "shield"
  | "clock"
  | "report"
  | "key"
  | "feed"
  | "filter"
  | "draft"
  | "publish"
  | "reconcile"
  | "scope"
  | "install"
  | "human"
  | "machine"
  | "wallet";

const PATHS: Record<IconName, React.ReactNode> = {
  source: (
    <>
      <path d="M10 14a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66l-1.41 1.41" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-2.83 2.83a4 4 0 0 0 5.66 5.66l1.41-1.41" />
    </>
  ),
  gate: (
    <>
      <path d="M4 4h5M15 4h5v16h-5M4 20h5" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </>
  ),
  pipeline: (
    <>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <path d="M7.2 12h2.6M14.2 12h2.6" />
    </>
  ),
  bitcoin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 7.5h4a2 2 0 0 1 0 4h-4zM9.5 11.5h4.5a2 2 0 0 1 0 4h-4.5zM9.5 7.5v8M11 6v1.5M11 15.5V17M13 6v1.5M13 15.5V17" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  report: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16V10M12 16V6M17 16v-3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H21M18 12v3M15 12v2.5" />
    </>
  ),
  feed: (
    <>
      <path d="M5 19a1 1 0 1 0 0-.01" />
      <path d="M5 12a7 7 0 0 1 7 7M5 5a14 14 0 0 1 14 14" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />
    </>
  ),
  draft: (
    <>
      <path d="M6 20h12a1 1 0 0 0 1-1V8l-4-4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1z" />
      <path d="M14 4v4h4M9 13h6M9 16h4" />
    </>
  ),
  publish: (
    <>
      <path d="M12 16V5M8 9l4-4 4 4" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </>
  ),
  reconcile: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" />
      <path d="M17.5 3.5v3h-3M6.5 20.5v-3h3" />
      <path d="M9.5 12l1.8 1.8 3.5-3.5" />
    </>
  ),
  scope: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </>
  ),
  install: (
    <>
      <path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
      <path d="M12 4v10M8 10l4 4 4-4" />
    </>
  ),
  human: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  machine: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12v4H6a2 2 0 0 1-2-2z" />
      <path d="M4 7v10a2 2 0 0 0 2 2h14V9H6" />
      <circle cx="16" cy="14" r="1.2" />
    </>
  ),
};

export function Icon({
  name,
  className = "mayda-icon",
  title,
}: {
  name: IconName;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

export function IconBox({ name, tone = "cobalt" }: { name: IconName; tone?: "cobalt" | "mint" }) {
  return (
    <span className={`mayda-icon-box ${tone === "mint" ? "is-mint" : ""}`}>
      <Icon name={name} />
    </span>
  );
}
