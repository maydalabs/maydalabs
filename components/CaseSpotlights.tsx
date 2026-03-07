"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { GrowthTrace } from "@/components/visuals/GrowthTrace";
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
  imageDesktop: string;
  imageMobile?: string;
  brandMarkSrc?: string;
};

const CASE_INTRO_CALL_URL = getIntroCallUrl("case");
const CASE_STUDIES_INDEX_HREF = "/case-studies";

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
      label: "View case studies",
      href: CASE_STUDIES_INDEX_HREF,
    },
    imageDesktop: "/images/cases/airbtc-desktop.jpg",
    imageMobile: "/images/cases/airbtc-mobile.jpg",
    brandMarkSrc: "/logos/brands/airbtc.png",
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
      label: "View case studies",
      href: CASE_STUDIES_INDEX_HREF,
    },
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
      label: "View case studies",
      href: CASE_STUDIES_INDEX_HREF,
    },
    imageDesktop: "/images/cases/coin-mining-central-desktop.jpg",
    imageMobile: "/images/cases/coin-mining-central-mobile.jpg",
    brandMarkSrc: "/logos/brands/coin-mining-central.png",
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
      label: "View case studies",
      href: CASE_STUDIES_INDEX_HREF,
    },
    imageDesktop: "/images/cases/independent-check-desktop.jpg",
    imageMobile: "/images/cases/independent-check-mobile.jpg",
    brandMarkSrc: "/logos/brands/independent-check.png",
  },
];

const AUTOPLAY_MS = 8000;

function formatCaseNumber(value: number) {
  return String(value).padStart(2, "0");
}

function CaseAtmosphereFallback({
  slide,
  className,
  isActive,
  compact = false,
}: {
  slide: CaseSlide;
  className: string;
  isActive: boolean;
  compact?: boolean;
}) {
  const backdropShellClasses = compact
    ? "left-[18%] right-[-16%] top-[16%] h-[64%]"
    : "left-[42%] right-[-4%] top-[10%] h-[72%]";

  const traceClasses = compact
    ? "absolute inset-y-[14%] left-[8%] right-[-24%] opacity-[0.18]"
    : "absolute inset-y-[8%] left-[36%] right-[-10%] opacity-[0.26]";

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,10,15,0.98),rgba(10,18,25,0.96)_44%,rgba(5,8,13,0.98))]" />
      <div className="absolute inset-0 bg-[radial-gradient(52%_66%_at_78%_18%,rgba(106,170,180,0.22),transparent_72%),radial-gradient(40%_40%_at_70%_72%,rgba(56,189,248,0.08),transparent_74%)]" />

      <div
        className={`absolute overflow-hidden rounded-[2.3rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,28,37,0.76),rgba(8,12,17,0.9))] shadow-[0_40px_120px_rgba(2,6,23,0.55)] blur-[0.8px] ${backdropShellClasses} ${
          isActive ? "case-ken-burns" : ""
        }`}
      >
        <div className="absolute inset-x-6 top-6 h-11 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(13,21,29,0.94),rgba(8,12,17,0.8))]" />
        <div className="absolute bottom-7 left-6 right-[34%] top-[5.75rem] rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,21,29,0.86),rgba(9,16,23,0.52))]">
          <div className="absolute inset-x-5 top-5 h-[4.5rem] rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(20,32,43,0.8),rgba(11,18,24,0.5))]" />
          <div className="absolute inset-x-5 top-28 grid grid-cols-2 gap-3">
            <div className="h-[5.5rem] rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,28,37,0.72),rgba(10,16,23,0.48))]" />
            <div className="h-[5.5rem] rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,28,37,0.68),rgba(10,16,23,0.42))]" />
          </div>
          <div className="absolute inset-x-5 bottom-5 h-16 rounded-[1.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,28,37,0.72),rgba(10,16,23,0.42))]" />
        </div>
        <div className="absolute right-6 top-[5.75rem] h-[30%] w-[28%] rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,28,37,0.82),rgba(9,16,23,0.44))]" />
        <div className="absolute bottom-7 right-6 h-[36%] w-[28%] rounded-[1.45rem] border border-white/8 bg-[linear-gradient(180deg,rgba(17,28,37,0.74),rgba(9,16,23,0.38))]" />
        <div className="absolute inset-0 bg-[radial-gradient(44%_46%_at_82%_20%,rgba(156,199,207,0.2),transparent_74%)]" />
      </div>

      {slide.brandMarkSrc ? (
        <Image
          src={slide.brandMarkSrc}
          alt=""
          width={520}
          height={220}
          className={`absolute h-auto object-contain opacity-[0.08] grayscale ${compact ? "bottom-[14%] right-[6%] w-[46%]" : "bottom-[12%] right-[10%] w-[28%] max-w-[18rem]"}`}
        />
      ) : (
        <div
          className={`absolute font-semibold uppercase tracking-[0.24em] text-white/[0.05] ${compact ? "bottom-[14%] right-[7%] text-[1.6rem]" : "bottom-[12%] right-[8%] text-[clamp(2.8rem,4vw,4.8rem)]"}`}
        >
          {slide.client}
        </div>
      )}

      <div className={traceClasses}>
        <GrowthTrace variant="panel" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.72)_34%,rgba(2,6,23,0.22)_58%,rgba(2,6,23,0.8)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,rgba(2,6,23,0.18)_48%,rgba(2,6,23,0.76)_100%)]" />
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
  const activeSlide = SLIDES[active];
  const desktopAsset = getCaseImageSource(activeSlide.imageDesktop);
  const mobileAsset = getCaseImageSource(
    activeSlide.imageMobile ?? activeSlide.imageDesktop
  );

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
      className="relative pt-8 md:pt-12"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Selected work
      </div>

      <div
        ref={stageRef}
        className="relative left-1/2 mt-4 w-screen -translate-x-1/2 px-4 sm:mt-5 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="relative mx-auto h-[clamp(36rem,85vh,52rem)] max-w-[92rem] overflow-hidden rounded-[2rem] border border-white/8 bg-slate-950/80 shadow-[0_40px_120px_rgba(2,6,23,0.62)] sm:rounded-[2.4rem]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
          <div className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] ring-1 ring-white/6" />

          <article
            key={activeSlide.id}
            aria-roledescription="slide"
            aria-label={`${activeSlide.client} case`}
            className="case-scene-enter absolute inset-0"
          >
            <div className="absolute inset-0">
              {desktopAsset.kind === "image" ? (
                <Image
                  src={desktopAsset.src}
                  alt=""
                  fill
                  priority={active === 0}
                  sizes="100vw"
                  className="case-ken-burns hidden h-full w-full scale-[1.08] object-cover blur-[14px] brightness-[0.5] saturate-[0.86] md:block"
                />
              ) : (
                <CaseAtmosphereFallback
                  slide={activeSlide}
                  className="hidden md:block"
                  isActive
                />
              )}

              {mobileAsset.kind === "image" ? (
                <Image
                  src={mobileAsset.src}
                  alt=""
                  fill
                  priority={active === 0}
                  sizes="100vw"
                  className="case-ken-burns h-full w-full scale-[1.12] object-cover blur-[12px] brightness-[0.48] saturate-[0.84] md:hidden"
                />
              ) : (
                <CaseAtmosphereFallback
                  slide={activeSlide}
                  className="md:hidden"
                  isActive
                  compact
                />
              )}

              <div className="absolute inset-0 bg-[radial-gradient(55%_62%_at_80%_18%,rgba(106,170,180,0.16),transparent_72%),linear-gradient(122deg,rgba(3,8,15,0.94)_0%,rgba(3,8,15,0.76)_34%,rgba(3,8,15,0.34)_58%,rgba(3,8,15,0.82)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.2)_30%,rgba(2,6,23,0.52)_72%,rgba(2,6,23,0.82)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_88%_at_50%_68%,transparent_0%,rgba(0,0,0,0.46)_74%)]" />
            </div>

            <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-end px-5 py-6 pb-20 sm:px-6 sm:py-7 sm:pb-24 lg:px-10 lg:py-10 lg:pb-12">
              <div className="relative max-w-[34rem] rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,23,0.82),rgba(7,11,17,0.92))] px-5 py-5 text-left shadow-[0_36px_100px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:px-6 sm:py-6 lg:px-7 lg:py-7">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[4.5rem] rounded-t-[1.8rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.2em]">
                    <span className="text-mayda-teal-soft">
                      {activeSlide.label}
                    </span>
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="text-slate-500">
                      {formatCaseNumber(active + 1)} /{" "}
                      {formatCaseNumber(SLIDES.length)}
                    </span>
                  </div>

                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {activeSlide.client}
                  </p>
                  <h2 className="mt-2 text-balance text-[1.95rem] font-semibold tracking-tight text-foreground sm:text-[2.25rem] md:text-[2.65rem] md:leading-[1.02]">
                    {activeSlide.headline}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-muted sm:text-[0.95rem]">
                    {activeSlide.summary}
                  </p>

                  <ul className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    {activeSlide.kpis.map((kpi) => (
                      <li
                        key={kpi.label}
                        className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      >
                        <div className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                          {kpi.value}
                        </div>
                        <div className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-muted">
                          {kpi.label}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {activeSlide.quote && (
                    <figure className="mt-5 hidden max-w-xl border-l border-white/10 pl-4 text-sm text-muted md:block">
                      <blockquote className="italic text-slate-200/92">
                        “{activeSlide.quote}”
                      </blockquote>
                      {activeSlide.quoteAuthor && (
                        <figcaption className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                          — {activeSlide.quoteAuthor}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={activeSlide.primaryCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${primaryCtaClasses} justify-center sm:justify-start`}
                    >
                      {activeSlide.primaryCta.label}
                    </a>

                    {activeSlide.secondaryCta && (
                      <Link
                        href={activeSlide.secondaryCta.href}
                        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-mayda-teal/40 hover:text-foreground"
                      >
                        {activeSlide.secondaryCta.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {SLIDES.length > 1 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[calc(100%-1.5rem)] -translate-x-1/2 sm:w-auto md:bottom-5 md:left-auto md:right-5 md:translate-x-0">
              <div className="pointer-events-auto ml-auto flex items-center justify-between gap-3 rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-muted shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                <span className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:inline">
                  {formatCaseNumber(active + 1)} / {formatCaseNumber(SLIDES.length)}
                </span>

                <button
                  type="button"
                  aria-label="Previous case"
                  onClick={prev}
                  className="grid h-8 w-8 place-items-center rounded-full border border-transparent text-muted transition hover:border-white/10 hover:text-foreground"
                >
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

                <div className="flex items-center gap-1.5">
                  {SLIDES.map((slide, index) => {
                    const isActive = index === active;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => goTo(index)}
                        aria-label={`Show ${slide.client} case`}
                        className={`h-2 rounded-full transition-all duration-200 ${
                          isActive
                            ? "w-6 bg-mayda-teal-soft"
                            : "w-2 bg-slate-500/55 hover:bg-slate-300/75"
                        }`}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  aria-label="Next case"
                  onClick={next}
                  className="grid h-8 w-8 place-items-center rounded-full border border-transparent text-muted transition hover:border-white/10 hover:text-foreground"
                >
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
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
