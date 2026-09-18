"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  OS_OPEN_APP_EVENT,
  OS_OPEN_ITEM_EVENT,
  documentKey,
  type OsApp,
  type OsAppId,
  type OsDocument,
  type OsShellCopy,
  type OsWindowKey,
  type OsWindowState,
} from "@/components/os/types";
import { hydrateWindows, sanitizePrefs, type OsPrefs } from "@/lib/osDesktop";
import { saveDesktopAction, markSeenAction, savePrefsAction } from "@/app/actions/desktop";
import { OS_PREFS_EVENT } from "@/components/os/SettingsPanel";
import { OsClock } from "@/components/os/OsClock";
import { OsCommandBar, OS_COMMAND_EVENT, type CommandBarCopy, type CommandTarget } from "@/components/os/OsCommandBar";
import { OsBackdrop } from "@/components/os/OsBackdrop";
import { OsIcon } from "@/components/os/OsIcon";
import { OsNotices } from "@/components/os/OsNotices";
import { ActionForm } from "@/components/os/ActionForm";

/* The desktop.
 *
 * A window manager rather than a layout: the arrangement is a person's, not
 * the designer's, and it is theirs across machines because it lives in the
 * database. No dependency, because what this has to do is small and specific
 * and every library that does it also does forty other things.
 */

const PHONE_WIDTH = 768;
const TITLE_HEIGHT = 34;
const MIN_W = 288;
const MIN_H = 160;

/* A window dragged against an edge takes that half; against the top it takes
 * the whole surface. It is the one window gesture people already know from
 * every desktop they have used, and without it a small screen means arranging
 * panes by hand every session. */
const SNAP_EDGE = 26;

/* How long a window takes to leave. The CSS animation is this long too; the
 * state change waits for it rather than listening for animationend, which
 * never fires when a person has asked for reduced motion. */
const LEAVE_MS = 200;

/* Where a window can be sent with a chord or a command. */
type Placement = "left" | "right" | "full";

/* The chords are Rectangle's — ⌃⌥ and an arrow — because that is the
 * convention on the Mac this imitates, and because plain ⌥ combinations are
 * how a Turkish keyboard types @ and {. */
export type WindowCommand = Placement | "away" | "close" | "next";

type Gesture =
  | { kind: "move"; app: OsWindowKey; pointerId: number; dx: number; dy: number }
  | { kind: "resize"; app: OsWindowKey; pointerId: number; fromW: number; fromH: number; fromX: number; fromY: number };

/* What any window shows: an app from the dock or a document from the work.
 * The shell only ever looks things up here; it does not know which is which
 * beyond how they arrive in the dock. */
type Surface = { key: OsWindowKey; title: string; icon: OsApp["icon"]; node: React.ReactNode; isDocument: boolean };

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

/* On a phone the brief is a pane of its own rather than the surface under
 * the windows, because there is no "under" on a phone. */
const BRIEF_PANE = "brief";
type Pane = OsWindowKey | typeof BRIEF_PANE;

export function OsShell({
  apps,
  documents,
  brief,
  locale,
  prefs: storedPrefs,
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
  documents: OsDocument[];
  /* The desk's own surface, under the windows. See components/os/Brief.tsx. */
  brief: React.ReactNode;
  locale: string;
  /* How the person likes the desk; see lib/osDesktop.ts. */
  prefs: OsPrefs;
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
  const [windows, setWindows] = useState<OsWindowState[]>(() => hydrateWindows(apps, documents, storedLayout));
  const [gesture, setGesture] = useState<Gesture | null>(null);
  /* Windows on their way out, still drawn while they go. */
  const [leaving, setLeaving] = useState<Map<OsWindowKey, "close" | "away">>(() => new Map());
  const [prefs, setPrefs] = useState<OsPrefs>(storedPrefs);

  /* Settings announces a choice; the shell wears it at once and remembers
   * it a moment later, the way it remembers where a window came to rest. */
  useEffect(() => {
    let pendingSave: ReturnType<typeof setTimeout> | null = null;
    const onPrefs = (event: Event) => {
      const next = sanitizePrefs((event as CustomEvent<unknown>).detail);
      setPrefs(next);
      if (pendingSave) clearTimeout(pendingSave);
      pendingSave = setTimeout(() => void savePrefsAction(next), 400);
    };
    window.addEventListener(OS_PREFS_EVENT, onPrefs);
    return () => {
      window.removeEventListener(OS_PREFS_EVENT, onPrefs);
      if (pendingSave) clearTimeout(pendingSave);
    };
  }, []);
  const [narrow, setNarrow] = useState(false);
  const [phoneApp, setPhoneApp] = useState<Pane>(BRIEF_PANE);

  /* One lookup for both kinds of window. */
  const surfaces = useMemo<Map<OsWindowKey, Surface>>(() => {
    const map = new Map<OsWindowKey, Surface>();
    for (const app of apps) map.set(app.id, { key: app.id, title: app.title, icon: app.icon, node: app.node, isDocument: false });
    for (const doc of documents) map.set(doc.key, { key: doc.key, title: doc.title, icon: doc.icon, node: doc.node, isDocument: true });
    return map;
  }, [apps, documents]);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

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
    (app: OsWindowKey) => {
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

  /* A window leaves the way it arrived: drawn for a moment on its way out,
   * then gone. The state changes when the moment is over. */
  const leave = useCallback(
    (app: OsWindowKey, how: "close" | "away") => {
      setLeaving((was) => {
        if (was.has(app)) return was;
        const next = new Map(was);
        next.set(app, how);
        return next;
      });
      setTimeout(() => {
        update((prev) =>
          prev.map((w) => (w.app === app ? (how === "close" ? { ...w, open: false } : { ...w, minimized: true }) : w)),
        );
        setLeaving((was) => {
          const next = new Map(was);
          next.delete(app);
          return next;
        });
      }, LEAVE_MS);
    },
    [update],
  );

  const toggle = useCallback(
    (app: OsWindowKey) => {
      if (narrow) {
        setPhoneApp(app);
        return;
      }
      const current = windows.find((w) => w.app === app);
      if (!current) return;
      const highest = windows.reduce((high, w) => Math.max(high, w.z), 0);
      // Open it, raise it, or put it away: one control, three meanings,
      // decided by what the window is already doing.
      if (!current.open || current.minimized) focus(app);
      else if (current.z === highest) leave(app, "away");
      else focus(app);
    },
    [focus, leave, narrow, windows],
  );

  const close = useCallback((app: OsWindowKey) => leave(app, "close"), [leave]);

  /* The window in front: the one chords and commands act on. */
  const focused = useMemo(() => {
    const open = windows.filter((w) => w.open && !w.minimized && surfaces.has(w.app));
    return open.reduce<OsWindowState | null>((top, w) => (top === null || w.z > top.z ? w : top), null);
  }, [surfaces, windows]);

  /* Half the desk, or all of it. Pixels from here on: a placement is a
   * choice about this screen, which is what `placed` means. */
  const place = useCallback(
    (app: OsWindowKey, where: Placement) => {
      const bounds = surfaceRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const rect =
        where === "full"
          ? { x: 0, y: 0, w: bounds.width, h: bounds.height }
          : where === "left"
            ? { x: 0, y: 0, w: bounds.width / 2, h: bounds.height }
            : { x: bounds.width / 2, y: 0, w: bounds.width / 2, h: bounds.height };
      update((prev) => prev.map((w) => (w.app === app ? { ...w, ...rect, placed: true } : w)));
    },
    [update],
  );

  const command = useCallback(
    (what: WindowCommand) => {
      if (narrow) return;
      if (what === "next") {
        // Front to back, then round again: the window under the front one.
        const open = windows
          .filter((w) => w.open && !w.minimized && surfaces.has(w.app))
          .sort((a, b) => b.z - a.z);
        if (open.length > 1) focus(open[open.length - 1].app);
        return;
      }
      if (!focused) return;
      if (what === "away") leave(focused.app, "away");
      else if (what === "close") leave(focused.app, "close");
      else place(focused.app, what);
    },
    [focus, focused, leave, narrow, place, surfaces, windows],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.altKey || event.metaKey) return;
      const chords: Record<string, WindowCommand> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "full",
        Enter: "full",
        ArrowDown: "away",
        Backspace: "close",
        Tab: "next",
      };
      const what = chords[event.key];
      if (what) {
        event.preventDefault();
        command(what);
        return;
      }
      // ⌃⌥1 … ⌃⌥7: the dock, by position. The physical key first, because
      // on some layouts ⌥ turns the digit row into symbols; the key itself
      // second, for the keyboards that report no code at all.
      const digit = /^Digit([1-9])$/.exec(event.code) ?? /^([1-9])$/.exec(event.key);
      if (digit) {
        const app = apps[Number(digit[1]) - 1];
        if (app) {
          event.preventDefault();
          toggle(app.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apps, command, toggle]);

  /* Opening a document. It may already have a window (remembered, or opened
   * earlier in this visit), in which case it is simply raised. Otherwise it
   * gets a window cascaded from the last one, as a share of the surface so
   * it fits whatever screen this is. */
  const openDocument = useCallback(
    (key: OsWindowKey) => {
      if (!surfaces.get(key)?.isDocument) return;
      if (narrow) {
        setPhoneApp(key);
        return;
      }
      update((prev) => {
        const highest = prev.reduce((high, w) => Math.max(high, w.z), 0);
        const existing = prev.find((w) => w.app === key);
        if (existing) {
          return prev.map((w) => (w.app === key ? { ...w, open: true, minimized: false, z: highest + 1 } : w));
        }
        const openDocs = prev.filter((w) => w.open && surfaces.get(w.app)?.isDocument).length;
        const step = (openDocs % 6) * 0.03;
        return [
          ...prev,
          { app: key, x: 0.12 + step, y: 0.08 + step, w: 0.5, h: 0.74, z: highest + 1, open: true, minimized: false, placed: false },
        ];
      });
    },
    [narrow, surfaces, update],
  );

  useEffect(() => {
    const onOpen = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (typeof id === "string" && id) openDocument(documentKey(id));
    };
    window.addEventListener(OS_OPEN_ITEM_EVENT, onOpen);
    return () => window.removeEventListener(OS_OPEN_ITEM_EVENT, onOpen);
  }, [openDocument]);

  useEffect(() => {
    const onOpenApp = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (typeof id !== "string" || !apps.some((app) => app.id === id)) return;
      if (narrow) setPhoneApp(id as OsAppId);
      else focus(id as OsAppId);
    };
    window.addEventListener(OS_OPEN_APP_EVENT, onOpenApp);
    return () => window.removeEventListener(OS_OPEN_APP_EVENT, onOpenApp);
  }, [apps, focus, narrow]);

  // ------------------------------------------------------------- gestures

  /* A window that has never been moved is sized in percentages, so the first
   * drag has to learn where it actually is before it can move it anywhere.
   * The element knows; nothing else does. */
  const rectOf = useCallback((event: React.PointerEvent) => {
    const el = (event.currentTarget as HTMLElement).closest(".os-window");
    const bounds = surfaceRef.current?.getBoundingClientRect();
    if (!el || !bounds) return null;
    const box = el.getBoundingClientRect();
    return { x: box.left - bounds.left, y: box.top - bounds.top, w: box.width, h: box.height };
  }, []);

  const startMove = useCallback(
    (event: React.PointerEvent, state: OsWindowState) => {
      if (event.button !== 0) return;
      const box = rectOf(event) ?? { x: state.x, y: state.y, w: state.w, h: state.h };
      event.currentTarget.setPointerCapture(event.pointerId);
      focus(state.app);
      update(
        (prev) => prev.map((w) => (w.app === state.app ? { ...w, ...box, placed: true } : w)),
        false,
      );
      setGesture({
        kind: "move",
        app: state.app,
        pointerId: event.pointerId,
        dx: event.clientX - box.x,
        dy: event.clientY - box.y,
      });
    },
    [focus, rectOf, update],
  );

  const startResize = useCallback(
    (event: React.PointerEvent, state: OsWindowState) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      const box = rectOf(event) ?? { x: state.x, y: state.y, w: state.w, h: state.h };
      event.currentTarget.setPointerCapture(event.pointerId);
      focus(state.app);
      update(
        (prev) => prev.map((w) => (w.app === state.app ? { ...w, ...box, placed: true } : w)),
        false,
      );
      setGesture({
        kind: "resize",
        app: state.app,
        pointerId: event.pointerId,
        fromW: box.w,
        fromH: box.h,
        fromX: event.clientX,
        fromY: event.clientY,
      });
    },
    [focus, rectOf, update],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const bounds = surfaceRef.current?.getBoundingClientRect();
      if (!bounds) return;
      pointer.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };

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
    const bounds = surfaceRef.current?.getBoundingClientRect();
    const at = pointer.current;
    const moved = gesture.kind === "move";
    setGesture(null);

    update((prev) =>
      prev.map((w) => {
        if (!moved || w.app !== gesture.app || !bounds) return w;
        if (at.y <= SNAP_EDGE) return { ...w, x: 0, y: 0, w: bounds.width, h: bounds.height };
        if (at.x <= SNAP_EDGE) return { ...w, x: 0, y: 0, w: bounds.width / 2, h: bounds.height };
        if (at.x >= bounds.width - SNAP_EDGE) {
          return { ...w, x: bounds.width / 2, y: 0, w: bounds.width / 2, h: bounds.height };
        }
        return w;
      }),
    );
  }, [gesture, update]);

  // ---------------------------------------------------------------- render

  const nodeFor = useCallback((id: OsWindowKey) => surfaces.get(id)?.node ?? null, [surfaces]);
  const appFor = useCallback((id: OsWindowKey) => surfaces.get(id), [surfaces]);
  const visible = windows.filter((w) => w.open && !w.minimized && surfaces.has(w.app));
  /* Documents join the dock only while they are open, so a put-away document
   * stays reachable and a closed one leaves no trace. */
  const openDocuments = windows.filter((w) => w.open && surfaces.get(w.app)?.isDocument);

  return (
    <div
      className="os-root"
      data-gesturing={gesture ? "true" : "false"}
      data-accent={prefs.accent}
      data-mood={prefs.mood}
    >
      <OsBackdrop activity={Math.min(waitingCount / 5, 1)} mood={prefs.mood} />
      <OsCommandBar
        targets={[
          ...commandTargets,
          /* Window commands, for anyone who does not know the chords, and as
             the place to learn them: the hint is the chord. Only while there
             is a window to act on. */
          ...(focused && !narrow
            ? ([
                { kind: "command", id: "left", label: copy.leftHalf, hint: "⌃⌥←" },
                { kind: "command", id: "right", label: copy.rightHalf, hint: "⌃⌥→" },
                { kind: "command", id: "full", label: copy.fill, hint: "⌃⌥↑" },
                { kind: "command", id: "away", label: `${copy.minimize}: ${surfaces.get(focused.app)?.title ?? ""}`, hint: "⌃⌥↓" },
                { kind: "command", id: "close", label: `${copy.close}: ${surfaces.get(focused.app)?.title ?? ""}`, hint: "⌃⌥⌫" },
              ] satisfies CommandTarget[])
            : []),
        ]}
        copy={commandCopy}
        onOpenApp={(key) => (surfaces.get(key)?.isDocument ? openDocument(key) : focus(key))}
        onCommand={(id) => command(id as WindowCommand)}
      />
      <OsNotices />

      <div className="os-bar">
        <span className="os-bar-brand">MaydaOS</span>
        <span className="os-bar-company">{companyName ?? copy.noCompany}</span>
        <button
          type="button"
          className="os-bar-search"
          onClick={() => window.dispatchEvent(new Event(OS_COMMAND_EVENT))}
        >
          <OsIcon name="search" size={14} />
          <span className="os-bar-long">{commandCopy.placeholder}</span>
          <kbd>⌘K</kbd>
        </button>
        <span className="os-bar-right">
          <OsClock locale={locale} form="bar" />
          {/* What happened while you were away, and the means to stop being
              told about it. The count is of the record, not of the queue:
              those are different questions and conflating them is how a badge
              stops meaning anything. */}
          {unreadCount > 0 ? (
            <ActionForm action={markSeenAction} done={copy.seen} className="os-bar-new">
              <span className="os-bar-count">
                <OsIcon name="new" size={9} /> {unreadCount} {copy.newSince}
              </span>
              <button type="submit" className="os-bar-exit">{copy.markSeen}</button>
            </ActionForm>
          ) : null}
          <span className="os-bar-count" data-waiting={waitingCount}>
            <span className="os-bar-long">{copy.waitingLabel}</span>
            <span className="os-bar-short">{copy.waitingShort}</span>
          </span>
          {email ? <span className="os-bar-email">{email}</span> : null}
          {/* A desktop you cannot leave is a kiosk. */}
          <a className="os-bar-exit" href={accountHref}>
            <OsIcon name="leave" size={15} />
            {copy.leave}
          </a>
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
          <div className="os-stack" data-pane={phoneApp === BRIEF_PANE ? "brief" : "app"}>
            {/* A document carries its own heading, and so does the brief. On
                the desk the window's title bar is chrome and the heading is
                content, which is how every document window works; in a
                single-pane stack the two sit one above the other and read as
                a stammer. */}
            {phoneApp === BRIEF_PANE ? (
              brief
            ) : (
              <>
                {appFor(phoneApp)?.isDocument ? null : (
                  <h1 className="os-stack-title">{appFor(phoneApp)?.title ?? copy.desktop}</h1>
                )}
                {nodeFor(phoneApp)}
              </>
            )}
          </div>
        ) : (
          <>
            {/* The ground the windows sit on. It is not a window: no title
                bar, nothing to close, and it never comes to the front — a
                desk is what is left when everything is put away. */}
            <aside className="os-brief" aria-label={copy.today}>
              {brief}
            </aside>

            {visible.map((state) => {
              const app = appFor(state.app);
              if (!app) return null;

              /* Unplaced windows are laid out as a share of the surface, so a
               * fresh desk fits a laptop and an ultrawide without either
               * measuring the viewport in an effect or hardcoding a size. */
              const style = state.placed
                ? {
                    left: `clamp(8px, ${state.x}px, max(8px, 100% - ${state.w}px - 8px))`,
                    top: `clamp(0px, ${state.y}px, max(0px, 100% - ${state.h}px - 8px))`,
                    width: `min(${state.w}px, calc(100% - 1rem))`,
                    height: `min(${state.h}px, calc(100% - 1rem))`,
                    zIndex: state.z,
                  }
                : {
                    left: `${state.x * 100}%`,
                    top: `${state.y * 100}%`,
                    width: `max(${MIN_W}px, min(${state.w * 100}%, calc(100% - 1rem)))`,
                    height: `max(${MIN_H}px, min(${state.h * 100}%, calc(100% - 1rem)))`,
                    zIndex: state.z,
                  };

              return (
                <section
                  key={state.app}
                  className="os-window"
                  data-focused={state.z === topZ}
                  data-leaving={leaving.get(state.app)}
                  style={style}
                  onPointerDown={() => focus(state.app)}
                  aria-label={app.title}
                >
                  <header className="os-window-title" onPointerDown={(e) => startMove(e, state)}>
                    <span className="os-window-name">
                      <OsIcon name={app.icon} size={14} /> {app.title}
                    </span>
                    <button
                      type="button"
                      className="os-window-dot"
                      data-kind="close"
                      aria-label={`${copy.close}: ${app.title}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => close(state.app)}
                    >
                      <OsIcon name="close" size={12} />
                    </button>
                    <button
                      type="button"
                      className="os-window-dot"
                      data-kind="minimize"
                      aria-label={`${copy.minimize}: ${app.title}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => toggle(state.app)}
                    >
                      <OsIcon name="minimize" size={12} />
                    </button>
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
        {/* The tray is what makes this a dock rather than six buttons that
            happen to sit near each other. */}
        <div className="os-dock-tray">
        {narrow ? (
          <button
            type="button"
            className="os-dock-item"
            data-open={phoneApp === BRIEF_PANE}
            aria-pressed={phoneApp === BRIEF_PANE}
            onClick={() => setPhoneApp(BRIEF_PANE)}
          >
            <OsIcon name="today" size={15} />
            {copy.today}
          </button>
        ) : null}
        {apps.map((app) => {
          const state = windows.find((w) => w.app === app.id);
          const open = narrow ? phoneApp === app.id : Boolean(state?.open && !state.minimized);
          return (
            <button
              key={app.id}
              type="button"
              className="os-dock-item"
              data-open={open}
              data-dormant={app.dormant ? "true" : undefined}
              aria-pressed={open}
              onClick={() => toggle(app.id)}
            >
              <OsIcon name={app.icon} size={15} />
              {app.title}
            </button>
          );
        })}
        {openDocuments.length > 0 ? <span className="os-dock-rule" aria-hidden="true" /> : null}
        {openDocuments.map((state) => {
          const doc = surfaces.get(state.app);
          if (!doc) return null;
          const open = narrow ? phoneApp === state.app : !state.minimized;
          return (
            <button
              key={state.app}
              type="button"
              className="os-dock-item"
              data-open={open}
              data-document="true"
              aria-pressed={open}
              onClick={() => toggle(state.app)}
            >
              <OsIcon name={doc.icon} size={15} />
              <span className="os-dock-doc-title">{doc.title}</span>
            </button>
          );
        })}
        </div>
      </nav>
    </div>
  );
}
