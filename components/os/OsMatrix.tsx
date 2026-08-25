"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "アカサタナハマヤラワイキシチニ0123456789MAYDALBS░▒<>+=";

// The `matrix` shell command summons a brand-orange glyph rain over the
// whole screen. Any key or click wakes you; it also stops on its own.
export function OsMatrix() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onTrigger = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setActive(true);
    };
    window.addEventListener("os:matrix", onTrigger);
    return () => window.removeEventListener("os:matrix", onTrigger);
  }, []);

  useEffect(() => {
    if (!active) return;
    const stop = () => setActive(false);
    const timer = setTimeout(stop, 12_000);
    window.addEventListener("keydown", stop);
    window.addEventListener("pointerdown", stop);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
    };
  }, [active]);

  if (!active) return null;
  return <MatrixRain />;
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const size = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    size();
    window.addEventListener("resize", size);

    const columnWidth = 17;
    const columns = Math.ceil(canvas.width / columnWidth);
    const drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));

    context.fillStyle = "#0a0a09";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const interval = setInterval(() => {
      context.fillStyle = "rgba(10, 10, 9, 0.1)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = "15px monospace";
      for (let column = 0; column < drops.length; column += 1) {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = column * columnWidth;
        const y = drops[column] * 17;
        context.fillStyle = Math.random() > 0.9 ? "#f2f0ea" : "#f7931a";
        context.fillText(glyph, x, y);
        drops[column] += 1;
        if (y > canvas.height && Math.random() > 0.975) drops[column] = 0;
      }
    }, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <div className="os-matrix" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
