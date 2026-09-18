"use client";

import { useEffect, useState } from "react";
import { OS_NOTICE_EVENT, type OsNotice } from "@/components/os/notice";

/* Where notices appear: low, centred, above the dock, for a few seconds.
 *
 * One line of quiet type, not a card with an icon and a close button. A
 * notice confirms; it does not ask for anything, so it must not need
 * anything from you either — including your attention for longer than it
 * takes to read.
 */

const SHOWN_FOR = 3200;

type Shown = OsNotice & { id: number };

export function OsNotices() {
  const [notices, setNotices] = useState<Shown[]>([]);

  useEffect(() => {
    let next = 1;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<OsNotice>).detail;
      if (!detail?.text) return;
      const id = next++;
      setNotices((shown) => [...shown.slice(-2), { ...detail, id }]);
      const timer = setTimeout(() => {
        timers.delete(timer);
        setNotices((shown) => shown.filter((n) => n.id !== id));
      }, SHOWN_FOR);
      timers.add(timer);
    };
    window.addEventListener(OS_NOTICE_EVENT, onNotice);
    return () => {
      window.removeEventListener(OS_NOTICE_EVENT, onNotice);
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="os-notices" aria-live="polite">
      {notices.map((notice) => (
        <p key={notice.id} className="os-notice" data-tone={notice.tone ?? "quiet"}>
          {notice.text}
        </p>
      ))}
    </div>
  );
}
