"use client";

import { useEffect, useState } from "react";
import { MaydaMark } from "@/components/MaydaMark";
import type { Locale } from "@/lib/i18n";
import { OS_COPY } from "@/components/os/osCopy";

const IDLE_MS = 75_000;

export function OsScreensaver({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale].screensaver;
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(true), IDLE_MS);
    };
    const wake = () => {
      setActive(false);
      arm();
    };
    const onSummon = () => setActive(true);

    arm();
    const events: Array<keyof WindowEventMap> = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"];
    for (const name of events) window.addEventListener(name, wake, { passive: true });
    window.addEventListener("os:screensaver", onSummon);
    return () => {
      window.clearTimeout(timer);
      for (const name of events) window.removeEventListener(name, wake);
      window.removeEventListener("os:screensaver", onSummon);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="os-screensaver" aria-hidden="true">
      <div className="os-screensaver-drift">
        <MaydaMark className="h-16 w-16 text-white" />
        <p>MAYDAOS — {copy.line}</p>
      </div>
      <span>{copy.wake}</span>
    </div>
  );
}
