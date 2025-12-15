"use client";

import * as React from "react";

type FaqItem = {
  id?: string;
  question: string;
  answer: string;
};

const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: "What happens on the discovery call?",
    answer:
      "We review your numbers (traffic, conversion rate, AOV, channels), walk your key flows, and map where Baseline Scan, Momentum Sprint, or Growth Loop has the most leverage. You leave with a draft checklist and next steps, not a generic pitch.",
  },
  {
    question: "What if we don’t see results?",
    answer:
      "We agree KPIs and a weekly checklist up front. If we miss the agreed checklist for reasons on our side, we work an extra week at no cost in the next sprint. We don’t promise a specific uplift, but we do commit to clean tracking and work that shows up in your analytics.",
  },
  {
    question: "Which program should we start with?",
    answer:
      "Most teams start with a Momentum Sprint. Baseline Scan is best when tracking is messy, the site is slow, or you want an objective read before changing anything. Growth Loop is for teams with steady volume who want an ongoing test cadence, not one-off projects.",
  },
  {
    question: "What access do you need?",
    answer:
      "Typically: Shopify or your core platform, analytics (GA4 and any dashboards), ad accounts if we’re touching paid, and your ESP / CRM. We keep everything least-privilege and document what we change so your team can maintain it.",
  },
  {
    question: "Do you work with non-Shopify or headless stacks?",
    answer:
      "Yes. We work with custom themes, headless frontends like Next.js, and mixed setups. We only recommend headless when performance, content, or scale justify the extra complexity.",
  },
  {
    question: "Do you support international or multi-store setups?",
    answer:
      "Yes. We’re comfortable with multi-currency, multi-market, and multi-language stores. In the discovery sprint we map taxes, shipping, and regional edge cases before we touch live flows.",
  },
  {
    question: "Who actually does the work?",
    answer:
      "You work directly with a small senior team, not a rotating pod of juniors. Strategy, UX, and implementation stay tight so decisions and changes don’t get lost between teams.",
  },
  {
    question: "Do you replace our dev or marketing team?",
    answer:
      "No. We either plug into your existing dev and marketing teams, or act as a fractional product/growth team when you don’t have one yet. The goal is to make your in-house team more effective, not redundant.",
  },
  {
    question: "How do you report results?",
    answer:
      "Weekly insights with a simple decision log, KPI snapshots, and links to what shipped. You can see what changed, why we did it, and how it moved the numbers.",
  },
  {
    question: "How do sprints work?",
    answer:
      "We work in 1–2 week sprints with a prioritized checklist, clear owners, and a demo every Friday. You always know what’s in progress, what’s blocked, and what’s next.",
  },
  {
    question: "What about post-launch support?",
    answer:
      "You can book follow-on sprints for more fixes and experiments, or move into a Growth Loop cadence for ongoing CRO, lifecycle, and paid testing.",
  },
  {
    question: "Can you run our paid campaigns?",
    answer:
      "Inside Growth Loop we can own creative sprints and paid testing, tied directly into the same CRO cadence and analytics. We’re not a big media-buy retainer; tests stay focused and measurable.",
  },
  {
    question: "Will you migrate our data?",
    answer:
      "We handle products, customers, orders, redirects, and key tracking where it makes sense for the scope. Exact migrations are defined in the proposal so there are no surprises.",
  },
  {
    question: "Who owns the code and design assets?",
    answer:
      "You do. Code lives in your repos, designs live in your files. We keep things performant and maintainable so your team can work on them after we’re done.",
  },
  {
    question: "Do you sign NDAs?",
    answer:
      "Yes. We can use your paper or our standard mutual NDA. We’re used to working under NDA with internal teams and with sensitive performance data.",
  },
];

// ---- analytics typing (no any) ----

type FaqEvent =
  | { event: "faq_view"; section: "faq" }
  | { event: "faq_search"; section: "faq"; query: string; hits: number }
  | { event: "faq_expand_all" | "faq_collapse_all"; section: "faq" }
  | { event: "faq_expand" | "faq_collapse"; section: "faq"; question: string };

interface WindowWithDataLayer extends Window {
  dataLayer?: FaqEvent[];
}

function getWindowWithDataLayer(): WindowWithDataLayer | null {
  if (typeof window === "undefined") return null;
  return window as WindowWithDataLayer;
}

function pushFaqEvent(event: FaqEvent): void {
  const w = getWindowWithDataLayer();
  if (!w) return;
  try {
    if (!Array.isArray(w.dataLayer)) {
      w.dataLayer = [];
    }
    w.dataLayer.push(event);
  } catch {
    // ignore
  }
}

export interface FaqSectionProps {
  id?: string;
  heading?: string;
  subheading?: string;
  items?: FaqItem[];
  note?: string;
  showSearch?: boolean;
  showControls?: boolean;
  mobileMax?: number;
  searchPlaceholder?: string;
}

export function FaqSection({
  id = "faq",
  heading = "Questions about working with us?",
  subheading = "Quick answers on programs, access, timelines, and what to expect before you book a discovery call.",
  items = DEFAULT_ITEMS,
  note,
  showSearch = true,
  showControls = true,
  mobileMax = 5,
  searchPlaceholder = "Search questions (results, access, sprints…)",
}: FaqSectionProps) {
  const [query, setQuery] = React.useState("");
  const detailsRefs = React.useRef<HTMLDetailsElement[]>([]);

  // fire a view event once
  React.useEffect(() => {
    pushFaqEvent({ event: "faq_view", section: "faq" });
  }, []);

  // URL hash support: #faq-q-1 etc.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const d = el.querySelector("details") as HTMLDetailsElement | null;
    if (d && !d.open) d.open = true;
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = React.useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => {
      const hay =
        (item.question || "") +
        " " +
        (typeof item.answer === "string" ? item.answer : "");
      return hay.toLowerCase().includes(normalizedQuery);
    });
  }, [items, normalizedQuery]);

  const hits = filtered.length;

  // fire search analytics
  React.useEffect(() => {
    if (!normalizedQuery) return;
    pushFaqEvent({
      event: "faq_search",
      section: "faq",
      query: normalizedQuery,
      hits,
    });
  }, [normalizedQuery, hits]);

  function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function renderHighlighted(text: string): React.ReactNode {
    if (!normalizedQuery) return text;
    const rx = new RegExp(escapeRegex(normalizedQuery), "ig");
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rx.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start));
      }
      parts.push(
        <mark
          key={parts.length}
          className="rounded bg-teal-400/20 px-0.5 text-teal-100"
        >
          {match[0]}
        </mark>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }

  const handleExpandAll = () => {
    detailsRefs.current.forEach((d) => {
      if (d) d.open = true;
    });
    pushFaqEvent({ event: "faq_expand_all", section: "faq" });
  };

  const handleCollapseAll = () => {
    detailsRefs.current.forEach((d) => {
      if (d) d.open = false;
    });
    pushFaqEvent({ event: "faq_collapse_all", section: "faq" });
  };

  const hasResults = filtered.length > 0;

  return (
    <section id={id} className="scroll-mt-24 py-16 text-slate-50 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto mb-6 grid max-w-3xl gap-3 text-center">
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight md:text-[2.2rem]">
            {heading}
          </h2>
          {subheading && (
            <p className="text-sm font-medium text-slate-400 md:text-[0.95rem]">
              {subheading}
            </p>
          )}

          <div className="mt-2 grid justify-items-center gap-3">
            {showSearch && (
              <div
                className="w-[min(720px,92vw)]"
                role="search"
                aria-label="Search FAQ"
              >
                <div className="relative">
                  <input
                    type="search"
                    className="w-full rounded-full border border-slate-800/70 bg-slate-950/70 px-10 py-2.5 text-sm font-medium text-slate-100 shadow-[0_16px_40px_rgba(2,6,23,0.85)] outline-none ring-0 placeholder:text-slate-500 focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/25"
                    placeholder={searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {/* search icon */}
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="block"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="6.75"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <line
                        x1="16.5"
                        y1="16.5"
                        x2="21"
                        y2="21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            )}

            {showControls && (
              <div
                className="hidden items-center gap-2 text-xs font-semibold text-slate-300 sm:flex"
                aria-label="Accordion controls"
              >
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 shadow-sm transition hover:border-teal-400/80 hover:text-slate-50"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 shadow-sm transition hover:border-teal-400/80 hover:text-slate-50"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>
        </header>

        {/* List */}
        <ul
          className="mx-auto mt-4 grid max-w-6xl list-none gap-3 md:mt-6 md:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {filtered.map((item) => {
            const idx = items.indexOf(item);
            const qId = `${id}-q-${idx + 1}`;
            const isMobileHidden = !normalizedQuery && idx >= mobileMax;

            return (
              <li
                key={qId}
                id={qId}
                className={[
                  "transition",
                  isMobileHidden ? "hidden sm:block" : "block",
                ].join(" ")}
              >
                <details
                  ref={(el) => {
                    if (el && idx >= 0) {
                      detailsRefs.current[idx] = el;
                    }
                  }}
                  className="group rounded-2xl border border-slate-800 bg-slate-950/70 shadow-[0_18px_45px_rgba(2,6,23,0.85)] transition hover:border-teal-400/70 hover:shadow-[0_24px_60px_rgba(15,23,42,0.95)]"
                  onToggle={(e) => {
                    const open = (e.currentTarget as HTMLDetailsElement).open;
                    pushFaqEvent({
                      event: open ? "faq_expand" : "faq_collapse",
                      section: "faq",
                      question: item.question,
                    });
                  }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold leading-snug text-slate-50 outline-none">
                    <span className="text-left">
                      {renderHighlighted(item.question)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-teal-400/70 bg-slate-950/90 text-slate-50 transition group-open:rotate-90"
                    >
                      <span className="relative block h-3 w-3">
                        <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded bg-slate-50" />
                        <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded bg-slate-50 transition group-open:scale-y-0" />
                      </span>
                    </span>
                  </summary>
                  <div className="px-4 pb-3 text-sm font-medium leading-relaxed text-slate-300">
                    {item.answer}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>

        {!hasResults && (
          <p className="mt-4 text-center text-sm font-semibold text-slate-400">
            No results. Try “pricing”, “support”, or “timeline”.
          </p>
        )}

        {note && (
          <div className="mx-auto mt-5 max-w-3xl rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-center text-[0.78rem] font-medium text-slate-300">
            {note}
          </div>
        )}
      </div>
    </section>
  );
}
