"use client";

import { useSyncExternalStore } from "react";

/* The time, as the bar shows it.
 *
 * A desk without a clock is a web page. This one ticks on the minute rather
 * than every second, because seconds on a menu bar are a distraction dressed
 * as precision, and it renders nothing on the server: the server does not
 * know what time it is where the person is sitting, and a wrong time that
 * corrects itself a moment later is worse than a blank one.
 */

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = () => {
    // Aligned to the next minute boundary, so the display changes when the
    // minute does rather than some seconds later.
    timer = setTimeout(() => {
      onChange();
      tick();
    }, 60_000 - (Date.now() % 60_000) + 20);
  };
  tick();
  return () => {
    if (timer) clearTimeout(timer);
  };
}

const currentMinute = () => Math.floor(Date.now() / 60_000);
const noMinute = () => null;

export function OsClock({ locale, form }: { locale: string; form: "bar" | "date" }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, noMinute);
  if (minute === null) return <span className="os-clock" data-form={form} aria-hidden="true" />;

  const at = new Date(minute * 60_000);
  const text =
    form === "bar"
      ? new Intl.DateTimeFormat(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(at)
      : new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(at);

  return (
    <time className="os-clock" data-form={form} dateTime={at.toISOString()}>
      {text}
    </time>
  );
}
