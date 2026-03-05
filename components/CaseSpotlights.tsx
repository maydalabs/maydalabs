"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getCaseImageSource } from "@/lib/assets";
import { getIntroCallUrl } from "@/lib/marketingLinks";

type CaseSlide = {
  id: string;
  label: string;
  client: string;
  headline: string;
  summary: string;
  kpis: { value: string; label: string }[];
  quote?: string;
  quoteAuthor?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  cardSide: "left" | "right";
  overlayOpacity?: number;
  imageDesktop: string;
  imageMobile?: string;
};

const CASE_INTRO_CALL_URL = getIntroCallUrl("case");

const SLIDES: CaseSlide[] = [
  {
    id: "airbtc",
    label: "Case spotlight",
    client: "AirBTC",
    headline: "From BTC idea to bookable stays.",
    summary:
      "We built the v1 booking funnel, account surfaces, and lifecycle flows for a Bitcoin-only travel marketplace.",
    kpis: [
      { value: "+47%", label: "listing → inquiry rate" },
      { value: "+31%", label: "inquiry → booking rate" },
      { value: "90d", label: "from concept to live v1" },
    ],
    quote:
      "They didn’t just design screens—they shipped a booking flow we can actually grow on.",
    quoteAuthor: "Founder, AirBTC",
    primaryCta: {
      label: "Book a 15-min Intro Call",
      href: CASE_INTRO_CALL_URL,
    },
    secondaryCta: {
      label: "View case",
      href: "/cases/airbtc",
    },
    cardSide: "left",
    overlayOpacity: 0.65,
    imageDesktop: "/images/cases/airbtc-desktop.jpg",
    imageMobile: "/images/cases/airbtc-mobile.jpg",
  },
  {
    id: "satoshi-gazette",
    label: "Case spotlight",
    client: "Satoshi Gazette",
    headline: "Bitcoin news desk built like a product.",
    summary:
      "Editorial consoles, submission flows, and internal tools for a Bitcoin-only news desk.",
    kpis: [
      { value: "4", label: "operator consoles" },
      { value: "3", label: "submission paths" },
      { value: "1", label: "internal assistant" },
    ],
    quote: "Feels like an internal tool we actually want to use every day.",
    quoteAuthor: "Editorial lead, Satoshi Gazette",
    primaryCta: {
      label: "Book a 15-min Intro Call",
      href: CASE_INTRO_CALL_URL,
    },
    secondaryCta: {
      label: "View case",
      href: "/cases/satoshi-gazette",
    },
    cardSide: "right",
    overlayOpacity: 0.7,
    imageDesktop: "/images/cases/satoshi-gazette-desktop.jpg",
    imageMobile: "/images/cases/satoshi-gazette-mobile.jpg",
  },
  {
    id: "coin-mining-central",
    label: "Case spotlight",
    client: "Coin Mining Central",
    headline: "High-ticket hardware flows that don’t stall out.",
    summary:
      "Tightened the ASIC buyer journey from price discovery to structured enquiry and follow-up.",
    kpis: [
      { value: "End-to-end", label: "quote → order flow" },
      { value: "Structured", label: "ASIC product specs" },
      { value: "Playbooks", label: "for high-ticket leads" },
    ],
    quote: "The sales flow finally matched the size and complexity of what we sell.",
    quoteAuthor: "Director, Coin Mining Central",
    primaryCta: {
      label: "Book a 15-min Intro Call",
      href: CASE_INTRO_CALL_URL,
    },
    secondaryCta: {
      label: "View case",
      href: "/cases/coin-mining-central",
    },
    cardSide: "left",
    overlayOpacity: 0.7,
    imageDesktop: "/images/cases/coin-mining-central-desktop.jpg",
    imageMobile: "/images/cases/coin-mining-central-mobile.jpg",
  },
  {
    id: "independent-check",
    label: "Case spotlight",
    client: "Independent Check",
    headline: "Due-diligence that behaves like a product.",
    summary:
      "Structured intake, report workflows, and lifecycle touchpoints around each independent check.",
    kpis: [
      { value: "Structured", label: "intake + briefs" },
      { value: "Single", label: "console for checks" },
      { value: "Repeatable", label: "follow-up sequences" },
    ],
    quote: "The process feels like a product, not one-off consulting.",
    quoteAuthor: "Founder, Independent Check",
    primaryCta: {
      label: "Book a 15-min Intro Call",
      href: CASE_INTRO_CALL_URL,
    },
    secondaryCta: {
      label: "View case",
      href: "/cases/independent-check",
    },
    cardSide: "right",
    overlayOpacity: 0.65,
    imageDesktop: "/images/cases/independent-check-desktop.jpg",
    imageMobile: "/images/cases/independent-check-mobile.jpg",
  },
];

const AUTOPLAY_MS = 8000;

function CaseImagePlaceholder({
  client,
  headline,
  className,
  isActive
}: {
  client: string;
  headline: string;
  className: string;
  isActive: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 items-end overflow-hidden ${className}`}
    >
      <div
        className={`absolute inset-0 bg-[radial-gradient(110%_90%_at_20%_15%,rgba(45,212,191,0.18),transparent_55%),radial-gradient(90%_120%_at_85%_20%,rgba(59,130,246,0.22),transparent_60%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92))] ${
          isActive ? "case-ken-burns" : ""
        }`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgba(2,6,23,0.75)_72%,rgba(2,6,23,0.95)_100%)]" />
      <div className="relative z-[1] m-6 max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.7)] backdrop-blur-sm">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
          Visual preview coming soon
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-50">{client}</p>
        <p className="mt-1 text-xs text-slate-300">{headline}</p>
      </div>
    </div>
  );
}

export function CaseSpotlights() {
  const [active, setActive] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerStartX = useRef<number | null>(null);

  // prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // visibility (pause when off-screen)
  useEffect(() => {
    if (typeof window === "undefined" || !stageRef.current) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    observer.observe(stageRef.current);

    return () => observer.disconnect();
  }, []);

  const canAutoplay =
    !prefersReducedMotion && isVisible && !isHovered && SLIDES.length > 1;

  // autoplay
  useEffect(() => {
    if (!canAutoplay) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [canAutoplay]);

  const goTo = (index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  };

  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  // swipe
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    pointerStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current == null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <section
      id="case-spotlights"
      aria-label="Case spotlights"
      className="relative"
    >
      {/* Kicker aligned with main container – match hero style */}
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 pt-4 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Selected work
      </div>

      {/* Full-bleed, full-height stage (no extra bg, images do the work) */}
      <div
        ref={stageRef}
        className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
        style={{
          minHeight: "calc(100vh - var(--chrome-height))",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {SLIDES.map((slide, index) => {
          const isActive = index === active;
          const scrimDir =
            slide.cardSide === "right"
              ? "bg-gradient-to-l"
              : "bg-gradient-to-r";
          const cardSideClass =
            slide.cardSide === "right"
              ? "mx-auto lg:ml-auto lg:mr-0"
              : "mx-auto lg:mr-auto lg:ml-0";

          const overlay = slide.overlayOpacity ?? 0.65;
          const fromOpacityClass =
            overlay >= 0.75
              ? "from-slate-950/80"
              : overlay >= 0.65
              ? "from-slate-950/70"
              : "from-slate-950/60";
          const desktopAsset = getCaseImageSource(slide.imageDesktop);
          const mobileAsset = getCaseImageSource(
            slide.imageMobile ?? slide.imageDesktop
          );

          return (
            <article
              key={slide.id}
              aria-roledescription="slide"
              aria-label={`${slide.client} case`}
              aria-hidden={isActive ? "false" : "true"}
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* Background image – full bleed with Ken Burns */}
              <div className="absolute inset-0">
                <div className="absolute inset-0">
                  {desktopAsset.kind === "image" ? (
                    <Image
                      src={desktopAsset.src}
                      alt=""
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className={`hidden h-full w-full object-cover md:block ${
                        isActive ? "case-ken-burns" : ""
                      }`}
                    />
                  ) : (
                    <CaseImagePlaceholder
                      client={slide.client}
                      headline={slide.headline}
                      className="hidden md:flex"
                      isActive={isActive}
                    />
                  )}
                  {mobileAsset.kind === "image" ? (
                    <Image
                      src={mobileAsset.src}
                      alt=""
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className={`h-full w-full object-cover md:hidden ${
                        isActive ? "case-ken-burns" : ""
                      }`}
                    />
                  ) : (
                    <CaseImagePlaceholder
                      client={slide.client}
                      headline={slide.headline}
                      className="flex md:hidden"
                      isActive={isActive}
                    />
                  )}
                </div>

                {/* Scrim */}
                <div
                  className={`absolute inset-0 ${scrimDir} ${fromOpacityClass} via-slate-950/40 to-transparent`}
                />
                {/* Soft vignette */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_65%,transparent_0%,rgba(0,0,0,0.4)_72%)]" />
              </div>

              {/* Foreground card */}
              <div className="relative z-10 flex h-full items-center">
                <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
                  <div
                    className={`max-w-xl rounded-3xl border border-border/80 bg-surface/95 px-5 py-5 text-left shadow-[0_28px_90px_rgba(0,0,0,0.85)] backdrop-blur-md sm:px-6 sm:py-6 md:px-8 md:py-7 ${cardSideClass}`}
                  >
                    <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mayda-teal-soft">
                      {slide.label}
                    </p>
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                      {slide.client}
                    </p>
                    <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-[32px] md:leading-snug">
                      {slide.headline}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-muted sm:text-[0.95rem]">
                      {slide.summary}
                    </p>

                    {/* KPIs */}
                    <ul className="mt-4 flex flex-wrap gap-3 sm:gap-4">
                      {slide.kpis.map((kpi) => (
                        <li
                          key={kpi.label}
                          className="min-w-[150px] flex-1 rounded-2xl border border-border/70 bg-surface-alt/80 px-3 py-3 text-left shadow-sm sm:min-w-[160px] sm:px-4"
                        >
                          <div className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                            {kpi.value}
                          </div>
                          <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
                            {kpi.label}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* Quote – hidden on very small screens */}
                    {slide.quote && (
                      <figure className="mt-4 hidden max-w-xl text-sm text-muted sm:block">
                        <blockquote className="italic text-slate-200">
                          “{slide.quote}”
                        </blockquote>
                        {slide.quoteAuthor && (
                          <figcaption className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                            — {slide.quoteAuthor}
                          </figcaption>
                        )}
                      </figure>
                    )}

                    {/* CTAs – hero-consistent primary label */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={slide.primaryCta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={primaryCtaClasses}
                      >
                        {slide.primaryCta.label}
                      </a>

                      {slide.secondaryCta && (
                        <Link
                          href={slide.secondaryCta.href}
                          className="inline-flex items-center justify-center rounded-full border border-border bg-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted hover:border-mayda-teal/70 hover:text-foreground"
                        >
                          {slide.secondaryCta.label}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {/* Arrows */}
        {SLIDES.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous case"
              onClick={prev}
              className="absolute left-4 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-muted shadow-lg backdrop-blur transition hover:border-mayda-teal/70 hover:text-foreground"
            >
              <span className="sr-only">Previous</span>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M15 6l-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next case"
              onClick={next}
              className="absolute right-4 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface/90 text-muted shadow-lg backdrop-blur transition hover:border-mayda-teal/70 hover:text-foreground"
            >
              <span className="sr-only">Next</span>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M9 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {SLIDES.length > 1 && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-3 py-1.5 text-muted shadow-md backdrop-blur">
              {SLIDES.map((slide, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Show ${slide.client} case`}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      isActive
                        ? "pointer-events-auto bg-mayda-teal-soft shadow-[0_0_0_1px_rgba(15,23,42,0.9)]"
                        : "pointer-events-auto bg-slate-500/60 hover:bg-slate-300/80"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
