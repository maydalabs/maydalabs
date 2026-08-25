"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Locale, localizePath } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { isSoundEnabled, setSoundEnabled } from "@/lib/soundSignal";
import { OS_COPY } from "@/components/os/osCopy";
import { trackOsEvent } from "@/lib/osAnalytics";

export function OsPalette({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale].palette;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
        setIndex(0);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => {
      setOpen(true);
      setQuery("");
      setIndex(0);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("os:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("os:palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const matches = copy.items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const active = Math.min(index, Math.max(0, matches.length - 1));

  const runItem = useCallback(
    (item: (typeof copy.items)[number]) => {
      setOpen(false);
      trackOsEvent("os_palette_run", { kind: item.kind });
      if (item.kind === "page") router.push(localizePath(item.target, locale));
      else if (item.kind === "call") window.open(getIntroCallUrl("os_palette"), "_blank", "noopener,noreferrer");
      else if (item.kind === "sound") setSoundEnabled(!isSoundEnabled());
    },
    [locale, router, copy],
  );

  if (!open) return null;

  return (
    <div className="os-palette" role="dialog" aria-label="Command palette" onClick={() => setOpen(false)}>
      <div className="os-palette-panel" onClick={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          placeholder={copy.placeholder}
          aria-label={copy.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIndex((value) => Math.min(value + 1, matches.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setIndex((value) => Math.max(value - 1, 0));
            } else if (event.key === "Enter" && matches[active]) {
              event.preventDefault();
              runItem(matches[active]);
            }
          }}
        />
        <ul>
          {matches.length === 0 ? (
            <li className="os-palette-empty">{copy.empty}</li>
          ) : (
            matches.map((item, itemIndex) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={itemIndex === active ? "is-active" : ""}
                  onMouseEnter={() => setIndex(itemIndex)}
                  onClick={() => runItem(item)}
                >
                  <span>{item.kind === "page" ? "→" : item.kind === "call" ? "↗" : "◦"}</span>
                  {item.label}
                </button>
              </li>
            ))
          )}
        </ul>
        <p>{copy.hint}</p>
      </div>
    </div>
  );
}
