import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const HERO_INTRO_CALL_URL = getIntroCallUrl("hero");

export function HeroSection() {
  return (
    <section className="flex items-center pb-16 pt-4 md:pb-20 md:pt-6 lg:min-h-[calc(100vh-var(--chrome-height))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 text-center lg:max-w-7xl lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:text-left">
        {/* Left: Group 1 (kicker + headline) + Group 2 (rest) */}
        <div className="hero-fade-in-left flex-1 space-y-8">
          {/* Group 1 – kicker + headline */}
          <div className="space-y-3">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              GROWTH PARTNER, BUILT FOR SPEED
            </p>

            <h1 className="hero-heading">
              Grow smarter.
              <br />
              Convert better.
            </h1>
          </div>

          {/* Group 2 – rest (body, CTAs, support line, pills) */}
          <div className="space-y-5 text-sm text-slate-300 sm:text-base">
            {/* Body copy */}
            <div className="space-y-3">
              <p>
                Fast, measurable systems that connect performance, data, and
                lifecycle so traffic compounds into revenue.
              </p>
              <p className="text-slate-400">
                Built for digital brands, SaaS, and service firms with traffic
                in place but gaps in tracking, UX, and lifecycle flows.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={HERO_INTRO_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                Book a 15-min Intro Call
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 px-5 py-2.5 text-sm font-medium text-slate-200 shadow-sm shadow-black/20 transition hover:border-teal-300 hover:bg-slate-950/80"
              >
                View programs
              </Link>
            </div>

            {/* Supporting line */}
            <p className="mx-auto max-w-xl text-[0.78rem] text-slate-400 sm:text-sm lg:mx-0 lg:max-w-md">
              Free 15–20min discovery call to surface 2–3 quick wins and decide
              whether a Baseline Scan or Momentum Sprint is the right entry
              point.
            </p>

            {/* Metric pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-1 text-[0.78rem] lg:justify-start">
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
                <span className="font-mono text-[0.78rem] font-semibold text-emerald-300">
                  +28%
                </span>
                <span className="text-slate-400">checkout conversion</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
                <span className="font-mono text-[0.78rem] font-semibold text-emerald-300">
                  +19%
                </span>
                <span className="text-slate-400">average order value</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
                <span className="font-mono text-[0.78rem] font-semibold text-mayda-teal">
                  700k+
                </span>
                <span className="text-slate-400">lifecycle emails shipped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: flow arcs + desktop console + phone mini console as one cluster */}
        <div className="hero-fade-in-right flex-1">
          <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-xl">
            {/* Flow arcs background */}
            <div className="hero-flow-layer">
              <div className="hero-flow-arc hero-flow-arc-1" />
              <div className="hero-flow-arc hero-flow-arc-2" />
              <div className="hero-flow-arc hero-flow-arc-3" />
              <div className="hero-flow-node hero-flow-node-1" />
              <div className="hero-flow-node hero-flow-node-2" />
              <div className="hero-flow-node hero-flow-node-3" />
            </div>

            {/* Desktop analytics panel */}
            <div className="relative rounded-[2rem] border border-slate-800 bg-slate-950/80 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.8)]">
              {/* Header */}
              <div className="mb-3 flex items-center justify-between text-[0.7rem] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">
                    Revenue console
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-[2px] text-[0.58rem] text-slate-400">
                    <span className="hero-live-dot" />
                    <span>live</span>
                  </span>
                </div>
                <div className="inline-flex gap-1 rounded-full bg-slate-900/80 p-1">
                  <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[0.6rem] font-semibold text-slate-900">
                    7d
                  </span>
                  <span className="rounded-full px-2 py-[2px] text-[0.6rem] text-slate-400">
                    30d
                  </span>
                  <span className="rounded-full px-2 py-[2px] text-[0.6rem] text-slate-400">
                    90d
                  </span>
                </div>
              </div>

              {/* Grid of cards */}
              <div className="space-y-3">
                {/* Net sales */}
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                  <div className="mb-1 flex items-center justify-between text-[0.6rem] text-slate-400">
                    <span className="font-semibold uppercase tracking-[0.12em]">
                      Net sales (last 30d)
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-[1px] text-[0.6rem] font-semibold text-emerald-300">
                      +5%
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-semibold text-slate-50">
                      $1,259,157
                    </span>
                    <span className="hero-metric-bar h-9 w-24 rounded-xl bg-[linear-gradient(to_top,_rgba(56,189,248,0.15),_transparent_60%),linear-gradient(to_right,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:100%_100%,8px_100%]" />
                  </div>
                </div>

                {/* Middle row: sessions + conversion */}
                <div className="grid grid-cols-[1.1fr_0.9fr] gap-2.5">
                  {/* Sessions donut */}
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                    <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Sessions by device
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-16 w-16">
                        <div className="h-full w-full rounded-full bg-[conic-gradient(#60a4ba_0deg_150deg,#6366f1_150deg_250deg,#22c55e_250deg_300deg,#0f172a_300deg_360deg)]" />
                        <div className="absolute inset-[22%] rounded-full bg-slate-950" />
                        <div className="absolute inset-[28%] flex flex-col items-center justify-center text-[0.6rem]">
                          <span className="font-semibold text-slate-50">
                            40k
                          </span>
                          <span className="text-[0.58rem] text-emerald-300">
                            +8%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-[0.6rem] text-slate-300">
                        <div className="flex items-center justify-between gap-2">
                          <span>Mobile</span>
                          <span className="font-mono text-[0.58rem] text-slate-400">
                            40%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Desktop</span>
                          <span className="font-mono text-[0.58rem] text-slate-400">
                            34%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Tablet + other</span>
                          <span className="font-mono text-[0.58rem] text-slate-400">
                            26%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion rate */}
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                    <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Conversion rate
                    </div>
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <span className="text-xl font-semibold text-slate-50">
                        5.13%
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[0.6rem] font-semibold text-emerald-300">
                        +0.9%
                      </span>
                    </div>
                    <div className="hero-metric-area h-[34px] w-full rounded-lg bg-[linear-gradient(to_top,_rgba(94,234,212,0.2),_transparent_65%),linear-gradient(to_right,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:100%_100%,10px_100%]" />
                  </div>
                </div>

                {/* Bottom row: channels + funnel */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                    <div className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Top channels
                    </div>
                    <div className="space-y-1.5 text-[0.6rem] text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <span>Organic</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          38%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Paid social</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          24%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Email</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          18%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                    <div className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Funnel
                    </div>
                    <div className="space-y-1.5 text-[0.6rem] text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <span>Viewed</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          100%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Added to cart</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          36%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Checkout</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          22%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Purchased</span>
                        <span className="font-mono text-[0.58rem] text-slate-400">
                          8%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone mini console */}
            <div className="mt-4 rounded-[1.6rem] border border-slate-800 bg-slate-950/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.8)] sm:mt-5 lg:absolute lg:bottom-[-10%] lg:right-[-6%] lg:w-60">
              <div className="mb-2 flex items-center justify-between text-[0.65rem] text-slate-300">
                <span className="font-semibold text-slate-100">
                  On-the-go view
                </span>
                <span className="rounded-full bg-slate-900/80 px-2 py-[2px] text-[0.58rem] text-slate-400">
                  Today
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Conversion rate
                  </span>
                  <span className="text-lg font-semibold text-slate-50">
                    5.13%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[0.62rem] text-slate-300">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] font-mono text-[0.62rem] text-emerald-300">
                    +28% checkout
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] font-mono text-[0.62rem] text-emerald-300">
                    +19% AOV
                  </span>
                  <span className="rounded-full bg-slate-900/90 px-2 py-[2px] text-[0.62rem] text-slate-400">
                    700k+ lifecycle emails
                  </span>
                </div>
                <div className="mt-2 h-14 w-full rounded-xl bg-[linear-gradient(to_top,_rgba(94,234,212,0.24),_transparent_65%),linear-gradient(to_right,_rgba(148,163,184,0.18)_1px,_transparent_1px)] bg-[length:100%_100%,9px_100%]" />
              </div>
            </div>

            {/* Floor glow */}
            <div className="pointer-events-none absolute inset-x-6 bottom-[-22px] -z-20 h-10 rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.95),_transparent_70%)] blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
