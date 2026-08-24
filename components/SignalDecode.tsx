"use client";

import { useEffect, useRef } from "react";

// Narrow glyphs only: scrambled text must never run wider than the final
// text, or the hero could re-wrap mid-decode and shift layout below it.
const GLYPHS = "aeikrstuvz01358·/=+|<>*";

type SignalDecodeProps = {
  text: string;
  delay?: number;
  className?: string;
};

export function SignalDecode({ text, delay = 0, className }: SignalDecodeProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chars = Array.from(text);
    const lockEvery = 30;
    let raf = 0;
    let start = 0;
    let frame = 0;

    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start - delay;

      if (elapsed < 0) {
        raf = window.requestAnimationFrame(tick);
        return;
      }

      const locked = Math.floor(elapsed / lockEvery);
      if (locked >= chars.length) {
        node.textContent = text;
        node.classList.add("is-locked");
        return;
      }

      frame += 1;
      if (frame % 2) {
        let out = "";
        for (let index = 0; index < chars.length; index += 1) {
          const char = chars[index];
          out += index < locked || char === " " || char === " "
            ? char
            : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        node.textContent = out;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [text, delay]);

  return (
    <span ref={ref} className={`signal-decode ${className ?? ""}`}>
      {text}
    </span>
  );
}
