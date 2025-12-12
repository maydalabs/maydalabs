"use client";

import * as React from "react";

type FaqItem = {
  id?: string;
  question: string;
  answer: string;
};

const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: "What if we don’t see results?",
    answer:
      "We set KPIs up front and review weekly. If we miss the agreed checklist on time, we’ll make it right the following sprint.",
  },
  {
    question: "What access do you need?",
    answer:
      "Usually: Shopify or your core platform, analytics, ad accounts (if applicable), and your ESP / CRM. We keep everything least-privilege.",
  },
  {
    question: "Do you support international stores?",
    answer:
      "Yes — multi-currency, multi-market, and multi-language setups. We’ll confirm edge cases in the discovery sprint.",
  },
  {
    question: "What about post-launch support?",
    answer:
      "You can book follow-on sprints or a light retainer for polish, iteration, and experiments.",
  },
  {
    question: "How do you report results?",
    answer:
      "Weekly insights, decision logs, and KPI snapshots so you can see what shipped and what moved.",
  },
  {
    question: "Do you work with custom themes or stacks?",
    answer:
      "Yes. We ship performance-first builds and refactors that pass Core Web Vitals and keep your brand intact.",
  },
  {
    question: "Where do we communicate?",
    answer:
      "Weekly calls, async updates, and a shared workspace (usually Notion + your preferred chat).",
  },
  {
    question: "Will you migrate our data?",
    answer:
      "We handle products, customers, orders, redirects, and pixels where it makes sense for the project scope.",
  },
  {
    question: "Do you sign NDAs?",
    answer:
      "Yes — send yours or use our standard mutual NDA. We’re used to working under NDA with internal teams.",
  },
  {
    question: "Do you replace our dev team?",
    answer:
      "No. We either partner with your internal devs or act as a fractional team when you don’t have one yet.",
  },
  {
    question: "Can you run our paid campaigns?",
    answer:
      "Inside Growth Loop we can own creative sprints and paid testing, tied into the same CRO cadence.",
  },
  {
    question: "How do sprints work?",
    answer:
      "1–2 week cycles with prioritized checklists, clear owners, and demos every Friday.",
  },
  {
    question: "Who owns the code/design?",
    answer:
      "You do. Everything lives in your repos and design files. We keep things clean so your team can maintain them.",
  },
  {
    question: "Do you work with headless?",
    answer:
      "Selective. We’ll recommend headless only when the performance, scale, or content needs justify the extra complexity.",
  },
  {
    question: "What payment terms do you use?",
    answer:
      "Per-sprint or monthly; card or invoice. We’ll confirm terms in the proposal.",
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
  heading = "FAQ",
  subheading = "Quick answers to common questions.",
  items = DEFAULT_ITEMS,
  note,
  showSearch = true,
  showControls = true,
  mobileMax = 5,
  searchPlaceholder = "Search questions…",
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

  // fire search analytics
  React.useEffect(() => {
    if (!normalizedQuery) return;
    pushFaqEvent({
      event: "faq_search",
      section: "faq",
      query: normalizedQuery,
      hits: filtered.length,
    });
  }, [normalizedQuery, filtered.length]);

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
        </mark>,
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
    <section
      id={id}
      className="scroll-mt-24 py-16 text-slate-50 sm:py-24"
    >
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
