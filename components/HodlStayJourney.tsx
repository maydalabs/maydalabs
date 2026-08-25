"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { playTick } from "@/lib/soundSignal";

const SLIDES = [
  "/work/journey/journey-01-home.jpg",
  "/work/journey/journey-02-browse.jpg",
  "/work/journey/journey-03-stay.jpg",
  "/work/journey/journey-04-japan.jpg",
  "/work/journey/journey-05-conferences.jpg",
  "/work/journey/journey-06-host.jpg",
] as const;

const CAPTIONS: Record<Locale, readonly string[]> = {
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
};

const HOLD_MS = 4300;

// A guided slide reel through the real HodlStay experience, captured
// from the product itself: guest journey, range, conferences, and the
// host door. Auto-plays, pauses on hover, fully navigable by hand.
export function HodlStayJourney({ locale, sizes = "540px" }: { locale: Locale; sizes?: string }) {
  const captions = CAPTIONS[locale];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
      playTick();
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [index, paused]);

  const step = (direction: number) => {
    setIndex((current) => (current + direction + SLIDES.length) % SLIDES.length);
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
        {SLIDES.map((src, slideIndex) => (
          <Image
            key={src}
            src={src}
            alt={captions[slideIndex]}
            fill
            sizes={sizes}
            priority={slideIndex === 0}
            className={slideIndex === index ? "is-active" : ""}
          />
        ))}
        <span className="hodl-journey-live" aria-hidden="true">● CAPTURED FROM THE LIVE PRODUCT</span>
      </div>
      <div className="hodl-journey-progress" aria-hidden="true">
        <i key={index} style={{ animationDuration: `${HOLD_MS}ms`, animationPlayState: paused ? "paused" : "running" }} />
      </div>
      <figcaption className="hodl-journey-bar">
        <button type="button" onClick={() => step(-1)} aria-label="‹">‹</button>
        <p><span>{String(index + 1).padStart(2, "0")}/{String(SLIDES.length).padStart(2, "0")}</span> {captions[index]}</p>
        <button type="button" onClick={() => step(1)} aria-label="›">›</button>
      </figcaption>
    </figure>
  );
}
