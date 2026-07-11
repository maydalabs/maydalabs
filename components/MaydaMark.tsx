type MaydaMarkProps = {
  className?: string;
};

export function MaydaMark({ className = "" }: MaydaMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={`mayda-mark ${className}`}
      viewBox="0 0 40 40"
      fill="none"
    >
      <path
        className="mayda-mark-gate mayda-mark-gate-left"
        d="M6 5H11L17 11V29L11 35H6V5Z"
        fill="currentColor"
      />
      <path
        className="mayda-mark-gate mayda-mark-gate-right"
        d="M34 5H29L23 11V29L29 35H34V5Z"
        fill="currentColor"
      />
      <circle className="mayda-mark-signal" cx="20" cy="20" r="3.5" fill="#F39A36" />
    </svg>
  );
}
