import type { ReactNode } from "react";

/*
 * Minimal, safe rich text for operator-authored bodies (proposal samples,
 * reports). Supports: blank-line paragraphs, "## " headings, "- " bullet
 * lists, and **bold** spans. Everything is rendered as text nodes, so no
 * HTML from the database ever reaches the page.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${index}`}>{part}</span>
    ),
  );
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className={`mayda-richtext ${className}`}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        if (lines.every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={blockIndex}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.trim().slice(2), `${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("## ")) {
          return <h4 key={blockIndex}>{inline(block.slice(3), `${blockIndex}`)}</h4>;
        }
        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {inline(line, `${blockIndex}-${lineIndex}`)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
