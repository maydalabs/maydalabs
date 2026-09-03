"use client";

/*
 * Client half of the block clock: re-checks the tip every 60s while the tab
 * is visible and pings the mint dot when a new block lands.
 */
import { useEffect, useRef, useState } from "react";

export type BitcoinClockLocale = "en" | "tr" | "fr";
export type BitcoinClockVariant = "inline" | "badge";

const TIP_HEIGHT_URL = "https://mempool.space/api/blocks/tip/height";
const POLL_MS = 60_000;

const LABEL: Record<BitcoinClockLocale, string> = { en: "Block", tr: "Blok", fr: "Bloc" };
const TITLE: Record<BitcoinClockLocale, string> = {
  en: "Time here is measured in blocks.",
  tr: "Burada zaman blokla ölçülür.",
  fr: "Ici, le temps se mesure en blocs.",
};
const TAG: Record<BitcoinClockLocale, string> = { en: "en-US", tr: "tr-TR", fr: "fr-FR" };

export function BitcoinClockLive({
  initialHeight,
  locale,
  variant,
  className = "",
}: {
  initialHeight: number;
  locale: BitcoinClockLocale;
  variant: BitcoinClockVariant;
  className?: string;
}) {
  const [height, setHeight] = useState(initialHeight);
  const [tick, setTick] = useState(0);
  const heightRef = useRef(initialHeight);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(TIP_HEIGHT_URL, { cache: "no-store" });
        if (!response.ok) return;
        const next = Number.parseInt((await response.text()).trim(), 10);
        if (cancelled || !Number.isFinite(next) || next <= heightRef.current) return;
        heightRef.current = next;
        setHeight(next);
        setTick((value) => value + 1);
      } catch {
        // Keep the last known height; a stale clock beats a broken one.
      }
    };

    const id = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const formatted = new Intl.NumberFormat(TAG[locale]).format(height);

  return (
    <span className={`btc-clock is-${variant} ${className}`.trim()} title={TITLE[locale]}>
      <span key={tick} className={`btc-clock-dot ${tick > 0 ? "is-tick" : ""}`.trim()} aria-hidden="true" />
      <span className="btc-clock-label" suppressHydrationWarning>
        {LABEL[locale]} <b>{formatted}</b>
      </span>
    </span>
  );
}
