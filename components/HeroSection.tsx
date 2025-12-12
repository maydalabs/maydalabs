import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";

const FIT_CHECK_URL =
  "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=hero";

export function HeroSection() {
  return (
    <section className="pt-2 md:pt-4">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col gap-10 lg:max-w-7xl lg:flex-row lg:items-center">
        {/* Copy */}
        <div className="flex-1 space-y-6">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
            GROWTH PARTNER FOR DIGITAL-FIRST TEAMS
          </p>

          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
            Turn underperforming traffic into a repeatable growth system.
          </h1>

          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            We help digital brands, SaaS, and service firms close the gap
            between traffic and revenue with three focused programs:
            Baseline Scan, Momentum Sprint, and Growth Loop.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={FIT_CHECK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryCtaClasses}
            >
              Book a 15-min fit check
            </Link>

            <Link
              href="/programs"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 px-5 py-2.5 text-sm font-medium text-slate-200 shadow-sm shadow-black/20 transition hover:bg-slate-950/80 hover:border-teal-300"
            >
              View programs
            </Link>
          </div>

          <p className="max-w-xl text-[0.75rem] text-slate-400 sm:text-sm">
            Kickoff in 7 days or we comp your first week. Built for teams who
            already have traffic and want clean measurement, faster UX, and
            lifecycle that compounds.
          </p>

          {/* Metric pills */}
          <div className="flex flex-wrap gap-2 pt-2 text-[0.78rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
              <span className="font-mono text-[0.78rem] font-semibold text-emerald-300">
                +28%
              </span>
              <span className="text-slate-400">checkout conversion</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
              <span className="font-mono text-[0.78rem] font-semibold text-emerald-300">
                +19%
              </span>
              <span className="text-slate-400">average order value</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1">
              <span className="font-mono text-[0.78rem] font-semibold text-mayda-teal">
                700k+
              </span>
              <span className="text-slate-400">lifecycle emails shipped</span>
            </div>
          </div>
        </div>

        {/* Console phone – uses same card recipe as Programs cards */}
        <div className="flex-1">
          <div className="relative mx-auto max-w-xs sm:max-w-sm">
            {/* Phone frame */}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-800 bg-slate-950/80 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.8)]">
              <div className="rounded-[1.9rem] border border-slate-700/60 bg-slate-950 px-3 pb-4 pt-3">
                {/* Status + app bar */}
                <div className="mb-2 flex items-center justify-between text-[0.62rem] text-slate-300">
                  <span className="font-semibold">9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="h-[10px] w-[14px] rounded-[5px] border border-slate-400/70" />
                    <span className="h-[8px] w-[18px] rounded-[3px] border border-slate-400/80">
                      <span className="block h-full w-[70%] rounded-[2px] bg-slate-200" />
                    </span>
                  </div>
                </div>
                <div className="mb-3 flex items-center justify-between text-[0.7rem]">
                  <span className="font-semibold text-slate-100">
                    Analytics
                  </span>
                  <div className="inline-flex gap-1 rounded-full bg-slate-900/80 p-1">
                    <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[0.62rem] font-semibold text-slate-900">
                      7d
                    </span>
                    <span className="rounded-full px-2 py-[2px] text-[0.62rem] text-slate-400">
                      30d
                    </span>
                    <span className="rounded-full px-2 py-[2px] text-[0.62rem] text-slate-400">
                      90d
                    </span>
                  </div>
                </div>

                {/* Screen grid */}
                <div className="space-y-2.5">
                  {/* Net sales */}
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                    <div className="mb-1 flex items-center justify-between text-[0.6rem] text-slate-400">
                      <span className="font-semibold uppercase tracking-[0.12em]">
                        Net sales
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-[1px] text-[0.6rem] font-semibold text-emerald-300">
                        +5%
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-semibold text-slate-50">
                        1,259,157
                      </span>
                      <span className="h-9 w-24 rounded-xl bg-[linear-gradient(to_top,_rgba(56,189,248,0.15),_transparent_60%),linear-gradient(to_right,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:100%_100%,8px_100%]" />
                    </div>
                  </div>

                  {/* Middle row: donut + CR */}
                  <div className="grid grid-cols-[1.1fr_0.9fr] gap-2.5">
                    {/* Donut */}
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
                      <div className="h-[34px] w-full rounded-lg bg-[linear-gradient(to_top,_rgba(94,234,212,0.2),_transparent_65%),linear-gradient(to_right,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:100%_100%,10px_100%]" />
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
            </div>

            {/* Subtle floor glow (local to phone) */}
            <div className="pointer-events-none absolute inset-x-4 bottom-[-18px] -z-10 h-10 rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.9),_transparent_70%)] blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
