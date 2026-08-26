"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { playTick } from "@/lib/soundSignal";

type ReelData = {
  slides: readonly string[];
  captions: Record<Locale, readonly string[]>;
};

const HODLSTAY: ReelData = {
  slides: [
    "/work/journey/journey-01-home.jpg",
    "/work/journey/journey-02-browse.jpg",
    "/work/journey/journey-03-stay.jpg",
    "/work/journey/journey-04-japan.jpg",
    "/work/journey/journey-05-conferences.jpg",
    "/work/journey/journey-06-host.jpg",
  ],
  captions: {
    en: [
      "The storefront — sound money, open world",
      "Browse live stays across the world",
      "A property dossier built to book",
      "From Brazil to rural Japan",
      "Conference travel, productized",
      "Host operations live behind this door",
    ],
    tr: [
      "Vitrin — sound money, açık dünya",
      "Dünyanın dört yanından canlı ilanlar",
      "Rezervasyona götüren ilan sayfası",
      "Brezilya'dan Japonya kırsalına",
      "Konferans seyahati ürünleşti",
      "Ev sahibi operasyonları bu kapının ardında",
    ],
    fr: [
      "La vitrine — sound money, open world",
      "Des séjours en direct dans le monde entier",
      "Une fiche pensée pour réserver",
      "Du Brésil au Japon rural",
      "Le voyage de conférence, productisé",
      "Les opérations hôtes vivent derrière cette porte",
    ],
  },
};

const GAZETTE: ReelData = {
  slides: [
    "/work/gazette/gazette-01-edition.jpg",
    "/work/gazette/gazette-02-wire.jpg",
    "/work/gazette/gazette-03-markets.jpg",
    "/work/gazette/gazette-04-treasuries.jpg",
    "/work/gazette/gazette-05-mining.jpg",
  ],
  captions: {
    en: [
      "The daily edition — a Bitcoin-only front page",
      "The Wire — sourced, timestamped market hits",
      "Desks with a charter, not a feed",
      "Treasury ledger — verified filings only",
      "Mining data, live from mempool.space",
    ],
    tr: [
      "Günlük baskı — yalnızca Bitcoin'e ayrılmış manşet",
      "The Wire — kaynaklı, zaman damgalı haberler",
      "Rastgele akış değil, yayın ilkesi olan masalar",
      "Hazine defteri — yalnızca doğrulanmış beyanlar",
      "Madencilik verisi, mempool.space'ten canlı",
    ],
    fr: [
      "L'édition du jour — une une consacrée à Bitcoin",
      "The Wire — dépêches sourcées et horodatées",
      "Des desks avec une charte, pas un flux",
      "Registre des trésoreries — déclarations vérifiées",
      "Données de minage, en direct de mempool.space",
    ],
  },
};

const HOLD_MS = 4300;

// A guided slide reel through a real product, captured from the live
// deployment itself. Auto-plays, pauses on hover, fully navigable by hand.
function JourneyReel({ data, locale, sizes }: { data: ReelData; locale: Locale; sizes: string }) {
  const captions = data.captions[locale];
  const slides = data.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mountedSlides, setMountedSlides] = useState<Set<number>>(() => {
    const initial = new Set([0]);
    if (slides.length > 1) initial.add(1);
    if (slides.length > 2) initial.add(slides.length - 1);
    return initial;
  });

  const selectSlide = useCallback((nextIndex: number) => {
    const normalized = (nextIndex + slides.length) % slides.length;
    setMountedSlides((current) => {
      const next = new Set(current);
      next.add(normalized);
      next.add((normalized + 1) % slides.length);
      next.add((normalized - 1 + slides.length) % slides.length);
      return next.size === current.size ? current : next;
    });
    setIndex(normalized);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => {
      selectSlide(index + 1);
      playTick();
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [index, paused, selectSlide]);

  const step = (direction: number) => {
    selectSlide(index + direction);
  };

  return (
    <figure
      className="hodl-journey"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hodl-journey-stage">
        {slides.map((src, slideIndex) => mountedSlides.has(slideIndex) ? (
          <Image
            key={src}
            src={src}
            alt={slideIndex === index ? captions[slideIndex] : ""}
            aria-hidden={slideIndex !== index}
            fill
            sizes={sizes}
            className={slideIndex === index ? "is-active" : ""}
          />
        ) : null)}
        <span className="hodl-journey-live" aria-hidden="true">● CAPTURED FROM THE LIVE PRODUCT</span>
      </div>
      <div className="hodl-journey-progress" aria-hidden="true">
        <i key={index} style={{ animationDuration: `${HOLD_MS}ms`, animationPlayState: paused ? "paused" : "running" }} />
      </div>
      <figcaption className="hodl-journey-bar">
        <button type="button" onClick={() => step(-1)} aria-label="‹">‹</button>
        <p><span>{String(index + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}</span> {captions[index]}</p>
        <button type="button" onClick={() => step(1)} aria-label="›">›</button>
      </figcaption>
    </figure>
  );
}

export function HodlStayJourney({ locale, sizes = "540px" }: { locale: Locale; sizes?: string }) {
  return <JourneyReel data={HODLSTAY} locale={locale} sizes={sizes} />;
}

export function SatoshiGazetteJourney({ locale, sizes = "540px" }: { locale: Locale; sizes?: string }) {
  return <JourneyReel data={GAZETTE} locale={locale} sizes={sizes} />;
}
