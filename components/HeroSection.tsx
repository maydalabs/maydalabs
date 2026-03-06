import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { GrowthTrace } from "@/components/visuals/GrowthTrace";
import { getIntroCallUrl } from "@/lib/marketingLinks";

const HERO_INTRO_CALL_URL = getIntroCallUrl("hero");

export function HeroSection() {
  return (
    <section className="flex items-center pb-14 pt-3 md:pb-16 md:pt-5 lg:min-h-[calc(100vh-var(--chrome-height))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 text-center lg:max-w-7xl lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:text-left">
        <div className="hero-fade-in-left flex-1 space-y-7">
          <div className="space-y-3.5">
            <p className="mayda-kicker">Growth partner, built for speed</p>

            <h1 className="hero-heading">
              Grow smarter.
              <br />
              Convert better.
            </h1>
          </div>

          <div className="space-y-5 text-[0.98rem] text-muted sm:text-base">
            <div className="space-y-3">
              <p className="max-w-2xl">
                Fast, measurable systems that connect performance, data, and
                lifecycle so traffic compounds into revenue.
              </p>
              <p className="max-w-2xl text-[0.95rem] text-muted/88">
                Built for digital brands, SaaS, and service firms with traffic
                in place but gaps in tracking, UX, and lifecycle flows.
              </p>
            </div>

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
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-card px-5 py-2.5 text-sm font-medium text-foreground shadow-[0_12px_30px_rgba(2,6,23,0.35)] transition hover:border-mayda-teal/45 hover:bg-surface-alt/90"
              >
                View programs
              </Link>
            </div>

            <p className="mx-auto max-w-xl text-[0.79rem] text-muted/84 sm:text-sm lg:mx-0 lg:max-w-md">
              Free 15–20min discovery call to surface 2–3 quick wins and decide
              whether a Baseline Scan or Momentum Sprint is the right entry
              point.
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-1 text-[0.78rem] lg:justify-start">
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface-card px-3 py-1.5">
                <span className="font-mono text-[0.78rem] font-semibold text-emerald-300/90">
                  +28%
                </span>
                <span className="text-muted">checkout conversion</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface-card px-3 py-1.5">
                <span className="font-mono text-[0.78rem] font-semibold text-emerald-300/90">
                  +19%
                </span>
                <span className="text-muted">average order value</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface-card px-3 py-1.5">
                <span className="font-mono text-[0.78rem] font-semibold text-mayda-teal-soft">
                  700k+
                </span>
                <span className="text-muted">lifecycle emails shipped</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-fade-in-right flex-1">
          <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-[42rem]">
            <div className="pointer-events-none absolute inset-x-8 inset-y-6 -z-20 rounded-[2.75rem] bg-[radial-gradient(circle_at_25%_20%,rgba(106,170,180,0.15),transparent_48%),radial-gradient(circle_at_85%_5%,rgba(43,84,103,0.2),transparent_44%)] blur-2xl" />
            <GrowthTrace
              variant="hero"
              className="absolute inset-x-[-10%] inset-y-[-10%] -z-10 opacity-90"
            />

            <div className="mayda-panel relative overflow-hidden rounded-[2rem] p-4">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(156,199,207,0.06),transparent)]" />

              <div className="relative">
                <div className="mb-3 flex items-center justify-between text-[0.7rem] text-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Revenue console
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-card-alt/90 px-2 py-[2px] text-[0.58rem] text-muted">
                      <span className="hero-live-dot" />
                      <span>live</span>
                    </span>
                  </div>
                  <div className="inline-flex gap-1 rounded-full border border-border bg-surface-card-alt/90 p-1">
                    <span className="rounded-full bg-foreground/92 px-2 py-[2px] text-[0.6rem] font-semibold text-background">
                      7d
                    </span>
                    <span className="rounded-full px-2 py-[2px] text-[0.6rem] text-muted">
                      30d
                    </span>
                    <span className="rounded-full px-2 py-[2px] text-[0.6rem] text-muted">
                      90d
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-border/80 bg-surface-card-alt/95 p-3">
                    <div className="mb-1 flex items-center justify-between text-[0.6rem] text-muted">
                      <span className="font-semibold uppercase tracking-[0.12em]">
                        Net sales (last 30d)
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-[1px] text-[0.6rem] font-semibold text-emerald-300/90">
                        +5%
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-semibold text-foreground">
                        $1,259,157
                      </span>
                      <span className="hero-metric-bar h-9 w-24 rounded-xl bg-[linear-gradient(to_top,_rgba(106,170,180,0.18),_transparent_60%),linear-gradient(to_right,_rgba(150,166,179,0.12)_1px,_transparent_1px)] bg-[length:100%_100%,8px_100%]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.1fr_0.9fr] gap-2.5">
                    <div className="rounded-2xl border border-border/80 bg-surface-card-alt/95 p-3">
                      <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        Sessions by device
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-16 w-16">
                          <div className="h-full w-full rounded-full bg-[conic-gradient(#6aaab4_0deg_150deg,#4d6d7f_150deg_248deg,#22c55e_248deg_300deg,#0d151d_300deg_360deg)]" />
                          <div className="absolute inset-[22%] rounded-full bg-background" />
                          <div className="absolute inset-[28%] flex flex-col items-center justify-center text-[0.6rem]">
                            <span className="font-semibold text-foreground">
                              40k
                            </span>
                            <span className="text-[0.58rem] text-emerald-300/90">
                              +8%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-[0.6rem] text-foreground/88">
                          <div className="flex items-center justify-between gap-2">
                            <span>Mobile</span>
                            <span className="font-mono text-[0.58rem] text-muted">
                              40%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Desktop</span>
                            <span className="font-mono text-[0.58rem] text-muted">
                              34%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Tablet + other</span>
                            <span className="font-mono text-[0.58rem] text-muted">
                              26%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-surface-card-alt/95 p-3">
                      <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        Conversion rate
                      </div>
                      <div className="mb-2 flex items-end justify-between gap-2">
                        <span className="text-xl font-semibold text-foreground">
                          5.13%
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[0.6rem] font-semibold text-emerald-300/90">
                          +0.9%
                        </span>
                      </div>
                      <div className="hero-metric-area h-[34px] w-full rounded-lg bg-[linear-gradient(to_top,_rgba(106,170,180,0.2),_transparent_65%),linear-gradient(to_right,_rgba(150,166,179,0.12)_1px,_transparent_1px)] bg-[length:100%_100%,10px_100%]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-border/80 bg-surface-card-alt/95 p-3">
                      <div className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        Top channels
                      </div>
                      <div className="space-y-1.5 text-[0.6rem] text-foreground/88">
                        <div className="flex items-center justify-between gap-2">
                          <span>Organic</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            38%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Paid social</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            24%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Email</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            18%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/80 bg-surface-card-alt/95 p-3">
                      <div className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        Funnel
                      </div>
                      <div className="space-y-1.5 text-[0.6rem] text-foreground/88">
                        <div className="flex items-center justify-between gap-2">
                          <span>Viewed</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            100%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Added to cart</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            36%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Checkout</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            22%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Purchased</span>
                          <span className="font-mono text-[0.58rem] text-muted">
                            8%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mayda-panel-soft relative mt-4 rounded-[1.6rem] p-3 sm:mt-5 lg:absolute lg:bottom-[-10%] lg:right-[-6%] lg:w-60">
              <div className="mb-2 flex items-center justify-between text-[0.65rem] text-muted">
                <span className="font-semibold text-foreground">
                  On-the-go view
                </span>
                <span className="rounded-full border border-border bg-surface-card-alt/90 px-2 py-[2px] text-[0.58rem] text-muted">
                  Today
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    Conversion rate
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    5.13%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[0.62rem] text-foreground/88">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] font-mono text-[0.62rem] text-emerald-300/90">
                    +28% checkout
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] font-mono text-[0.62rem] text-emerald-300/90">
                    +19% AOV
                  </span>
                  <span className="rounded-full border border-border bg-surface-card-alt/90 px-2 py-[2px] text-[0.62rem] text-muted">
                    700k+ lifecycle emails
                  </span>
                </div>
                <div className="mt-2 h-14 w-full rounded-xl bg-[linear-gradient(to_top,_rgba(106,170,180,0.24),_transparent_65%),linear-gradient(to_right,_rgba(150,166,179,0.14)_1px,_transparent_1px)] bg-[length:100%_100%,9px_100%]" />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-6 bottom-[-22px] -z-20 h-10 rounded-full bg-[radial-gradient(circle_at_center,_rgba(20,32,43,0.9),_transparent_72%)] blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
