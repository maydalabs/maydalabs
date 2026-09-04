"use client";

import { useState } from "react";

/* Taking the work with you. The approved draft is the client's, so copying
 * it must not require selecting three paragraphs by hand. */
export function OsCopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="mayda-button mayda-button-outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? done : label}
    </button>
  );
}
