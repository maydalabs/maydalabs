"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaydaMark } from "@/components/MaydaMark";
import { ProductConstellation } from "@/components/ProductConstellation";
import { SignalDecode } from "@/components/SignalDecode";
import { type Locale, localizePath } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { playLock, playTick } from "@/lib/soundSignal";
import { OsMenuBar } from "@/components/os/OsMenuBar";
import { OsScreensaver } from "@/components/os/OsScreensaver";
import { OsWallpaper } from "@/components/os/OsWallpaper";
import { OS_COPY } from "@/components/os/osCopy";
import { useTelemetry, type Telemetry } from "@/components/os/useTelemetry";

type WindowId = "welcome" | "work" | "hodlstay" | "monitor" | "terminal" | "about" | "trash" | "array";

type WindowState = { open: boolean; min: boolean; max: boolean; x: number; y: number; z: number; w: number };

const INITIAL_WINDOWS: Record<WindowId, WindowState> = {
  welcome: { open: true, min: false, max: false, x: 64, y: 46, z: 4, w: 500 },
  hodlstay: { open: true, min: false, max: false, x: 612, y: 26, z: 2, w: 540 },
  monitor: { open: true, min: false, max: false, x: 1082, y: 58, z: 3, w: 330 },
  terminal: { open: true, min: false, max: false, x: 648, y: 428, z: 5, w: 560 },
  work: { open: false, min: false, max: false, x: 190, y: 160, z: 1, w: 470 },
  about: { open: false, min: false, max: false, x: 420, y: 130, z: 1, w: 360 },
  trash: { open: false, min: false, max: false, x: 500, y: 210, z: 1, w: 400 },
  array: { open: false, min: false, max: false, x: 320, y: 90, z: 1, w: 680 },
};

const ENTER_DELAYS: Partial<Record<WindowId, number>> = { welcome: 60, hodlstay: 150, monitor: 240, terminal: 330 };

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
  const [windows, setWindows] = useState(INITIAL_WINDOWS);
  const [booting, setBooting] = useState(false);
  const { telemetry, failed: telemetryFailed } = useTelemetry();

  useEffect(() => {
    const timer = setTimeout(() => {
      staggerRef.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    try {
      if (!reduced && !window.sessionStorage.getItem("ml_booted")) {
        window.sessionStorage.setItem("ml_booted", "1");
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
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: true, min: false, z } }));
  }, []);

  const closeWindow = useCallback((id: WindowId) => {
    playTick();
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: false, max: false } }));
  }, []);

  const minimizeWindow = useCallback((id: WindowId) => {
    playTick();
    setWindows((current) => ({ ...current, [id]: { ...current[id], min: true } }));
  }, []);

  const toggleMaximize = useCallback((id: WindowId) => {
    playLock();
    zRef.current += 1;
    const z = zRef.current;
    setWindows((current) => ({ ...current, [id]: { ...current[id], max: !current[id].max, z } }));
  }, []);

  const moveWindow = useCallback((id: WindowId, x: number, y: number) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], x, y } }));
  }, []);

  const projectUrl = getIntroCallUrl("os_desktop");
  const checks = telemetry?.checks ?? [
    { id: "hodlstay", host: "hodlstay.com", ok: false, status: 0, ms: null },
    { id: "satoshi-gazette", host: "satoshigazette.org", ok: false, status: 0, ms: null },
  ];

  const windowProps = {
    onFocus: focusWindow,
    onClose: closeWindow,
    onMinimize: minimizeWindow,
    onMaximize: toggleMaximize,
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

      <div className="os-desktop-frame os-desktop-only">
        <OsMenuBar locale={locale} blockHeight={telemetry?.blockHeight ?? null} onBrandClick={() => openWindow("about")} />

        <div className="os-desktop" ref={desktopRef}>
          <div className="os-wallpaper" aria-hidden="true">
            <OsWallpaper />
          </div>

          <OsWindow id="welcome" title={copy.welcome.title} state={windows.welcome} {...windowProps}>
            <div className="os-welcome">
              <p className="os-welcome-kicker">{copy.welcome.kicker}</p>
              <h1>
                <SignalDecode text={copy.welcome.hero[0]} delay={220} /><br />
                {copy.welcome.hero[1]} <em><SignalDecode text={copy.welcome.hero[2]} delay={900} /></em>
              </h1>
              <p>{copy.welcome.body}</p>
              <div className="os-welcome-actions">
                <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="studio-button studio-button-small">{copy.welcome.start} <span aria-hidden>↗</span></a>
                <button type="button" className="studio-button studio-button-small studio-button-ghost" onClick={() => openWindow("work")}>{copy.welcome.explore}</button>
              </div>
            </div>
          </OsWindow>

          <OsWindow id="hodlstay" title={copy.hodlstayWindow.title} state={windows.hodlstay} {...windowProps} accent>
            <div className="os-preview">
              <Image src="/work/hodlstay-2026-08-home.png" alt="HodlStay marketplace homepage" width={540} height={338} priority />
              <div className="os-preview-caption">
                <span>{copy.hodlstayWindow.caption}</span>
                <Link href={localizePath("/case-studies/hodlstay", locale)}>{copy.hodlstayWindow.cta} →</Link>
              </div>
            </div>
          </OsWindow>

          <OsWindow id="work" title={copy.workWindow.title} state={windows.work} {...windowProps}>
            <ul className="os-work-list">
              {copy.workWindow.rows.map((row) => (
                <li key={row.tx}>
                  <span>{row.tx}</span>
                  <strong>{row.name}</strong>
                  <small>{row.status}</small>
                  <Link href={localizePath(row.path, locale)}>{copy.workWindow.open} →</Link>
                </li>
              ))}
            </ul>
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
              hint={copy.terminalWindow.hint}
              telemetry={telemetry}
              bootedAt={BOOTED_AT}
              onOpenWindow={openWindow}
              onNavigate={(path) => router.push(localizePath(path, locale))}
            />
          </OsWindow>

          <p className="os-desktop-tag" aria-hidden="true">MAYDAOS 26.08 · ISTANBUL / EVERYWHERE</p>
        </div>

        <nav className="os-dock" aria-label="MaydaOS dock">
          <button type="button" className={windows.welcome.open ? "is-running" : ""} onClick={() => openWindow("welcome")} title={copy.dock.welcome}><Glyph name="doc" /></button>
          <button type="button" className={windows.work.open ? "is-running" : ""} onClick={() => openWindow("work")} title={copy.dock.work}><Glyph name="grid" /></button>
          <button type="button" className={windows.terminal.open ? "is-running" : ""} onClick={() => openWindow("terminal")} title={copy.dock.terminal}><Glyph name="shell" /></button>
          <button type="button" className={windows.monitor.open ? "is-running" : ""} onClick={() => openWindow("monitor")} title={copy.dock.monitor}><Glyph name="monitor" /></button>
          <button type="button" className={windows.array.open ? "is-running" : ""} onClick={() => openWindow("array")} title={copy.arrayWindow.title}><Glyph name="array" /></button>
          <i aria-hidden="true" />
          <Link href={localizePath("/services", locale)} title={copy.dock.services}><Glyph name="layers" /></Link>
          <Link href={localizePath("/about", locale)} title={copy.dock.about}><Glyph name="mark" /></Link>
          <a href={getIntroCallUrl("os_dock")} target="_blank" rel="noopener noreferrer" title={copy.dock.call} className="os-dock-accent"><Glyph name="call" stroke="#f7931a" /></a>
          <i aria-hidden="true" />
          <button type="button" className={windows.trash.open ? "is-running" : ""} onClick={() => openWindow("trash")} title={copy.dock.trash}><Glyph name="trash" /></button>
        </nav>

        <OsScreensaver locale={locale} />
      </div>

      <div className="os-mobile os-mobile-only">
        <div className="os-mobile-status">
          <span>₿ {telemetry?.blockHeight ? telemetry.blockHeight.toLocaleString(locale) : "———"}</span>
          <span>MAYDAOS 26.08</span>
        </div>
        <div className="os-mobile-head">
          <MaydaMark className="h-9 w-9 text-white" />
          <h1>{copy.mobile.greeting}</h1>
          <p>{copy.mobile.sub}</p>
        </div>
        <div className="os-mobile-grid">
          {copy.mobile.apps.map((app) => (
            <Link key={app.path} href={localizePath(app.path, locale)}>
              <span><Glyph name={app.glyph} /></span>
              {app.label}
            </Link>
          ))}
        </div>
        <div className="os-mobile-monitor">
          {checks.map((check) => (
            <div key={check.id} className={telemetry && check.ok ? "is-live" : ""}>
              <i aria-hidden="true" /><strong>{check.host}</strong>
              <span>{telemetry ? (check.ok ? `${check.status} · ${check.ms} ms` : copy.monitorWindow.noCarrier) : telemetryFailed ? copy.monitorWindow.noCarrier : copy.monitorWindow.scanning}</span>
            </div>
          ))}
        </div>
        <a href={getIntroCallUrl("os_mobile")} target="_blank" rel="noopener noreferrer" className="studio-button os-mobile-call">{copy.mobile.call} <span aria-hidden>↗</span></a>
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
  onMove: (id: WindowId, x: number, y: number) => void;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  stagger: React.RefObject<boolean>;
  children: React.ReactNode;
}) {
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  if (!state.open || state.min) return null;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    if (state.max) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: state.x, baseY: state.y };
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const bounds = desktopRef.current;
    const maxX = Math.max(8, (bounds?.clientWidth ?? 1440) - state.w - 8);
    const maxY = Math.max(4, (bounds?.clientHeight ?? 800) - 90);
    onMove(
      id,
      Math.min(Math.max(8, drag.baseX + event.clientX - drag.startX), maxX),
      Math.min(Math.max(4, drag.baseY + event.clientY - drag.startY), maxY),
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const enterDelay = stagger.current ? (ENTER_DELAYS[id] ?? 0) : 0;
  const style = state.max
    ? { left: 10, top: 8, width: "calc(100% - 20px)", height: "calc(100% - 16px)", zIndex: state.z, animationDelay: `${enterDelay}ms` }
    : { left: state.x, top: state.y, width: state.w, zIndex: state.z, animationDelay: `${enterDelay}ms` };

  return (
    <section
      className={`os-window ${accent ? "os-window-accent" : ""} ${state.max ? "is-max" : ""}`}
      style={style}
      aria-label={title}
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

type TermLine = { kind: "cmd" | "out" | "accent"; text: string };

const COMMANDS = ["help", "work", "open", "proof", "services", "about", "book-call", "lang", "whoami", "clear", "sudo", "gui", "neofetch", "trash", "screensaver", "date", "echo", "array"];

function OsTerminal({
  locale,
  hint,
  telemetry,
  bootedAt,
  onOpenWindow,
  onNavigate,
}: {
  locale: Locale;
  hint: string;
  telemetry: Telemetry | null;
  bootedAt: number;
  onOpenWindow: (id: WindowId) => void;
  onNavigate: (path: string) => void;
}) {
  const [lines, setLines] = useState<TermLine[]>([{ kind: "out", text: hint }]);
  const [value, setValue] = useState("");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const input = raw.trim();
    if (!input) return;
    historyRef.current.push(input);
    historyIndexRef.current = -1;
    const push = (extra: TermLine[]) => setLines((current) => [...current, { kind: "cmd", text: input }, ...extra]);
    const [command, ...rest] = input.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();

    switch (command.toLowerCase()) {
      case "help":
        push([
          { kind: "out", text: "work · open <tx-01…04> · proof · array · neofetch · services · about" },
          { kind: "out", text: "book-call · lang <en|tr|fr> · trash · screensaver · whoami · clear" },
          { kind: "out", text: "tab completes · arrows replay history · sudo does what sudo does" },
        ]);
        break;
      case "work":
        push([{ kind: "out", text: "TX-01 hodlstay · TX-02 gazette · TX-03 vault* · TX-04 sofra*  (* encrypted)" }]);
        onOpenWindow("work");
        break;
      case "open": {
        const map: Record<string, string> = {
          "tx-01": "/case-studies/hodlstay", hodlstay: "/case-studies/hodlstay",
          "tx-02": "/case-studies/satoshi-gazette", gazette: "/case-studies/satoshi-gazette",
          "tx-03": "/case-studies/mortal-vault", vault: "/case-studies/mortal-vault",
          "tx-04": "/case-studies/sofra", sofra: "/case-studies/sofra",
        };
        if (map[arg]) {
          push([{ kind: "accent", text: `opening ${arg} …` }]);
          onNavigate(map[arg]);
        } else {
          push([{ kind: "out", text: "usage: open <tx-01|tx-02|tx-03|tx-04>" }]);
        }
        break;
      }
      case "proof":
        push(
          telemetry
            ? [
                ...telemetry.checks.map((check) => ({
                  kind: "out" as const,
                  text: `${check.host} — ${check.ok ? `${check.status} · ${check.ms} ms · broadcasting` : "no carrier"}`,
                })),
                { kind: "out", text: `btc tip — ${telemetry.blockHeight?.toLocaleString("en") ?? "unknown"}` },
              ]
            : [{ kind: "out", text: "telemetry still scanning — try again in a second" }],
        );
        break;
      case "neofetch": {
        const seconds = Math.floor((Date.now() - bootedAt) / 1000);
        push([
          { kind: "accent", text: "  ▲▼   guest@maydalabs" },
          { kind: "accent", text: " ▲ ● ▼  ──────────────" },
          { kind: "out", text: `  ▼▲   OS: MaydaOS 26.08 (signal)` },
          { kind: "out", text: `       Shell: mayda-sh 1.0 · Locale: ${locale}` },
          { kind: "out", text: `       Uptime: ${Math.floor(seconds / 60)}m ${seconds % 60}s · Products: 4 (2 broadcasting)` },
          { kind: "out", text: `       Display: Bitcoin orange @ 60 Hz · Memory: enough` },
        ]);
        break;
      }
      case "services":
        push([{ kind: "accent", text: "opening services …" }]);
        onNavigate("/services");
        break;
      case "about":
        push([{ kind: "accent", text: "about this mayda …" }]);
        onOpenWindow("about");
        break;
      case "trash":
        push([{ kind: "accent", text: "taking out the trash …" }]);
        onOpenWindow("trash");
        break;
      case "array":
        push([{ kind: "accent", text: "raising the signal array …" }]);
        onOpenWindow("array");
        break;
      case "screensaver":
        push([{ kind: "accent", text: "dimming the lights …" }]);
        window.dispatchEvent(new CustomEvent("os:screensaver"));
        break;
      case "book-call":
      case "book":
        push([{ kind: "accent", text: "opening the calendar — bring the messy idea" }]);
        window.open(getIntroCallUrl("os_terminal"), "_blank", "noopener,noreferrer");
        break;
      case "lang": {
        if (arg === "en" || arg === "tr" || arg === "fr") {
          push([{ kind: "accent", text: `switching to ${arg} …` }]);
          window.location.assign(arg === "en" ? "/" : `/${arg}`);
        } else {
          push([{ kind: "out", text: "usage: lang <en|tr|fr>" }]);
        }
        break;
      }
      case "date":
        push([{ kind: "out", text: new Date().toString() }]);
        break;
      case "echo":
        push([{ kind: "out", text: rest.join(" ") || "" }]);
        break;
      case "whoami":
        push([{ kind: "out", text: "guest — a founder with a messy idea, probably" }]);
        break;
      case "sudo":
        push([{ kind: "out", text: "nice try. this studio runs on proof, not privileges." }]);
        break;
      case "clear":
        setLines([]);
        return;
      case "gui":
        push([{ kind: "out", text: "you're soaking in it." }]);
        break;
      default:
        push([{ kind: "out", text: `command not found: ${command} — try help` }]);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const history = historyRef.current;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      historyIndexRef.current = historyIndexRef.current < 0 ? history.length - 1 : Math.max(0, historyIndexRef.current - 1);
      setValue(history[historyIndexRef.current]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndexRef.current < 0) return;
      historyIndexRef.current += 1;
      if (historyIndexRef.current >= history.length) {
        historyIndexRef.current = -1;
        setValue("");
      } else {
        setValue(history[historyIndexRef.current]);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();
      const current = value.trim().toLowerCase();
      if (!current) return;
      const match = COMMANDS.find((cmd) => cmd.startsWith(current));
      if (match) setValue(match + " ");
    }
  };

  return (
    <div className="os-terminal" onClick={() => inputRef.current?.focus()}>
      <div className="os-terminal-log" ref={logRef}>
        {lines.map((line, index) => (
          <p key={index} className={`os-term-${line.kind}`}>
            {line.kind === "cmd" ? <span aria-hidden>$ </span> : null}
            {line.text}
          </p>
        ))}
      </div>
      <form
        className="os-terminal-input"
        onSubmit={(event) => {
          event.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <span aria-hidden>guest@maydalabs:~$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label="maydalabs shell"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          lang={locale}
        />
      </form>
    </div>
  );
}
