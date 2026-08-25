"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MaydaMark } from "@/components/MaydaMark";
import { SignalDecode } from "@/components/SignalDecode";
import { LOCALES, LOCALE_LABELS, type Locale, localizePath } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { isSoundEnabled, loadSoundPreference, onSoundChange, setSoundEnabled } from "@/lib/soundSignal";
import { OS_COPY } from "@/components/os/osCopy";

type WindowId = "welcome" | "work" | "hodlstay" | "monitor" | "terminal";

type WindowState = { open: boolean; x: number; y: number; z: number; w: number };

type Telemetry = {
  checks: Array<{ id: string; host: string; ok: boolean; status: number; ms: number | null }>;
  blockHeight: number | null;
};

const INITIAL_WINDOWS: Record<WindowId, WindowState> = {
  welcome: { open: true, x: 64, y: 46, z: 4, w: 500 },
  hodlstay: { open: true, x: 612, y: 26, z: 2, w: 540 },
  monitor: { open: true, x: 1082, y: 58, z: 3, w: 330 },
  terminal: { open: true, x: 648, y: 428, z: 5, w: 560 },
  work: { open: false, x: 190, y: 160, z: 1, w: 470 },
};

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
    default:
      return null;
  }
}

export function MaydaOS({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale];
  const router = useRouter();
  const desktopRef = useRef<HTMLDivElement>(null);
  const zRef = useRef(6);
  const [windows, setWindows] = useState(INITIAL_WINDOWS);
  const [booting, setBooting] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [telemetryFailed, setTelemetryFailed] = useState(false);
  const [clock, setClock] = useState("");
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSound(loadSoundPreference()));
    const unsubscribe = onSoundChange(setSound);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!reduced && !window.sessionStorage.getItem("ml_booted")) {
        setBooting(true);
        window.sessionStorage.setItem("ml_booted", "1");
        timer = setTimeout(() => setBooting(false), 1750);
      }
    } catch {
      // Storage unavailable: boot once per load.
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/telemetry")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: Telemetry) => {
        if (!cancelled) setTelemetry(payload);
      })
      .catch(() => {
        if (!cancelled) setTelemetryFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Istanbul" }).format(new Date()),
      );
    };
    const frame = requestAnimationFrame(tick);
    const interval = setInterval(tick, 30_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [locale]);

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
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: true, z } }));
  }, []);

  const closeWindow = useCallback((id: WindowId) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: false } }));
  }, []);

  const moveWindow = useCallback((id: WindowId, x: number, y: number) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], x, y } }));
  }, []);

  const projectUrl = getIntroCallUrl("os_desktop");
  const checks = telemetry?.checks ?? [
    { id: "hodlstay", host: "hodlstay.com", ok: false, status: 0, ms: null },
    { id: "satoshi-gazette", host: "satoshigazette.org", ok: false, status: 0, ms: null },
  ];

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
        <header className="os-menubar">
          <div className="os-menubar-left">
            <Link href={localizePath("/", locale)} className="os-menubar-brand group" aria-label="MaydaOS">
              <MaydaMark className="h-4 w-4 text-white" />
              <strong>MaydaOS</strong>
            </Link>
            <nav className="os-menubar-nav" aria-label="MaydaOS">
              {copy.menu.map(([label, path]) => (
                <Link key={path} href={localizePath(path, locale)}>{label}</Link>
              ))}
            </nav>
          </div>
          <div className="os-menubar-right">
            <button
              type="button"
              className={`studio-sound-toggle ${sound ? "is-on" : ""}`}
              aria-pressed={sound}
              aria-label="SND"
              onClick={() => setSoundEnabled(!isSoundEnabled())}
            >
              SND<span aria-hidden />
            </button>
            <span className="os-menubar-langs">
              {LOCALES.map((nextLocale) => (
                <Link
                  key={nextLocale}
                  href={nextLocale === "en" ? "/en" : `/${nextLocale}`}
                  hrefLang={nextLocale}
                  lang={nextLocale}
                  aria-label={LOCALE_LABELS[nextLocale]}
                  aria-current={locale === nextLocale ? "true" : undefined}
                  className={locale === nextLocale ? "is-active" : ""}
                >
                  {nextLocale.toUpperCase()}
                </Link>
              ))}
            </span>
            <span className="os-menubar-block">₿ {telemetry?.blockHeight ? telemetry.blockHeight.toLocaleString(locale) : "———"}</span>
            <span>{clock || "--:--"} IST</span>
          </div>
        </header>

        <div className="os-desktop" ref={desktopRef}>
          <OsWindow id="welcome" title={copy.welcome.title} state={windows.welcome} onFocus={focusWindow} onClose={closeWindow} onMove={moveWindow} desktopRef={desktopRef}>
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

          <OsWindow id="hodlstay" title={copy.hodlstayWindow.title} state={windows.hodlstay} onFocus={focusWindow} onClose={closeWindow} onMove={moveWindow} desktopRef={desktopRef} accent>
            <div className="os-preview">
              <Image src="/work/hodlstay-2026-08-home.png" alt="HodlStay marketplace homepage" width={540} height={338} priority />
              <div className="os-preview-caption">
                <span>{copy.hodlstayWindow.caption}</span>
                <Link href={localizePath("/case-studies/hodlstay", locale)}>{copy.hodlstayWindow.cta} →</Link>
              </div>
            </div>
          </OsWindow>

          <OsWindow id="work" title={copy.workWindow.title} state={windows.work} onFocus={focusWindow} onClose={closeWindow} onMove={moveWindow} desktopRef={desktopRef}>
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

          <OsWindow id="monitor" title={copy.monitorWindow.title} state={windows.monitor} onFocus={focusWindow} onClose={closeWindow} onMove={moveWindow} desktopRef={desktopRef}>
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

          <OsWindow id="terminal" title={copy.terminalWindow.title} state={windows.terminal} onFocus={focusWindow} onClose={closeWindow} onMove={moveWindow} desktopRef={desktopRef}>
            <OsTerminal locale={locale} hint={copy.terminalWindow.hint} telemetry={telemetry} onOpenWindow={openWindow} onNavigate={(path) => router.push(localizePath(path, locale))} />
          </OsWindow>

          <p className="os-desktop-tag" aria-hidden="true">MAYDAOS 26.08 · ISTANBUL / EVERYWHERE</p>
        </div>

        <nav className="os-dock" aria-label="MaydaOS dock">
          <button type="button" onClick={() => openWindow("welcome")} title={copy.dock.welcome}><Glyph name="doc" /></button>
          <button type="button" onClick={() => openWindow("work")} title={copy.dock.work}><Glyph name="grid" /></button>
          <button type="button" onClick={() => openWindow("terminal")} title={copy.dock.terminal}><Glyph name="shell" /></button>
          <button type="button" onClick={() => openWindow("monitor")} title={copy.dock.monitor}><Glyph name="monitor" /></button>
          <i aria-hidden="true" />
          <Link href={localizePath("/services", locale)} title={copy.dock.services}><Glyph name="layers" /></Link>
          <Link href={localizePath("/about", locale)} title={copy.dock.about}><Glyph name="mark" /></Link>
          <a href={getIntroCallUrl("os_dock")} target="_blank" rel="noopener noreferrer" title={copy.dock.call} className="os-dock-accent"><Glyph name="call" stroke="#f7931a" /></a>
        </nav>
      </div>

      <div className="os-mobile os-mobile-only">
        <div className="os-mobile-status">
          <span>{clock || "--:--"}</span>
          <span>₿ {telemetry?.blockHeight ? telemetry.blockHeight.toLocaleString(locale) : "———"}</span>
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

function OsWindow({
  id,
  title,
  state,
  accent = false,
  onFocus,
  onClose,
  onMove,
  desktopRef,
  children,
}: {
  id: WindowId;
  title: string;
  state: WindowState;
  accent?: boolean;
  onFocus: (id: WindowId) => void;
  onClose: (id: WindowId) => void;
  onMove: (id: WindowId, x: number, y: number) => void;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  if (!state.open) return null;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
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

  return (
    <section
      className={`os-window ${accent ? "os-window-accent" : ""}`}
      style={{ left: state.x, top: state.y, zIndex: state.z, width: state.w }}
      aria-label={title}
      onPointerDown={() => onFocus(id)}
    >
      <div className="os-window-bar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <span className="os-window-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="os-window-title">{title}</span>
        <button type="button" className="os-window-close" onClick={() => onClose(id)} aria-label={`✕ ${title}`}>✕</button>
      </div>
      <div className="os-window-body">{children}</div>
    </section>
  );
}

type TermLine = { kind: "cmd" | "out" | "accent"; text: string };

function OsTerminal({
  locale,
  hint,
  telemetry,
  onOpenWindow,
  onNavigate,
}: {
  locale: Locale;
  hint: string;
  telemetry: Telemetry | null;
  onOpenWindow: (id: WindowId) => void;
  onNavigate: (path: string) => void;
}) {
  const [lines, setLines] = useState<TermLine[]>([{ kind: "out", text: hint }]);
  const [value, setValue] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const input = raw.trim();
    if (!input) return;
    const push = (extra: TermLine[]) => setLines((current) => [...current, { kind: "cmd", text: input }, ...extra]);
    const [command, ...rest] = input.toLowerCase().split(/\s+/);
    const arg = rest.join(" ");

    switch (command) {
      case "help":
        push([
          { kind: "out", text: "work · open <tx-01|tx-02|tx-03|tx-04> · proof · services · about" },
          { kind: "out", text: "book-call · lang <en|tr|fr> · whoami · clear · sudo <anything>" },
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
      case "services":
        push([{ kind: "accent", text: "opening services …" }]);
        onNavigate("/services");
        break;
      case "about":
        push([{ kind: "accent", text: "opening about …" }]);
        onNavigate("/about");
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
