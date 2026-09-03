"use client";

/*
 * Reveal-on-scroll wrapper: renders with class `reveal` and adds
 * `is-visible` once the element enters the viewport (IntersectionObserver,
 * fired once). The fade/rise lives in brand.css; under reduced motion the
 * CSS shows everything immediately with no transform.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

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
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer support: show immediately without a render cycle.
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const mergedStyle: CSSProperties | undefined =
    delay > 0 ? { ...style, ["--reveal-delay" as string]: `${delay}ms` } : style;

  // Rendered through a dynamic JSX tag; typed as a div, drawn as `as`.
  const Tag = as as "div";

  return (
    <Tag
      {...rest}
      ref={ref as Ref<HTMLDivElement>}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`.replace(/\s+/g, " ").trim()}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
