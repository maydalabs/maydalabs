"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { primaryCtaClasses } from "./ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

type Mode = "ecom" | "svc";
type ProgramKey = "baseline-scan" | "momentum-sprint" | "growth-loop";

interface Program {
  key: ProgramKey;
  name: string;
  price: string;
  timeline: string;
  bullets: string[];
}

const PROGRAMS: Record<ProgramKey, Program> = {
  "baseline-scan": {
    key: "baseline-scan",
    name: "Baseline Scan",
    price: "$3,900",
    timeline: "2–3 weeks",
    bullets: [
      "Performance-first base with green Core Web Vitals on key flows.",
      "Flows wired correctly (checkout / billing / booking / forms).",
      "Analytics & pixels verified end-to-end (GA4, ads, CRM).",
    ],
  },
  "momentum-sprint": {
    key: "momentum-sprint",
    name: "Momentum Sprint",
    price: "$2,900",
    timeline: "3–4 weeks",
    bullets: [
      "Prioritized fixes on your biggest drop-off steps.",
      "Fast UX / speed upgrades where they actually move revenue.",
      "Micro-tests and changes shipped weekly instead of “someday”.",
    ],
  },
  "growth-loop": {
    key: "growth-loop",
    name: "Growth Loop",
    price: "$3,900/mo",
    timeline: "10–12 weeks",
    bullets: [
      "Lifecycle flows that compound retention and LTV.",
      "Paid tests with clean measurement instead of guesswork.",
      "Always-on CRO cadence so results don’t decay after launch.",
    ],
  },
};

// Same glyphs as Programs/Pricing
const programIconSrc: Record<ProgramKey, string> = {
  "baseline-scan": "/icons/baseline-scan.svg",
  "momentum-sprint": "/icons/momentum-sprint.svg",
  "growth-loop": "/icons/growth-loop.svg",
};

const USD = "USD";

const ECOM_DEFAULTS = {
  aov: 80,
  sessions: 12000,
  cr: 2.0,
  lift: 0.3,
};

const SVC_DEFAULTS = {
  deal: 2500,
  leads: 120,
  close: 18,
  lift: 0.6,
};

const STORAGE_PREFIX = "roiQuick_home_";

function toNumber(raw: string, fallback: number): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return fallback;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function stepNumber(raw: string, delta: number, fallback: number) {
  const base = toNumber(raw, fallback);
  const next = Math.max(0, base + delta);
  return String(next);
}

function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: USD,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

interface RoiQuickcheckProps {
  heading?: string;
  subheading?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  advancedHref?: string;
  resultsEmail?: string;
}

// Small inline program icon for the recommendation row
function ProgramIconInline({ id }: { id: ProgramKey }) {
  const gradient =
    id === "momentum-sprint"
      ? "from-emerald-400 via-emerald-300 to-teal-200"
      : id === "baseline-scan"
      ? "from-sky-400 via-cyan-300 to-teal-200"
      : "from-indigo-400 via-violet-400 to-fuchsia-300";

  const src = programIconSrc[id];

  const maskStyle: CSSProperties = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return (
    <span
      aria-hidden="true"
      style={maskStyle}
      className={`inline-block h-6 w-6 bg-gradient-to-tr ${gradient} align-middle`}
    />
  );
}

export function RoiQuickcheckSection({
  heading = "Estimate your upside before you change anything.",
  subheading = "Directional, back-of-the-envelope math for what a small conversion or close-rate lift could mean in real dollars.",
  primaryCtaLabel = "Book a 15-min Intro Call",
  primaryCtaHref = getIntroCallUrl("roi"),
  advancedHref = "/roi-quickcheck",
  resultsEmail = "hello@maydalabs.com",
}: RoiQuickcheckProps) {
  const [mode, setMode] = useState<Mode>("ecom");

  // eCom inputs
  const [aovInput, setAovInput] = useState<string>(
    ECOM_DEFAULTS.aov.toString(),
  );
  const [sessionsInput, setSessionsInput] = useState<string>(
    ECOM_DEFAULTS.sessions.toString(),
  );
  const [crInput, setCrInput] = useState<string>(ECOM_DEFAULTS.cr.toString());

  // Services inputs
  const [dealInput, setDealInput] = useState<string>(
    SVC_DEFAULTS.deal.toString(),
  );
  const [leadsInput, setLeadsInput] = useState<string>(
    SVC_DEFAULTS.leads.toString(),
  );
  const [closeInput, setCloseInput] = useState<string>(
    SVC_DEFAULTS.close.toString(),
  );

  // Lift (percentage points)
  const [lift, setLift] = useState<number>(ECOM_DEFAULTS.lift);

  // Guard + summary text
  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedMode = window.localStorage.getItem(
        `${STORAGE_PREFIX}mode`,
      ) as Mode | null;
      if (storedMode === "ecom" || storedMode === "svc") {
        setMode(storedMode);
      }

      const aov = window.localStorage.getItem(`${STORAGE_PREFIX}aov`);
      const sessions = window.localStorage.getItem(
        `${STORAGE_PREFIX}sessions`,
      );
      const cr = window.localStorage.getItem(`${STORAGE_PREFIX}cr`);
      const deal = window.localStorage.getItem(`${STORAGE_PREFIX}deal`);
      const leads = window.localStorage.getItem(`${STORAGE_PREFIX}leads`);
      const close = window.localStorage.getItem(`${STORAGE_PREFIX}close`);
      const liftStored = window.localStorage.getItem(
        `${STORAGE_PREFIX}lift`,
      );

      if (aov) setAovInput(aov);
      if (sessions) setSessionsInput(sessions);
      if (cr) setCrInput(cr);
      if (deal) setDealInput(deal);
      if (leads) setLeadsInput(leads);
      if (close) setCloseInput(close);
      if (liftStored) {
        const n = Number(liftStored);
        if (Number.isFinite(n)) setLift(n);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}mode`, mode);
      window.localStorage.setItem(`${STORAGE_PREFIX}aov`, aovInput);
      window.localStorage.setItem(`${STORAGE_PREFIX}sessions`, sessionsInput);
      window.localStorage.setItem(`${STORAGE_PREFIX}cr`, crInput);
      window.localStorage.setItem(`${STORAGE_PREFIX}deal`, dealInput);
      window.localStorage.setItem(`${STORAGE_PREFIX}leads`, leadsInput);
      window.localStorage.setItem(`${STORAGE_PREFIX}close`, closeInput);
      window.localStorage.setItem(`${STORAGE_PREFIX}lift`, String(lift));
    } catch {
      // ignore
    }
  }, [mode, aovInput, sessionsInput, crInput, dealInput, leadsInput, closeInput, lift]);

  const chipOptions = mode === "ecom" ? [0.2, 0.3, 0.4] : [0.4, 0.6, 0.8];

  const {
    extraMonth,
    extraYear,
    extraUnits,
    newRate,
    ordersLabel,
    newRateLabel,
    program,
  } = useMemo(() => {
    if (mode === "ecom") {
      const aov = toNumber(aovInput, ECOM_DEFAULTS.aov);
      const sessions = toNumber(sessionsInput, ECOM_DEFAULTS.sessions);
      const cr = toNumber(crInput, ECOM_DEFAULTS.cr);
      const liftValue = lift || ECOM_DEFAULTS.lift;

      const baseOrders = sessions * (cr / 100);
      const newCr = cr + liftValue;
      const newOrders = sessions * (newCr / 100);
      const units = Math.max(0, newOrders - baseOrders);

      const extraPerMonth = units * aov;
      const extraPerYear = extraPerMonth * 12;

      const highHead =
        extraPerMonth >= 6000 || (sessions >= 15000 && aov >= 100);
      const lowFunnel = cr < 1.5 || sessions < 6000;

      let programKey: ProgramKey = "momentum-sprint";
      if (highHead) {
        programKey = "growth-loop";
      } else if (lowFunnel) {
        if (cr < 1.2 && sessions < 4000 && aov < 80) {
          programKey = "baseline-scan";
        } else {
          programKey = "momentum-sprint";
        }
      }

      return {
        extraMonth: extraPerMonth,
        extraYear: extraPerYear,
        extraUnits: units,
        newRate: newCr,
        ordersLabel: `≈ ${formatInt(units)} extra orders / mo`,
        newRateLabel: `New CR: ${newCr.toFixed(1)}%`,
        program: PROGRAMS[programKey],
      };
    } else {
      const deal = toNumber(dealInput, SVC_DEFAULTS.deal);
      const leads = toNumber(leadsInput, SVC_DEFAULTS.leads);
      const close = toNumber(closeInput, SVC_DEFAULTS.close);
      const liftValue = lift || SVC_DEFAULTS.lift;

      const baseClients = leads * (close / 100);
      const newClose = close + liftValue;
      const newClients = leads * (newClose / 100);
      const units = Math.max(0, newClients - baseClients);

      const extraPerMonth = units * deal;
      const extraPerYear = extraPerMonth * 12;

      const highHead =
        extraPerMonth >= 8000 || (leads >= 80 && deal >= 1500);
      const lowFunnel = close < 12 || leads < 50;

      let programKey: ProgramKey = "momentum-sprint";
      if (highHead) {
        programKey = "growth-loop";
      } else if (lowFunnel) {
        if (close < 10 && leads < 40) {
          programKey = "baseline-scan";
        } else {
          programKey = "momentum-sprint";
        }
      }

      return {
        extraMonth: extraPerMonth,
        extraYear: extraPerYear,
        extraUnits: units,
        newRate: newClose,
        ordersLabel: `≈ ${formatInt(units)} extra clients / mo`,
        newRateLabel: `New close rate: ${newClose.toFixed(1)}%`,
        program: PROGRAMS[programKey],
      };
    }
  }, [mode, aovInput, sessionsInput, crInput, dealInput, leadsInput, closeInput, lift]);

  // Guardrail message + summary text (for copy / email)
  useEffect(() => {
    const summaryLines: string[] = [];
    let traffic: number;

    if (mode === "ecom") {
      const aov = toNumber(aovInput, ECOM_DEFAULTS.aov);
      const sessions = toNumber(sessionsInput, ECOM_DEFAULTS.sessions);
      const cr = toNumber(crInput, ECOM_DEFAULTS.cr);
      const liftValue = lift || ECOM_DEFAULTS.lift;
      traffic = sessions;

      summaryLines.push(
        "ROI quickcheck (USD) — eCommerce",
        `AOV: $${aov.toFixed(0)}`,
        `Sessions: ${formatInt(sessions)}`,
        `CR: ${cr.toFixed(1)}%`,
        `Expected lift: +${liftValue.toFixed(1)}pp`,
        `New CR: ${newRate.toFixed(1)}%`,
        `Extra orders/mo: ${formatInt(extraUnits)}`,
      );
    } else {
      const deal = toNumber(dealInput, SVC_DEFAULTS.deal);
      const leads = toNumber(leadsInput, SVC_DEFAULTS.leads);
      const close = toNumber(closeInput, SVC_DEFAULTS.close);
      const liftValue = lift || SVC_DEFAULTS.lift;
      traffic = leads;

      summaryLines.push(
        "ROI quickcheck (USD) — Services/Leads",
        `Avg deal: $${deal.toFixed(0)}`,
        `Qualified leads/mo: ${formatInt(leads)}`,
        `Close rate: ${close.toFixed(1)}%`,
        `Expected lift: +${liftValue.toFixed(1)}pp`,
        `New close rate: ${newRate.toFixed(1)}%`,
        `Extra clients/mo: ${formatInt(extraUnits)}`,
      );
    }

    let guard = "";

    if (mode === "ecom") {
      if (traffic < 1500) {
        guard = "Heads up: at under ~1.5k sessions/month, estimates get noisy.";
      } else if (newRate > 7) {
        guard =
          "CR is already high; upside may be more in AOV/LTV than raw CR.";
      }
    } else {
      if (traffic < 40) {
        guard = "Heads up: at under ~40 leads/month, estimates get noisy.";
      } else if (newRate > 40) {
        guard =
          "Close rate is already high; upside may be more in deal size and lead quality.";
      }
    }

    setGuardMessage(guard || null);

    const bulletsText = program.bullets
      .slice(0, 3)
      .map((b) => `- ${b}`)
      .join("\n");

    setSummaryText(
      [
        ...summaryLines,
        `Extra revenue/mo: ${formatMoney(extraMonth)}`,
        `Per year: ${formatMoney(extraYear)}`,
        "",
        `Recommended: ${program.name} • ${program.price} • ${program.timeline}`,
        `Why: ${
          mode === "ecom"
            ? "Solid traffic with room to improve conversion quickly."
            : "Good demand—optimize handoff and close rate for quick wins."
        }`,
        bulletsText,
      ].join("\n"),
    );
  }, [
    mode,
    aovInput,
    sessionsInput,
    crInput,
    dealInput,
    leadsInput,
    closeInput,
    lift,
    extraMonth,
    extraYear,
    extraUnits,
    newRate,
    program,
  ]);

  function handleReset() {
    if (mode === "ecom") {
      setAovInput(ECOM_DEFAULTS.aov.toString());
      setSessionsInput(ECOM_DEFAULTS.sessions.toString());
      setCrInput(ECOM_DEFAULTS.cr.toString());
      setLift(ECOM_DEFAULTS.lift);
    } else {
      setDealInput(SVC_DEFAULTS.deal.toString());
      setLeadsInput(SVC_DEFAULTS.leads.toString());
      setCloseInput(SVC_DEFAULTS.close.toString());
      setLift(SVC_DEFAULTS.lift);
    }
  }

  function buildAdvancedUrl(): string {
    if (typeof window === "undefined") return advancedHref;

    const url = new URL(advancedHref, window.location.origin);
    url.searchParams.set("mode", mode);

    if (mode === "ecom") {
      const aov = toNumber(aovInput, ECOM_DEFAULTS.aov);
      const sessions = toNumber(sessionsInput, ECOM_DEFAULTS.sessions);
      const cr = toNumber(crInput, ECOM_DEFAULTS.cr);
      url.searchParams.set("aov", aov.toFixed(0));
      url.searchParams.set("sessions", String(Math.round(sessions)));
      url.searchParams.set("cr", cr.toFixed(1));
      url.searchParams.set("lift", lift.toFixed(1));
    } else {
      const deal = toNumber(dealInput, SVC_DEFAULTS.deal);
      const leads = toNumber(leadsInput, SVC_DEFAULTS.leads);
      const close = toNumber(closeInput, SVC_DEFAULTS.close);
      url.searchParams.set("deal", deal.toFixed(0));
      url.searchParams.set("leads", String(Math.round(leads)));
      url.searchParams.set("close", close.toFixed(1));
      url.searchParams.set("lift", lift.toFixed(1));
    }

    url.searchParams.set("src", "roi_widget");

    return url.toString();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      alert("Results copied.");
    } catch {
      alert("Could not copy results, sorry. You can select and copy manually.");
    }
  }

  function handleAdvancedClick() {
    const url = buildAdvancedUrl();
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section
      id="roi-quickcheck"
      aria-label="ROI Quickcheck"
      className="relative py-16 sm:py-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Advanced ROI quickcheck
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            {subheading}
          </p>
        </header>

        {/* Layout: calc + results */}
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
          {/* LEFT: inputs */}
          <aside className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.85)] backdrop-blur">
            {/* Mode toggle */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 p-1 text-[0.7rem]"
              role="tablist"
              aria-label="Calculator mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "ecom"}
                onClick={() => {
                  setMode("ecom");
                  if (lift < 0.1 || lift > 1.5) setLift(ECOM_DEFAULTS.lift);
                }}
                className={`flex-1 rounded-full px-3 py-1.5 font-semibold transition ${
                  mode === "ecom"
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-300 hover:text-slate-50"
                }`}
              >
                eCommerce
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "svc"}
                onClick={() => {
                  setMode("svc");
                  if (lift < 0.3 || lift > 1.5) setLift(SVC_DEFAULTS.lift);
                }}
                className={`flex-1 rounded-full px-3 py-1.5 font-semibold transition ${
                  mode === "svc"
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-300 hover:text-slate-50"
                }`}
              >
                Leads / services
              </button>
            </div>

            {/* Row 1: AOV / Sessions OR Deal / Leads */}
            {mode === "ecom" ? (
              <div className="grid grid-cols-2 gap-3">
                {/* AOV with custom stepper */}
                <label className="flex flex-col gap-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    Average order value
                  </span>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 text-[11px] font-extrabold text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={aovInput}
                      onChange={(e) => setAovInput(e.target.value)}
                      className="roi-input w-full rounded-xl border border-slate-800/70 bg-surface-alt/80 px-7 pr-14 py-2.5 text-sm font-semibold text-slate-50 shadow-sm outline-none ring-0 transition focus:border-teal-400/80 focus:bg-surface-alt focus:ring-2 focus:ring-teal-500/25"
                    />
                    <div className="pointer-events-auto absolute inset-y-[6px] right-2 flex flex-col items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setAovInput((prev) =>
                            stepNumber(prev, +1, ECOM_DEFAULTS.aov),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAovInput((prev) =>
                            stepNumber(prev, -1, ECOM_DEFAULTS.aov),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        –
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Typical revenue per order.
                  </span>
                </label>

                {/* Sessions with custom stepper */}
                <label className="flex flex-col gap-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    Monthly sessions
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      step={100}
                      value={sessionsInput}
                      onChange={(e) => setSessionsInput(e.target.value)}
                      className="roi-input w-full rounded-xl border border-slate-800/70 bg-surface-alt/80 px-3 pr-14 py-2.5 text-sm font-semibold text-slate-50 shadow-sm outline-none ring-0 transition focus:border-teal-400/80 focus:bg-surface-alt focus:ring-2 focus:ring-teal-500/25"
                    />
                    <div className="pointer-events-auto absolute inset-y-[6px] right-2 flex flex-col items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setSessionsInput((prev) =>
                            stepNumber(prev, +500, ECOM_DEFAULTS.sessions),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSessionsInput((prev) =>
                            stepNumber(prev, -500, ECOM_DEFAULTS.sessions),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        –
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Commas are okay.
                  </span>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Avg deal with stepper */}
                <label className="flex flex-col gap-2 text-xs text-slate-200">
                  <span className="font-semibold text-slate-100">
                    Avg revenue per client
                  </span>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 text-[11px] font-semibold text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={50}
                      value={dealInput}
                      onChange={(e) => setDealInput(e.target.value)}
                      className="roi-input w-full rounded-xl border border-slate-800/70 bg-surface-alt/80 px-7 pr-14 py-2.5 text-sm font-semibold text-slate-50 shadow-sm outline-none ring-0 transition focus:border-teal-400/80 focus:bg-surface-alt focus:ring-2 focus:ring-teal-500/25"
                    />
                    <div className="pointer-events-auto absolute inset-y-[6px] right-2 flex flex-col items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setDealInput((prev) =>
                            stepNumber(prev, +100, SVC_DEFAULTS.deal),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDealInput((prev) =>
                            stepNumber(prev, -100, SVC_DEFAULTS.deal),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        –
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Typical first project or monthly value.
                  </span>
                </label>

                {/* Leads with stepper */}
                <label className="flex flex-col gap-2 text-xs text-slate-200">
                  <span className="font-semibold text-slate-100">
                    Monthly leads
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      step={5}
                      value={leadsInput}
                      onChange={(e) => setLeadsInput(e.target.value)}
                      className="roi-input w-full rounded-xl border border-slate-800/70 bg-surface-alt/80 px-3 pr-14 py-2.5 text-sm font-semibold text-slate-50 shadow-sm outline-none ring-0 transition focus:border-teal-400/80 focus:bg-surface-alt focus:ring-2 focus:ring-teal-500/25"
                    />
                    <div className="pointer-events-auto absolute inset-y-[6px] right-2 flex flex-col items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setLeadsInput((prev) =>
                            stepNumber(prev, +5, SVC_DEFAULTS.leads),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLeadsInput((prev) =>
                            stepNumber(prev, -5, SVC_DEFAULTS.leads),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        –
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Commas are okay.
                  </span>
                </label>
              </div>
            )}

            {/* Conversion / close rate */}
            {mode === "ecom" ? (
              <label className="flex flex-col gap-2 text-xs text-slate-200">
                <span className="font-semibold text-slate-100">
                  Current conversion rate
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0.1}
                      max={50}
                      step={0.1}
                      value={crInput}
                      onChange={(e) => setCrInput(e.target.value)}
                      className="roi-input w-full rounded-xl border border-slate-800/70 bg-surface-alt/80 px-3 pr-14 py-2.5 text-sm font-semibold text-slate-50 shadow-sm outline-none ring-0 transition focus:border-teal-400/80 focus:bg-surface-alt focus:ring-2 focus:ring-teal-500/25"
                    />
                    <div className="pointer-events-auto absolute inset-y-[6px] right-2 flex flex-col items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCrInput((prev) =>
                            stepNumber(prev, +0.1, ECOM_DEFAULTS.cr),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCrInput((prev) =>
                            stepNumber(prev, -0.1, ECOM_DEFAULTS.cr),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        –
                      </button>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    %
                  </span>
                </div>
              </label>
            ) : (
              <label className="flex flex-col gap-2 text-xs text-slate-200">
                <span className="font-semibold text-slate-100">
                  Current close rate
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0.1}
                      max={90}
                      step={0.5}
                      value={closeInput}
                      onChange={(e) => setCloseInput(e.target.value)}
                      className="roi-input w-full rounded-xl border border-slate-800/70 bg-surface-alt/80 px-3 pr-14 py-2.5 text-sm font-semibold text-slate-50 shadow-sm outline-none ring-0 transition focus:border-teal-400/80 focus:bg-surface-alt focus:ring-2 focus:ring-teal-500/25"
                    />
                    <div className="pointer-events-auto absolute inset-y-[6px] right-2 flex flex-col items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCloseInput((prev) =>
                            stepNumber(prev, +0.5, SVC_DEFAULTS.close),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCloseInput((prev) =>
                            stepNumber(prev, -0.5, SVC_DEFAULTS.close),
                          )
                        }
                        className="grid h-4 w-4 place-items-center rounded-full border border-slate-600 bg-slate-900 text-[10px] leading-none text-slate-200 shadow-sm hover:border-teal-400 hover:text-teal-200"
                      >
                        –
                      </button>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    %
                  </span>
                </div>
              </label>
            )}

            {/* Lift chips */}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {chipOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLift(value)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    lift === value
                      ? "border-teal-400 bg-teal-500/20 text-teal-50"
                      : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-teal-400/70 hover:text-slate-50"
                  }`}
                >
                  +{value.toFixed(1)}pp
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400">
              pp = percentage points. 2.0% + 0.3pp → 2.3%.
            </span>

            {/* Tools */}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500 hover:text-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500 hover:text-slate-50"
              >
                Copy results
              </button>
            </div>
          </aside>

          {/* RIGHT: results */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.85)] backdrop-blur">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Extra / month
                </div>
                <div className="mt-1 text-3xl font-semibold text-slate-50 sm:text-4xl">
                  {formatMoney(extraMonth)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Per year
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-50">
                  {formatMoney(extraYear)}
                </div>
              </div>
            </div>

            {/* Meta line */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                {ordersLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                {newRateLabel}
              </span>
            </div>

            {/* Guardrail */}
            {guardMessage && (
              <p className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px] font-medium text-slate-300">
                {guardMessage}
              </p>
            )}

            {/* Recommendation */}
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProgramIconInline id={program.key} />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Recommended starting point
                    </p>
                    <h3 className="text-sm font-semibold tracking-tight text-slate-50">
                      {program.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-300">
                      {program.price} • {program.timeline}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                  Model confidence: ~80%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-300">
                {mode === "ecom"
                  ? "You’ve got traffic; the fastest upside is fixing conversion first."
                  : "You’ve got demand; the upside is in handoff and close rate."}
              </p>
              <ul className="mt-3 space-y-2 text-sm font-medium text-slate-200">
                {program.bullets.slice(0, 3).map((b) => (
                  <li key={b} className="relative pl-4">
                    <span className="absolute left-0 top-[2px] text-[11px] text-emerald-400">
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={primaryCtaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                {primaryCtaLabel}
              </Link>
              <button
                type="button"
                onClick={handleAdvancedClick}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-transparent px-5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-900/70"
              >
                Open advanced ROI calculator →
              </button>
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-400">
              15–20 minutes. We’ll sanity-check your inputs and the math
              together.
            </p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Prefer email? You can send your numbers to {resultsEmail}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
