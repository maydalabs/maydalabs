"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OsApp, OsAppId, OsShellCopy, OsWindowState } from "@/components/os/types";
import { saveDesktopAction, markSeenAction } from "@/app/actions/desktop";
import { OsCommandBar, OS_COMMAND_EVENT, type CommandBarCopy, type CommandTarget } from "@/components/os/OsCommandBar";

/* The desktop.
 *
 * A window manager rather than a layout: the arrangement is a person's, not
 * the designer's, and it is theirs across machines because it lives in the
 * database. Roughly four hundred lines and no dependency, because what this
 * has to do is small and specific and every library that does it also does
 * forty other things.
 */

const PHONE_WIDTH = 768;
const TITLE_HEIGHT = 34;
const MIN_W = 288;
const MIN_H = 160;

type Gesture =
  | { kind: "move"; app: OsAppId; pointerId: number; dx: number; dy: number }
  | { kind: "resize"; app: OsAppId; pointerId: number; fromW: number; fromH: number; fromX: number; fromY: number };

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

/* A stored layout is whatever was in the database, which is to say it may be
 * from an older version of the product. Anything unrecognised is dropped and
 * anything missing gets the app's default — a desk that half-restores is
 * better than a desk that throws. */
function hydrate(apps: OsApp[], stored: unknown): OsWindowState[] {
  const rows = Array.isArray(stored) ? stored : [];
  const byApp = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (row && typeof row === "object" && typeof (row as { app?: unknown }).app === "string") {
      byApp.set((row as { app: string }).app, row as Record<string, unknown>);
    }
  }

  return apps.map((app, index) => {
    const saved = byApp.get(app.id);
    const num = (key: string, fallback: number) =>
      typeof saved?.[key] === "number" && Number.isFinite(saved[key]) ? (saved[key] as number) : fallback;
    const bool = (key: string, fallback: boolean) =>
      typeof saved?.[key] === "boolean" ? (saved[key] as boolean) : fallback;

    return {
      app: app.id,
      x: num("x", app.defaultRect.x),
      y: num("y", app.defaultRect.y),
      w: Math.max(MIN_W, num("w", app.defaultRect.w)),
      h: Math.max(MIN_H, num("h", app.defaultRect.h)),
      z: num("z", index + 1),
      open: bool("open", Boolean(app.openByDefault)),
      minimized: bool("minimized", false),
    };
  });
}

export function OsShell({
  apps,
  copy,
  storedLayout,
  companyName,
  waitingCount,
  email,
  accountHref,
  commandTargets,
  commandCopy,
  unreadCount,
}: {
  apps: OsApp[];
  copy: OsShellCopy;
  storedLayout: unknown;
  companyName: string | null;
  waitingCount: number;
  email: string | null;
  accountHref: string;
  commandTargets: CommandTarget[];
  commandCopy: CommandBarCopy;
  unreadCount: number;
}) {
  const [windows, setWindows] = useState<OsWindowState[]>(() => hydrate(apps, storedLayout));
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [phoneApp, setPhoneApp] = useState<OsAppId>(apps[0]?.id ?? "needs-you");
  const surfaceRef = useRef<HTMLDivElement>(null);

  /* Measured, not guessed from a user agent: the same person is on a wide
   * screen and a narrow one during a single day. */
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${PHONE_WIDTH - 1}px)`);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Saved on a trailing delay. Dragging a window emits a state change per
   * frame and none of them are worth a round trip; where it comes to rest
   * is. */
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persist = useCallback((next: OsWindowState[]) => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      void saveDesktopAction(next);
    }, 700);
  }, []);

  useEffect(() => () => { if (pending.current) clearTimeout(pending.current); }, []);

  const update = useCallback(
    (next: OsWindowState[] | ((prev: OsWindowState[]) => OsWindowState[]), save = true) => {
      setWindows((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (save) persist(value);
        return value;
      });
    },
    [persist],
  );

  const topZ = useMemo(() => windows.reduce((high, w) => Math.max(high, w.z), 0), [windows]);

  const focus = useCallback(
    (app: OsAppId) => {
      update((prev) => {
        const highest = prev.reduce((high, w) => Math.max(high, w.z), 0);
        const current = prev.find((w) => w.app === app);
        if (current && current.z === highest && current.open && !current.minimized) return prev;
        return prev.map((w) =>
          w.app === app ? { ...w, z: highest + 1, open: true, minimized: false } : w,
        );
      });
    },
    [update],
  );

  const toggle = useCallback(
    (app: OsAppId) => {
      if (narrow) {
        setPhoneApp(app);
        return;
      }
      update((prev) => {
        const current = prev.find((w) => w.app === app);
        if (!current) return prev;
        const highest = prev.reduce((high, w) => Math.max(high, w.z), 0);
        // Open it, raise it, or put it away: one control, three meanings,
        // decided by what the window is already doing.
        const next =
          !current.open || current.minimized
            ? { ...current, open: true, minimized: false, z: highest + 1 }
            : current.z === highest
              ? { ...current, minimized: true }
              : { ...current, z: highest + 1 };
        return prev.map((w) => (w.app === app ? next : w));
      });
    },
    [narrow, update],
  );

  const close = useCallback(
    (app: OsAppId) => update((prev) => prev.map((w) => (w.app === app ? { ...w, open: false } : w))),
    [update],
  );

  // ------------------------------------------------------------- gestures

  const startMove = useCallback(
    (event: React.PointerEvent, state: OsWindowState) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      focus(state.app);
      setGesture({
        kind: "move",
        app: state.app,
        pointerId: event.pointerId,
        dx: event.clientX - state.x,
        dy: event.clientY - state.y,
      });
    },
    [focus],
  );

  const startResize = useCallback(
    (event: React.PointerEvent, state: OsWindowState) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      focus(state.app);
      setGesture({
        kind: "resize",
        app: state.app,
        pointerId: event.pointerId,
        fromW: state.w,
        fromH: state.h,
        fromX: event.clientX,
        fromY: event.clientY,
      });
    },
    [focus],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const bounds = surfaceRef.current?.getBoundingClientRect();
      if (!bounds) return;

      update((prev) =>
        prev.map((w) => {
          if (w.app !== gesture.app) return w;
          if (gesture.kind === "move") {
            /* Kept reachable rather than kept inside: a title bar dragged
             * past the edge is how a window becomes unrecoverable. */
            return {
              ...w,
              x: clamp(event.clientX - gesture.dx, -w.w + 80, bounds.width - 80),
              y: clamp(event.clientY - gesture.dy, 0, bounds.height - TITLE_HEIGHT),
            };
          }
          return {
            ...w,
            w: clamp(gesture.fromW + (event.clientX - gesture.fromX), MIN_W, bounds.width),
            h: clamp(gesture.fromH + (event.clientY - gesture.fromY), MIN_H, bounds.height),
          };
        }),
        false,
      );
    },
    [gesture, update],
  );

  const endGesture = useCallback(() => {
    if (!gesture) return;
    setGesture(null);
    // Where it came to rest is the thing worth remembering.
    setWindows((prev) => {
      persist(prev);
      return prev;
    });
  }, [gesture, persist]);

  // ---------------------------------------------------------------- render

  const nodeFor = useCallback((id: OsAppId) => apps.find((a) => a.id === id)?.node ?? null, [apps]);
  const appFor = useCallback((id: OsAppId) => apps.find((a) => a.id === id), [apps]);
  const visible = windows.filter((w) => w.open && !w.minimized);

  return (
    <div className="os-root" data-gesturing={gesture ? "true" : "false"}>
      <OsCommandBar targets={commandTargets} copy={commandCopy} onOpenApp={focus} />
      <div className="os-bar">
        <span className="os-bar-brand">
          MaydaOS
        </span>
        <span className="os-bar-company">{companyName ?? copy.noCompany}</span>
        <button
          type="button"
          className="os-bar-search"
          onClick={() => window.dispatchEvent(new Event(OS_COMMAND_EVENT))}
        >
          {commandCopy.placeholder} <kbd>⌘K</kbd>
        </button>
        <span className="os-bar-right">
          {/* What happened while you were away, and the means to stop being
              told about it. The count is of the record, not of the queue:
              those are different questions and conflating them is how a badge
              stops meaning anything. */}
          {unreadCount > 0 ? (
            <form action={markSeenAction} className="os-bar-new">
              <span className="os-bar-count">{unreadCount} {copy.newSince}</span>
              <button type="submit" className="os-bar-exit">{copy.markSeen}</button>
            </form>
          ) : null}
          <span className="os-bar-count" data-waiting={waitingCount}>
            {copy.waitingLabel}
          </span>
          {email ? <span className="os-bar-email">{email}</span> : null}
          {/* A desktop you cannot leave is a kiosk. */}
          <a className="os-bar-exit" href={accountHref}>{copy.leave}</a>
        </span>
      </div>

      <div
        className="os-surface"
        ref={surfaceRef}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        {narrow ? (
          <div className="os-stack">
            <h1 className="os-stack-title">{appFor(phoneApp)?.title ?? copy.desktop}</h1>
            {nodeFor(phoneApp)}
          </div>
        ) : (
          <>
            {visible.length === 0 ? (
              <div className="os-empty">
                <strong>{copy.empty}</strong>
                <span>{copy.emptyHint}</span>
              </div>
            ) : null}

            {visible.map((state) => {
              const app = appFor(state.app);
              if (!app) return null;
              return (
                <section
                  key={state.app}
                  className="os-window"
                  data-focused={state.z === topZ}
                  /* Clamped in CSS rather than by measuring and correcting.
                     A default layout is written for a screen nobody has, and
                     correcting it in an effect both fights the React
                     compiler and only runs once — this keeps a window
                     reachable while the browser window itself is resized. */
                  style={{
                    left: `clamp(8px, ${state.x}px, max(8px, 100% - ${state.w}px - 8px))`,
                    top: `clamp(0px, ${state.y}px, max(0px, 100% - ${state.h}px - 8px))`,
                    width: `min(${state.w}px, calc(100% - 1rem))`,
                    height: `min(${state.h}px, calc(100% - 1rem))`,
                    zIndex: state.z,
                  }}
                  onPointerDown={() => focus(state.app)}
                  aria-label={app.title}
                >
                  <header className="os-window-title" onPointerDown={(e) => startMove(e, state)}>
                    <button
                      type="button"
                      className="os-window-dot"
                      data-kind="close"
                      aria-label={`${copy.close}: ${app.title}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => close(state.app)}
                    />
                    <button
                      type="button"
                      className="os-window-dot"
                      data-kind="minimize"
                      aria-label={`${copy.minimize}: ${app.title}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => toggle(state.app)}
                    />
                    <span className="os-window-name">
                      <span aria-hidden="true">{app.glyph}</span> {app.title}
                    </span>
                  </header>

                  <div className="os-window-body">{app.node}</div>

                  <div
                    className="os-resize"
                    role="separator"
                    aria-label={`${copy.resize}: ${app.title}`}
                    onPointerDown={(e) => startResize(e, state)}
                  />
                </section>
              );
            })}
          </>
        )}
      </div>

      <nav className="os-dock" aria-label={copy.desktop}>
        {apps.map((app) => {
          const state = windows.find((w) => w.app === app.id);
          const open = narrow ? phoneApp === app.id : Boolean(state?.open && !state.minimized);
          return (
            <button
              key={app.id}
              type="button"
              className="os-dock-item"
              data-open={open}
              aria-pressed={open}
              onClick={() => toggle(app.id)}
            >
              <span className="os-dock-glyph" aria-hidden="true">{app.glyph}</span>
              {app.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
