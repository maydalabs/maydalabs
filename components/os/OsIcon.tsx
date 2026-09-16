/* Icons, drawn rather than chosen.
 *
 * The desk shipped with geometric glyphs — ◆ ▶ ≡ — because picking an icon
 * set is a decision and I did not want to make it badly. They looked like
 * what they were. These are a small set, stroked on a 24 grid at a single
 * weight, inheriting colour and sizing from their parent: fewer icons drawn
 * consistently reads better than a thousand borrowed ones that do not agree
 * with each other.
 */

export type OsIconName =
  | "cofounder"
  | "needs-you"
  | "running"
  | "record"
  | "memory"
  | "company"
  | "search"
  | "close"
  | "minimize"
  | "leave"
  | "new";

const PATHS: Record<OsIconName, React.ReactNode> = {
  /* Two overlapping rings: a partnership, not a sparkle.
   *
   * The sparkle is the most worn icon in the category, and this product's
   * whole argument is that it is not another chat window. An icon that says
   * "AI inside" before anything else has conceded the point. */
  cofounder: (
    <>
      <circle cx="9.2" cy="12" r="5.6" />
      <circle cx="14.8" cy="12" r="5.6" />
    </>
  ),
  // A tray with something resting in it, waiting.
  "needs-you": (
    <>
      <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" />
      <path d="M5.4 5.4h13.2l1.9 8.1v4a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-4l1.9-8.1Z" />
    </>
  ),
  // A pulse: something is happening without you.
  running: <path d="M2.5 12h4l2.5-6 4 12 2.5-6h6" />,
  // Ruled lines, one of them marked.
  record: (
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" />
      <path d="M2 6.5h.01M2 12h.01M2 17.5h.01" />
    </>
  ),
  // A bookmark: something kept on purpose.
  memory: <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" />,
  company: (
    <>
      <path d="M4 20.5V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14.5" />
      <path d="M14 10h5a1 1 0 0 1 1 1v9.5" />
      <path d="M2.5 20.5h19M7.5 8.5h3M7.5 12h3M7.5 15.5h3M17 14h0M17 17.5h0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  close: <path d="m7 7 10 10M17 7 7 17" />,
  minimize: <path d="M6 12h12" />,
  leave: (
    <>
      <path d="M14 20.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h8" />
      <path d="M10 12h10.5m0 0-3.5-3.5M20.5 12 17 15.5" />
    </>
  ),
  new: <circle cx="12" cy="12" r="4" />,
};

export function OsIcon({ name, size = 16 }: { name: OsIconName; size?: number }) {
  return (
    <svg
      className="os-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
