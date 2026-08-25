"use client";

import { useCallback, useEffect, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { OS_COPY } from "@/components/os/osCopy";
import { trackOsEvent } from "@/lib/osAnalytics";

export type SessionPerspective = "hiring" | "build" | "explore";

const FIRST_SESSION_KEY = "ml_first_session_v1";

export function OsFirstSession({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale].firstSession;
  const [open, setOpen] = useState(false);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(FIRST_SESSION_KEY, "1");
    } catch {
      // The guide can still work without persistence.
    }
  }, []);

  const startSession = useCallback(
    (perspective: SessionPerspective) => {
      markSeen();
      setOpen(false);
      trackOsEvent("os_session_start", { perspective });
      window.dispatchEvent(new CustomEvent("os:session-start", { detail: { perspective } }));
    },
    [markSeen],
  );

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(FIRST_SESSION_KEY) === "1";
    } catch {
      seen = true;
    }
    if (seen) return;
    const timer = setTimeout(() => setOpen(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <aside className="os-first-session" aria-labelledby="os-first-session-title">
      <button
        type="button"
        className="os-first-session-close"
        aria-label={copy.dismiss}
        onClick={() => {
          markSeen();
          setOpen(false);
        }}
      >
        ✕
      </button>
      <p>{copy.eyebrow}</p>
      <h2 id="os-first-session-title">{copy.title}</h2>
      <span>{copy.body}</span>
      <div>
        {copy.options.map((option) => (
          <button key={option.id} type="button" onClick={() => startSession(option.id as SessionPerspective)}>
            <strong>{option.label}</strong>
            <small>{option.detail}</small>
            <i aria-hidden>→</i>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="os-first-session-tour"
        onClick={() => {
          markSeen();
          setOpen(false);
          window.dispatchEvent(new CustomEvent("os:tour"));
        }}
      >
        <span aria-hidden>▶</span> {copy.tour}
      </button>
    </aside>
  );
}
