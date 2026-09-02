/*
 * v3 identity: a typographic wordmark. The superscript multiplier is the
 * only ornament — MaydaLabs raised to ×. There is deliberately no drawn
 * logo; the favicon "M" is a placeholder, not a finalized mark.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`mayda-wordmark ${className}`}>
      MaydaLabs
      <i aria-hidden="true">×</i>
    </span>
  );
}
