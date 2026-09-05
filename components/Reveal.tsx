/* Static, server-rendered wrapper. Content never waits for a scroll observer. */
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type RevealTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "figure"
  | "ul"
  | "ol"
  | "li"
  | "p"
  | "span";

export function Reveal({
  as = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: RevealTag;
  delay?: number;
  className?: string;
  children?: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const mergedStyle: CSSProperties | undefined =
    delay > 0 ? { ...style, ["--reveal-delay" as string]: `${delay}ms` } : style;

  // Rendered through a dynamic JSX tag; typed as a div, drawn as `as`.
  const Tag = as as "div";

  return (
    <Tag
      {...rest}
      className={`reveal is-visible ${className}`.trim()}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
