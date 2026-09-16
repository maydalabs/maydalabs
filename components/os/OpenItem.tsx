"use client";

import { OS_OPEN_ITEM_EVENT } from "@/components/os/types";

/* The title of a work item, as the thing you press to open it.
 *
 * It reaches the shell through a window event, the same route ⌘K uses to hand
 * a sentence to the conversation: the queue is rendered on the server and the
 * shell is not, so there is no prop to pass. A row that opens on its title is
 * how every list in every desktop works; a row you cannot open is a report.
 */
export function OpenItem({ id, title, label }: { id: string; title: string; label: string }) {
  return (
    <button
      type="button"
      className="os-open-item"
      // Not `title`: a title attribute wins the accessible name, so every row
      // announced itself as "Open" and nothing else. The item's own name is
      // the name, and the verb is prefixed for anyone hearing rather than
      // seeing it.
      aria-label={`${label}: ${title}`}
      onClick={() => window.dispatchEvent(new CustomEvent(OS_OPEN_ITEM_EVENT, { detail: id }))}
    >
      {title}
    </button>
  );
}
