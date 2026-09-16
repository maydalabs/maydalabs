/* An empty pane, centred.
 *
 * Every pane but the conversation rendered its empty state as one grey
 * paragraph glued to the top-left of a 600px window, which reads as a failed
 * load rather than as a state. These are the most-seen screens in the product
 * and they had the least attention.
 */
export function OsPaneEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="os-pane-empty">
      <strong>{children}</strong>
    </div>
  );
}
