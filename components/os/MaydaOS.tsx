"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HodlStayJourney, SatoshiGazetteJourney } from "@/components/HodlStayJourney";
import { MaydaMark } from "@/components/MaydaMark";
import { ProductConstellation } from "@/components/ProductConstellation";
import { SignalDecode } from "@/components/SignalDecode";
import { type Locale, localizePath } from "@/lib/i18n";
import { playLock, playTick } from "@/lib/soundSignal";
import { OsMatrix } from "@/components/os/OsMatrix";
import { OsArrival, type ArrivalPhase } from "@/components/os/OsArrival";
import { OsMenuBar } from "@/components/os/OsMenuBar";
import { OsScreensaver } from "@/components/os/OsScreensaver";
import { OsTerminal } from "@/components/os/OsTerminal";
import { OsTour } from "@/components/os/OsTour";
import { OsWallpaper } from "@/components/os/OsWallpaper";
import { OS_COPY } from "@/components/os/osCopy";
import { trackOsEvent } from "@/lib/osAnalytics";
import { useTelemetry } from "@/components/os/useTelemetry";

type WindowId = "welcome" | "work" | "hodlstay" | "gazette" | "monitor" | "terminal" | "about" | "trash" | "array";

type WindowState = { open: boolean; min: boolean; max: boolean; snap?: "left" | "right" | null; x: number; y: number; z: number; w: number };

const INITIAL_WINDOWS: Record<WindowId, WindowState> = {
  welcome: { open: false, min: false, max: false, x: 48, y: 46, z: 2, w: 590 },
  work: { open: true, min: false, max: false, x: 340, y: 94, z: 5, w: 760 },
  monitor: { open: false, min: false, max: false, x: 1068, y: 520, z: 3, w: 330 },
  hodlstay: { open: false, min: false, max: false, x: 612, y: 26, z: 2, w: 540 },
  gazette: { open: false, min: false, max: false, x: 548, y: 118, z: 1, w: 540 },
  terminal: { open: false, min: false, max: false, x: 648, y: 280, z: 1, w: 600 },
  about: { open: false, min: false, max: false, x: 420, y: 130, z: 1, w: 360 },
  trash: { open: false, min: false, max: false, x: 500, y: 210, z: 1, w: 400 },
  array: { open: false, min: false, max: false, x: 320, y: 90, z: 1, w: 680 },
};

const ENTER_DELAYS: Partial<Record<WindowId, number>> = { work: 120 };

const DESKTOP_STORAGE_KEY = "ml_desktop_v3";
const ARRIVAL_STORAGE_KEY = "ml_arrival_entered_v1";

function freshDesktop(viewportWidth = 1440): Record<WindowId, WindowState> {
  const layoutWidth = Math.max(1440, viewportWidth);
  return {
    ...INITIAL_WINDOWS,
    work: {
      ...INITIAL_WINDOWS.work,
      x: Math.round((layoutWidth - INITIAL_WINDOWS.work.w) / 2),
    },
  };
}

// Stored layouts are untrusted input from a previous visit: every field
// is validated, widths stay design-owned, and a layout with no open
// window at all falls back to the default desktop.
function restoreDesktop(): { state: Record<WindowId, WindowState>; maxZ: number } | null {
  try {
    const raw = window.localStorage.getItem(DESKTOP_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const state = { ...INITIAL_WINDOWS };
    let anyOpen = false;
    let maxZ = 6;
    const clampNumber = (value: unknown, fallback: number, min: number, max: number) =>
      typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
    for (const id of Object.keys(INITIAL_WINDOWS) as WindowId[]) {
      const saved = record[id];
      if (!saved || typeof saved !== "object") continue;
      const entry = saved as Record<string, unknown>;
      const base = INITIAL_WINDOWS[id];
      state[id] = {
        open: typeof entry.open === "boolean" ? entry.open : base.open,
        min: typeof entry.min === "boolean" ? entry.min : false,
        max: typeof entry.max === "boolean" ? entry.max : false,
        snap: entry.snap === "left" || entry.snap === "right" ? entry.snap : null,
        x: clampNumber(entry.x, base.x, 0, 6000),
        y: clampNumber(entry.y, base.y, 0, 4000),
        z: clampNumber(entry.z, base.z, 1, 600),
        w: base.w,
      };
      if (state[id].open) anyOpen = true;
      maxZ = Math.max(maxZ, state[id].z);
    }
    if (!anyOpen) return null;
    return { state, maxZ };
  } catch {
    return null;
  }
}

// Module-evaluation time doubles as the OS boot timestamp for uptime.
const BOOTED_AT = Date.now();

function Glyph({ name, stroke = "#f2f0ea" }: { name: string; stroke?: string }) {
  const s = { stroke, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (name) {
    case "grid":
      return <svg width="20" height="20" viewBox="0 0 20 20"><rect x="2.5" y="2.5" width="6" height="6" rx="1" {...s} /><rect x="11.5" y="2.5" width="6" height="6" rx="1" {...s} /><rect x="2.5" y="11.5" width="6" height="6" rx="1" {...s} /><rect x="11.5" y="11.5" width="6" height="6" rx="1" {...s} /></svg>;
    case "layers":
      return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 6.5 L10 3 L17 6.5 L10 10 Z" {...s} /><path d="M3 10.5 L10 14 L17 10.5" {...s} opacity="0.6" /><path d="M3 14 L10 17.5 L17 14" {...s} opacity="0.35" /></svg>;
    case "shell":
      return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 6 L8 10 L4 14" {...s} strokeWidth="1.5" /><path d="M10 15 H16" {...s} strokeWidth="1.5" /></svg>;
    case "monitor":
      return <svg width="20" height="20" viewBox="0 0 20 20"><polyline points="2.5,12 6,12 8,6 11,15 13,10 17.5,10" {...s} /></svg>;
    case "doc":
      return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 2.5 H12 L15.5 6 V17.5 H5 Z" {...s} /><path d="M12 2.5 V6 H15.5" {...s} /><path d="M7.5 10 H13 M7.5 13 H11" {...s} opacity="0.6" /></svg>;
    case "send":
      return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M17 3 L9 11" {...s} /><path d="M17 3 L12 17 L9 11 L3 8 Z" {...s} /></svg>;
    case "mark":
      return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 3.5 L8.5 10 L4 16.5 Z" {...s} /><path d="M16 3.5 L11.5 10 L16 16.5 Z" {...s} /><circle cx="10" cy="10" r="1.4" fill={stroke} stroke="none" /></svg>;
    case "call":
      return <svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="4" width="14" height="13" rx="2" {...s} /><path d="M3 8 H17 M7 2.5 V5.5 M13 2.5 V5.5" {...s} /></svg>;
    case "array":
      return <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.5" {...s} /><circle cx="10" cy="10" r="2" fill={stroke} stroke="none" /><circle cx="10" cy="3.5" r="1.3" fill={stroke} stroke="none" /><circle cx="16.5" cy="10" r="1.3" fill={stroke} stroke="none" /><circle cx="10" cy="16.5" r="1.3" fill={stroke} stroke="none" /></svg>;
    case "trash":
      return <svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 6 H16 M8 6 V4.5 H12 V6 M5.5 6 L6.4 16.5 H13.6 L14.5 6" {...s} /><path d="M8.4 9 V13.5 M11.6 9 V13.5" {...s} opacity="0.6" /></svg>;
    case "play":
      return <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" {...s} /><path d="M8.2 6.8 L13 10 L8.2 13.2 Z" {...s} /></svg>;
    default:
      return null;
  }
}

export function MaydaOS({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale];
  const router = useRouter();
  const desktopRef = useRef<HTMLDivElement>(null);
  const zRef = useRef(6);
  const staggerRef = useRef(true);
  const lastSplashRef = useRef(0);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [windows, setWindows] = useState(INITIAL_WINDOWS);
  const [arrivalPhase, setArrivalPhase] = useState<ArrivalPhase>("checking");
  const [booting, setBooting] = useState(false);
  const [mobileShell, setMobileShell] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);
  const toastIdRef = useRef(0);
  const prevBlockRef = useRef<number | null>(null);
  const { telemetry, failed: telemetryFailed } = useTelemetry();

  // Toasts arrive over an event bus so any part of the OS can raise one.
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || typeof detail.text !== "string") return;
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToasts((current) => [...current.slice(-2), { id, text: detail.text.slice(0, 120) }]);
      setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 6000);
    };
    window.addEventListener("os:toast", onToast);
    return () => window.removeEventListener("os:toast", onToast);
  }, []);

  // A real Bitcoin block mined while the OS is open becomes a
  // notification, a tick, and a splash on the sea.
  useEffect(() => {
    const height = telemetry?.blockHeight ?? null;
    if (height === null) return;
    if (prevBlockRef.current !== null && height > prevBlockRef.current) {
      window.dispatchEvent(new CustomEvent("os:toast", { detail: { text: `${copy.toasts.block} — ₿ ${height.toLocaleString(locale)}` } }));
      window.dispatchEvent(new CustomEvent("os:block"));
      playTick();
    }
    prevBlockRef.current = height;
  }, [telemetry, copy.toasts.block, locale]);

  const windowsRef = useRef(windows);
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  // The arrival foyer is shown until the visitor makes one meaningful
  // choice. Returning visitors resume the desktop without an interstitial.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        if (window.localStorage.getItem(ARRIVAL_STORAGE_KEY)) {
          document.documentElement.dataset.osArrived = "true";
          setArrivalPhase("hidden");
          return;
        }
      } catch {
        // Storage unavailable: show the useful path instead of blocking it.
      }
      delete document.documentElement.dataset.osArrived;
      setArrivalPhase("visible");
      trackOsEvent("arrival_impression", { locale });
    });
    return () => cancelAnimationFrame(frame);
  }, [locale]);

  // Returning visitors find their desktop the way they left it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const restored = restoreDesktop();
      if (restored) {
        zRef.current = restored.maxZ + 1;
        setWindows(restored.state);
      } else {
        setWindows(freshDesktop(window.innerWidth));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(DESKTOP_STORAGE_KEY, JSON.stringify(windows));
      } catch {
        // Layout simply won't persist.
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [windows]);

  const resetDesktop = useCallback(() => {
    try {
      window.localStorage.removeItem(DESKTOP_STORAGE_KEY);
      window.localStorage.removeItem(ARRIVAL_STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
    if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    delete document.documentElement.dataset.osArrived;
    zRef.current = 6;
    staggerRef.current = true;
    setWindows(freshDesktop(window.innerWidth));
    setMobileShell(false);
    setArrivalPhase("visible");
  }, []);

  useEffect(() => () => {
    if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      staggerRef.current = false;
    }, 800);
    // The desktop greets the sea with one splash once everything is up.
    const splash = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("os:sea-pulse", { detail: { x: 0.5, y: 0.6 } }));
    }, 2100);
    return () => {
      clearTimeout(timer);
      clearTimeout(splash);
    };
  }, []);

  const seaPulse = useCallback((id: WindowId) => {
    const rect = desktopRef.current?.getBoundingClientRect();
    const win = windowsRef.current[id];
    if (!rect || !win) return;
    window.dispatchEvent(
      new CustomEvent("os:sea-pulse", {
        detail: {
          x: (win.x + win.w / 2) / Math.max(rect.width, 1),
          y: (win.y + 90) / Math.max(rect.height, 1),
        },
      }),
    );
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    try {
      const sessionBooted = window.sessionStorage.getItem("ml_booted");
      const returningVisitor = Boolean(window.localStorage.getItem(ARRIVAL_STORAGE_KEY));
      if (!sessionBooted) window.sessionStorage.setItem("ml_booted", "1");
      // The foyer is the first visitor's arrival sequence. The kernel boot
      // remains a returning-session detail instead of delaying that LCP.
      if (!reduced && returningVisitor && !sessionBooted) {
        // The dismiss timer starts inside the show frame: in throttled
        // background tabs rAF can fire minutes late, and a detached
        // timeout would already have passed — leaving boot stuck on.
        frame = requestAnimationFrame(() => {
          setBooting(true);
          timer = setTimeout(() => setBooting(false), 1700);
        });
      }
    } catch {
      // Storage unavailable: skip the boot sequence.
    }
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  // Keep the default layout inside smaller desktop viewports.
  useEffect(() => {
    const clamp = () => {
      // The desktop remains mounted below the mobile breakpoint but has
      // zero layout width. Do not let that hidden frame overwrite a
      // returning visitor's real desktop coordinates.
      if (window.innerWidth < 1024) return;
      const width = desktopRef.current?.clientWidth ?? 1440;
      const height = desktopRef.current?.clientHeight ?? 820;
      setWindows((current) => {
        const next = { ...current };
        for (const id of Object.keys(next) as WindowId[]) {
          const win = next[id];
          next[id] = {
            ...win,
            x: Math.min(Math.max(8, win.x), Math.max(8, width - win.w - 8)),
            y: Math.min(Math.max(4, win.y), Math.max(4, height - 120)),
          };
        }
        return next;
      });
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  const focusWindow = useCallback((id: WindowId) => {
    zRef.current += 1;
    const z = zRef.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], z } }));
  }, []);

  const openWindow = useCallback((id: WindowId) => {
    zRef.current += 1;
    const z = zRef.current;
    playLock();
    seaPulse(id);
    trackOsEvent("os_window_open", { window: id });
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: true, min: false, z } }));
  }, [seaPulse]);

  const trackHomepageIntent = useCallback((intent: string, surface: "desktop" | "mobile" | "menubar") => {
    trackOsEvent("homepage_intent_click", { intent, surface, locale });
  }, [locale]);

  const markArrivalComplete = useCallback((intent: string) => {
    try {
      window.localStorage.setItem(ARRIVAL_STORAGE_KEY, "1");
    } catch {
      // The route or desktop remains usable without persistence.
    }
    document.documentElement.dataset.osArrived = "true";
    trackOsEvent("arrival_intent_click", { intent, locale });
    const journeyIntent = intent === "start" ? "stage_brief" : intent === "services" ? "stage_fit" : intent.startsWith("proof_") ? "stage_proof" : null;
    if (journeyIntent) trackOsEvent("guided_journey_click", { intent: journeyIntent, source: "foyer", locale });
  }, [locale]);

  const revealDesktop = useCallback((intent: "enter" | "work") => {
    markArrivalComplete(intent);
    playLock();
    setArrivalPhase("leaving");
    if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 620;
    arrivalTimerRef.current = setTimeout(() => setArrivalPhase("hidden"), delay);
  }, [markArrivalComplete]);

  const inspectArrivalWork = useCallback(() => {
    trackOsEvent("guided_journey_click", { intent: "stage_proof", source: "foyer", locale });
    zRef.current += 1;
    const z = zRef.current;
    setWindows((current) => ({ ...current, work: { ...current.work, open: true, min: false, z } }));
    revealDesktop("work");
  }, [locale, revealDesktop]);

  const closeWindow = useCallback((id: WindowId) => {
    playTick();
    seaPulse(id);
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: false, max: false, snap: null } }));
  }, [seaPulse]);

  const minimizeWindow = useCallback((id: WindowId) => {
    playTick();
    seaPulse(id);
    setWindows((current) => ({ ...current, [id]: { ...current[id], min: true } }));
  }, [seaPulse]);

  const toggleMaximize = useCallback((id: WindowId) => {
    playLock();
    seaPulse(id);
    zRef.current += 1;
    const z = zRef.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], max: !current[id].max, snap: null, z } }));
  }, [seaPulse]);

  const snapWindow = useCallback((id: WindowId, side: "left" | "right" | null) => {
    if (side) playLock();
    zRef.current += 1;
    const z = zRef.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], snap: side, max: false, z } }));
  }, []);

  const moveWindow = useCallback((id: WindowId, x: number, y: number) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], x, y } }));
  }, []);

  const nudgeWindow = useCallback((id: WindowId, dx: number, dy: number) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], x: current[id].x + dx, y: current[id].y + dy } }));
  }, []);

  // The guided tour drives the OS through the same event bus.
  useEffect(() => {
    const onAction = (event: Event) => {
      const detail = (event as CustomEvent).detail ?? {};
      const id = detail.id as WindowId;
      if (!id || !(id in INITIAL_WINDOWS)) return;
      if (detail.action === "open") openWindow(id);
      else if (detail.action === "nudge" && typeof detail.dx === "number" && typeof detail.dy === "number") {
        nudgeWindow(id, detail.dx, detail.dy);
      }
    };
    window.addEventListener("os:tour-action", onAction);
    return () => window.removeEventListener("os:tour-action", onAction);
  }, [openWindow, nudgeWindow]);

  const checks = telemetry?.checks ?? [
    { id: "hodlstay", host: "hodlstay.com", ok: false, status: 0, ms: null },
    { id: "satoshi-gazette", host: "satoshigazette.org", ok: false, status: 0, ms: null },
  ];

  const windowProps = {
    onFocus: focusWindow,
    onClose: closeWindow,
    onMinimize: minimizeWindow,
    onMaximize: toggleMaximize,
    onSnap: snapWindow,
    onMove: moveWindow,
    desktopRef,
    stagger: staggerRef,
  };

  return (
    <div className="mayda-os">
      {booting ? (
        <div className="os-boot" onClick={() => setBooting(false)} aria-hidden="true">
          <div>
            {copy.boot.map((line, index) => (
              <p key={line} style={{ animationDelay: `${120 + index * 190}ms` }}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}

      <OsArrival
        locale={locale}
        phase={arrivalPhase}
        onEnter={() => revealDesktop("enter")}
        onInspectWork={inspectArrivalWork}
        onRoute={markArrivalComplete}
        onProofSwitch={(transmission) => trackOsEvent("arrival_proof_switch", { transmission, locale })}
      />

      <div
        className={`os-desktop-frame os-desktop-only ${arrivalPhase === "checking" || arrivalPhase === "visible" ? "is-arrival-covered" : ""}`}
        aria-hidden={arrivalPhase !== "hidden" ? "true" : undefined}
        inert={arrivalPhase !== "hidden" ? true : undefined}
      >
        <OsMenuBar
          locale={locale}
          blockHeight={telemetry?.blockHeight ?? null}
          onBrandClick={() => openWindow("about")}
          onStartProject={() => trackHomepageIntent("start", "menubar")}
        />

        <div
          className="os-desktop"
          ref={desktopRef}
          onClick={(event) => {
            const now = performance.now();
            if (now - lastSplashRef.current < 400) return;
            lastSplashRef.current = now;
            window.dispatchEvent(
              new CustomEvent("os:sea-pulse", {
                detail: { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight },
              }),
            );
          }}
        >
          <div className="os-wallpaper" aria-hidden="true">
            <OsWallpaper mempoolCount={telemetry?.mempoolCount ?? null} />
          </div>

          <OsWindow id="welcome" title={copy.welcome.title} state={windows.welcome} {...windowProps}>
            <div className="os-welcome">
              <p className="os-welcome-kicker">{copy.welcome.kicker}</p>
              <h1>
                <SignalDecode text={copy.welcome.hero[0]} delay={220} /><br />
                {copy.welcome.hero[1]} <em><SignalDecode text={copy.welcome.hero[2]} delay={900} /></em>
              </h1>
              <div className="os-welcome-doc">
                {copy.welcome.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
                <p className="os-welcome-proof">{copy.welcome.proof}</p>
                <div className="os-welcome-intents" aria-label={copy.welcome.title}>
                  <Link
                    href={localizePath("/contact", locale)}
                    className="os-welcome-intent is-primary"
                    data-tour="start"
                    data-journey-intent="stage_brief"
                    data-journey-source="desktop_welcome"
                    onClick={() => trackHomepageIntent("start", "desktop")}
                  >
                    <span>01</span>
                    <strong>{copy.welcome.intents.start[0]}</strong>
                    <small>{copy.welcome.intents.start[1]}</small>
                    <em aria-hidden="true">→</em>
                  </Link>
                  <button
                    type="button"
                    className="os-welcome-intent"
                    onClick={() => {
                      trackHomepageIntent("work", "desktop");
                      trackOsEvent("guided_journey_click", { intent: "stage_proof", source: "desktop_welcome", locale });
                      openWindow("work");
                    }}
                  >
                    <span>02</span>
                    <strong>{copy.welcome.intents.work[0]}</strong>
                    <small>{copy.welcome.intents.work[1]}</small>
                    <em aria-hidden="true">→</em>
                  </button>
                  <Link
                    href={localizePath("/services#service-paths", locale)}
                    className="os-welcome-intent"
                    data-journey-intent="stage_fit"
                    data-journey-source="desktop_welcome"
                    onClick={() => trackHomepageIntent("services", "desktop")}
                  >
                    <span>03</span>
                    <strong>{copy.welcome.intents.services[0]}</strong>
                    <small>{copy.welcome.intents.services[1]}</small>
                    <em aria-hidden="true">→</em>
                  </Link>
                </div>
              </div>
              <div className="os-welcome-secondary">
                <button
                  type="button"
                  onClick={() => {
                    trackHomepageIntent("tour", "desktop");
                    window.dispatchEvent(new CustomEvent("os:tour"));
                  }}
                >
                  {copy.tour.offer} <span aria-hidden="true">▶</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackHomepageIntent("explore", "desktop");
                    minimizeWindow("welcome");
                  }}
                >
                  {copy.welcome.explore} <span aria-hidden="true">↗</span>
                </button>
                <Link href={localizePath("/profile", locale)} onClick={() => trackHomepageIntent("profile", "desktop")}>
                  {copy.welcome.intents.profile[0]} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </OsWindow>

          <OsWindow id="hodlstay" title={copy.hodlstayWindow.title} state={windows.hodlstay} {...windowProps} accent>
            <div className="os-preview">
              <HodlStayJourney locale={locale} sizes="540px" />
              <div className="os-preview-caption">
                <span>{copy.hodlstayWindow.caption}</span>
                <Link href={localizePath("/case-studies/hodlstay", locale)}>{copy.hodlstayWindow.cta} →</Link>
              </div>
            </div>
          </OsWindow>

          <OsWindow id="gazette" title={copy.gazetteWindow.title} state={windows.gazette} {...windowProps} accent>
            <div className="os-preview">
              <SatoshiGazetteJourney locale={locale} sizes="540px" />
              <div className="os-preview-caption">
                <span>{copy.gazetteWindow.caption}</span>
                <Link href={localizePath("/case-studies/satoshi-gazette", locale)}>{copy.gazetteWindow.cta} →</Link>
              </div>
            </div>
          </OsWindow>

          <OsWindow id="work" title={copy.workWindow.title} state={windows.work} {...windowProps}>
            <div className="os-live-work">
              <div className="os-live-work-head">
                <p>{copy.workWindow.intro}</p>
                <Link
                  href={localizePath("/case-studies", locale)}
                  onClick={() => trackHomepageIntent("work_all", "desktop")}
                >
                  {copy.workWindow.viewAll} →
                </Link>
              </div>
              <div className="os-live-work-grid">
                {copy.workWindow.live.map((item) => (
                  <Link
                    key={item.tx}
                    href={localizePath(item.path, locale)}
                    className="os-live-work-card"
                    onClick={() => trackHomepageIntent(`work_${item.tx.toLowerCase()}`, "desktop")}
                  >
                    <span className="os-live-work-image">
                      <Image
                        src={item.image}
                        alt={item.alt}
                        width={item.width}
                        height={item.height}
                        sizes="(min-width: 1024px) 350px, 1px"
                      />
                    </span>
                    <span className="os-live-work-meta"><i aria-hidden="true" />{item.tx} · {item.status}</span>
                    <strong>{item.name}</strong>
                    <small>{item.proof}</small>
                    <em>{copy.workWindow.open} →</em>
                  </Link>
                ))}
              </div>
              <div className="os-live-work-private">
                <span>{copy.workWindow.privateLabel}</span>
                {copy.workWindow.rows.slice(2).map((row) => (
                  <Link key={row.tx} href={localizePath(row.path, locale)}>{row.tx} · {row.name}</Link>
                ))}
              </div>
            </div>
          </OsWindow>

          <OsWindow id="monitor" title={copy.monitorWindow.title} state={windows.monitor} {...windowProps}>
            <div className="os-monitor">
              {checks.map((check) => (
                <div key={check.id} className={telemetry && check.ok ? "is-live" : ""}>
                  <i aria-hidden="true" />
                  <strong>{check.host}</strong>
                  <span>{telemetry ? (check.ok ? `${check.status} · ${check.ms} ms` : copy.monitorWindow.noCarrier) : telemetryFailed ? copy.monitorWindow.noCarrier : copy.monitorWindow.scanning}</span>
                </div>
              ))}
              <div className={telemetry?.blockHeight ? "is-live" : ""}>
                <i aria-hidden="true" />
                <strong>{copy.monitorWindow.block}</strong>
                <span>{telemetry?.blockHeight ? telemetry.blockHeight.toLocaleString(locale) : telemetryFailed ? copy.monitorWindow.noCarrier : copy.monitorWindow.scanning}</span>
              </div>
              <svg viewBox="0 0 290 30" aria-hidden="true"><polyline points="0,24 24,22 48,25 72,16 96,20 120,10 144,14 168,7 192,12 216,5 240,10 264,4 290,8" /></svg>
            </div>
          </OsWindow>

          <OsWindow id="about" title={copy.aboutWindow.title} state={windows.about} {...windowProps}>
            <AboutMayda locale={locale} bootedAt={BOOTED_AT} />
          </OsWindow>

          <OsWindow id="trash" title={copy.trashWindow.title} state={windows.trash} {...windowProps}>
            <TrashBin locale={locale} />
          </OsWindow>

          <OsWindow id="array" title={copy.arrayWindow.title} state={windows.array} {...windowProps}>
            <div className="os-array">
              <ProductConstellation locale={locale} />
            </div>
          </OsWindow>

          <OsWindow id="terminal" title={copy.terminalWindow.title} state={windows.terminal} {...windowProps}>
            <OsTerminal
              locale={locale}
              telemetry={telemetry}
              onOpenWindow={openWindow}
              onNavigate={(path) => router.push(localizePath(path, locale))}
              onReset={resetDesktop}
            />
          </OsWindow>

          <p className="os-desktop-tag" aria-hidden="true">MAYDAOS 26.08 · ISTANBUL / EVERYWHERE</p>

          <OsTour locale={locale} />

          <div className="os-toasts" aria-live="polite">
            {toasts.map((toast) => (
              <div key={toast.id} className="os-toast"><i aria-hidden="true" />{toast.text}</div>
            ))}
          </div>
        </div>

        <nav className="os-dock" aria-label="MaydaOS dock">
          <button type="button" className={windows.welcome.open ? "is-running" : ""} onClick={() => openWindow("welcome")} aria-label={copy.dock.welcome} data-tooltip={`${copy.dock.welcome} — ${copy.dockHelp.welcome}`}><Glyph name="doc" /></button>
          <button type="button" className={windows.work.open ? "is-running" : ""} onClick={() => openWindow("work")} aria-label={copy.dock.work} data-tooltip={`${copy.dock.work} — ${copy.dockHelp.work}`}><Glyph name="grid" /></button>
          <button type="button" className={windows.terminal.open ? "is-running" : ""} onClick={() => openWindow("terminal")} aria-label={copy.dock.terminal} data-tooltip={`${copy.dock.terminal} — ${copy.dockHelp.terminal}`}><Glyph name="shell" /></button>
          <button type="button" className={windows.monitor.open ? "is-running" : ""} onClick={() => openWindow("monitor")} aria-label={copy.dock.monitor} data-tooltip={`${copy.dock.monitor} — ${copy.dockHelp.monitor}`}><Glyph name="monitor" /></button>
          <button type="button" className={windows.array.open ? "is-running" : ""} onClick={() => openWindow("array")} aria-label={copy.arrayWindow.title} data-tooltip={`${copy.arrayWindow.title} — ${copy.dockHelp.array}`} data-tour="dock-array"><Glyph name="array" /></button>
          <i aria-hidden="true" />
          <Link href={localizePath("/services", locale)} aria-label={copy.dock.services} data-tooltip={`${copy.dock.services} — ${copy.dockHelp.services}`}><Glyph name="layers" /></Link>
          <Link href={localizePath("/about", locale)} aria-label={copy.dock.about} data-tooltip={`${copy.dock.about} — ${copy.dockHelp.about}`}><Glyph name="mark" /></Link>
          <Link href={localizePath("/contact", locale)} aria-label={copy.dock.call} data-tooltip={`${copy.dock.call} — ${copy.dockHelp.call}`} className="os-dock-accent"><Glyph name="send" stroke="#f7931a" /></Link>
          <i aria-hidden="true" />
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("os:tour"))} aria-label={copy.tour.dock} data-tooltip={`${copy.tour.dock} — ${copy.dockHelp.tour}`}><Glyph name="play" /></button>
          <button type="button" className={windows.trash.open ? "is-running" : ""} onClick={() => openWindow("trash")} aria-label={copy.dock.trash} data-tooltip={`${copy.dock.trash} — ${copy.dockHelp.trash}`}><Glyph name="trash" /></button>
        </nav>

        {arrivalPhase === "hidden" ? <OsScreensaver locale={locale} /> : null}
      </div>

      <OsMatrix />

      <div
        className={`os-mobile os-mobile-only ${arrivalPhase === "checking" || arrivalPhase === "visible" ? "is-arrival-covered" : ""}`}
        aria-hidden={arrivalPhase !== "hidden" ? "true" : undefined}
        inert={arrivalPhase !== "hidden" ? true : undefined}
      >
        <div className="os-mobile-status">
          <span aria-label={telemetry?.blockHeight ? `${copy.monitorWindow.block}: ${telemetry.blockHeight.toLocaleString(locale)}` : copy.monitorWindow.scanning}>₿ {copy.monitorWindow.network}</span>
          <span>MAYDAOS 26.08</span>
        </div>
        <div className="os-mobile-head">
          <MaydaMark className="h-9 w-9 text-white" />
          <h1>{copy.mobile.greeting}</h1>
          <p>{copy.mobile.sub}</p>
        </div>
        <p className="os-mobile-apps-label">{copy.mobile.appsLabel}</p>
        <div className="os-mobile-grid">
          {copy.mobile.apps.map((app) => (
            <Link key={app.path} href={localizePath(app.path, locale)}>
              <span><Glyph name={app.glyph} /></span>
              {app.label}
            </Link>
          ))}
          <button type="button" className="os-mobile-shell-tile" onClick={() => setMobileShell(true)}>
            <span><Glyph name="shell" /></span>
            {copy.dock.terminal}
            <em aria-hidden="true">guest@maydalabs:~$</em>
          </button>
        </div>
        <div className="os-mobile-monitor">
          {checks.map((check) => (
            <div key={check.id} className={telemetry && check.ok ? "is-live" : ""}>
              <i aria-hidden="true" /><strong>{check.host}</strong>
              <span aria-label={telemetry ? (check.ok ? `${check.status} · ${check.ms} ms` : copy.monitorWindow.noCarrier) : telemetryFailed ? copy.monitorWindow.noCarrier : copy.monitorWindow.scanning}>{copy.monitorWindow.publicStatus}</span>
            </div>
          ))}
        </div>
        {mobileShell ? (
          <div className="os-mobile-terminal" role="dialog" aria-label={copy.terminalWindow.title}>
            <div className="os-mobile-terminal-bar">
              <span>{copy.terminalWindow.title}</span>
              <button type="button" onClick={() => setMobileShell(false)} aria-label="✕">✕</button>
            </div>
            <OsTerminal
              locale={locale}
              variant="mobile"
              telemetry={telemetry}
              onOpenWindow={() => undefined}
              onNavigate={(path) => router.push(localizePath(path, locale))}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AboutMayda({ locale, bootedAt }: { locale: Locale; bootedAt: number }) {
  const copy = OS_COPY[locale].aboutWindow;
  const [uptime, setUptime] = useState("0:00");

  useEffect(() => {
    const tick = () => {
      const seconds = Math.floor((Date.now() - bootedAt) / 1000);
      setUptime(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
    };
    const frame = requestAnimationFrame(tick);
    const interval = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [bootedAt]);

  return (
    <div className="os-about">
      <MaydaMark className="h-10 w-10 text-white" />
      <dl>
        {copy.rows.map(([term, value]) => (
          <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
        ))}
        <div><dt>{copy.uptime}</dt><dd>{uptime}</dd></div>
      </dl>
      <p>{copy.footer}</p>
    </div>
  );
}

function TrashBin({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale].trashWindow;
  const [emptied, setEmptied] = useState(false);

  return (
    <div className="os-trash">
      <ul>
        {copy.items.map((item) => (
          <li key={item} className={emptied ? "is-gone" : ""}><Glyph name="doc" stroke="rgba(242,240,234,0.4)" />{item}</li>
        ))}
      </ul>
      {emptied ? (
        <p>{copy.emptied}</p>
      ) : (
        <button
          type="button"
          className="studio-button studio-button-small studio-button-ghost"
          onClick={() => {
            playLock();
            setEmptied(true);
          }}
        >
          {copy.empty}
        </button>
      )}
    </div>
  );
}

function OsWindow({
  id,
  title,
  state,
  accent = false,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onSnap,
  onMove,
  desktopRef,
  stagger,
  children,
}: {
  id: WindowId;
  title: string;
  state: WindowState;
  accent?: boolean;
  onFocus: (id: WindowId) => void;
  onClose: (id: WindowId) => void;
  onMinimize: (id: WindowId) => void;
  onMaximize: (id: WindowId) => void;
  onSnap: (id: WindowId, side: "left" | "right" | null) => void;
  onMove: (id: WindowId, x: number, y: number) => void;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  stagger: React.RefObject<boolean>;
  children: React.ReactNode;
}) {
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);

  if (!state.open || state.min) return null;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    if (state.max) return;
    let baseX = state.x;
    if (state.snap) {
      // Dragging a snapped window peels it off under the pointer.
      const rect = desktopRef.current?.getBoundingClientRect();
      baseX = Math.max(8, event.clientX - (rect?.left ?? 0) - state.w / 2);
      onSnap(id, null);
      onMove(id, baseX, 60);
    }
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX, baseY: state.snap ? 60 : state.y, moved: false };
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.moved = true;
    const bounds = desktopRef.current;
    const maxX = Math.max(8, (bounds?.clientWidth ?? 1440) - state.w - 8);
    const maxY = Math.max(4, (bounds?.clientHeight ?? 800) - 90);
    onMove(
      id,
      Math.min(Math.max(8, drag.baseX + event.clientX - drag.startX), maxX),
      Math.min(Math.max(4, drag.baseY + event.clientY - drag.startY), maxY),
    );
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    if (px < 26) onSnap(id, "left");
    else if (px > rect.width - 26) onSnap(id, "right");
    else if (py < 14) onMaximize(id);
  };

  const enterDelay = stagger.current ? (ENTER_DELAYS[id] ?? 0) : 0;
  const style = state.max
    ? { left: 10, top: 8, width: "calc(100% - 20px)", height: "calc(100% - 16px)", zIndex: state.z, animationDelay: `${enterDelay}ms` }
    : state.snap
      ? { left: state.snap === "left" ? 8 : "50%", top: 8, width: "calc(50% - 12px)", height: "calc(100% - 16px)", zIndex: state.z, animationDelay: `${enterDelay}ms` }
      : { left: state.x, top: state.y, width: state.w, zIndex: state.z, animationDelay: `${enterDelay}ms` };

  return (
    <section
      className={`os-window ${accent ? "os-window-accent" : ""} ${state.max || state.snap ? "is-max" : ""}`}
      style={style}
      aria-label={title}
      data-window={id}
      onPointerDown={() => onFocus(id)}
    >
      <div className="os-window-bar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <span className="os-window-lights">
          <button type="button" className="os-light os-light-close" onClick={() => onClose(id)} aria-label={`close — ${title}`} />
          <button type="button" className="os-light os-light-min" onClick={() => onMinimize(id)} aria-label={`minimize — ${title}`} />
          <button type="button" className="os-light os-light-max" onClick={() => onMaximize(id)} aria-label={`maximize — ${title}`} />
        </span>
        <span className="os-window-title">{title}</span>
      </div>
      <div className="os-window-body">{children}</div>
    </section>
  );
}
