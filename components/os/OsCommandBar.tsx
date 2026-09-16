"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { teachMemoryAction } from "@/app/actions/memory";
import { documentKey, type OsAppId, type OsWindowKey } from "@/components/os/types";

/* One input that can do anything.
 *
 * After windows, this is the most operating-system-shaped thing there is: the
 * difference between a product you navigate and one you address. It opens
 * apps, finds work, finds what the co-founder knows, and carries a sentence
 * straight into the conversation without your having to find the window
 * first.
 */

export type CommandTarget =
  | { kind: "app"; id: OsAppId; label: string; hint: string }
  | { kind: "item"; id: string; label: string; hint: string }
  | { kind: "memory"; id: string; label: string; hint: string };

export type CommandBarCopy = {
  placeholder: string;
  ask: string;
  tell: string;
  open: string;
  nothing: string;
  hint: string;
};

type Runnable =
  | { key: string; label: string; hint: string; run: () => void }
  | null;

export const OS_ASK_EVENT = "maydaos:ask";

/* A chord is not an affordance on a phone. The bar opens on ⌘K and on this,
 * dispatched by anything that wants to — the same window-event route the ask
 * bridge uses, so nothing has to hold a reference to anything else. */
export const OS_COMMAND_EVENT = "maydaos:command";

export function OsCommandBar({
  targets,
  copy,
  onOpenApp,
}: {
  targets: CommandTarget[];
  copy: CommandBarCopy;
  onOpenApp: (id: OsWindowKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Command-K on a Mac, Control-K elsewhere, and both everywhere — checking
   * the platform to decide which chord to honour is a way to be wrong about
   * an external keyboard. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((was) => !was);
        setQuery("");
        setCursor(0);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => {
      setOpen(true);
      setQuery("");
      setCursor(0);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener(OS_COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OS_COMMAND_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const trimmed = query.trim();

  const results = useMemo<Runnable[]>(() => {
    const needle = trimmed.toLowerCase();

    const matched = targets
      .filter((target) => !needle || target.label.toLowerCase().includes(needle))
      .slice(0, 8)
      .map((target): Runnable => ({
        key: `${target.kind}:${target.id}`,
        label: target.label,
        hint: target.hint,
        run: () => {
          // A piece of work opens as its own document; a memory lives in the
          // list it belongs to.
          if (target.kind === "app") onOpenApp(target.id);
          else if (target.kind === "item") onOpenApp(documentKey(target.id));
          else onOpenApp("memory");
        },
      }));

    /* The verbs come last and only once something has been typed: they act on
     * the words themselves, so an empty bar offering "ask" would be offering
     * to ask nothing. */
    const verbs: Runnable[] = trimmed
      ? [
          {
            key: "verb:ask",
            label: `${copy.ask} ${trimmed}`,
            hint: "↵",
            run: () => {
              onOpenApp("cofounder");
              window.dispatchEvent(new CustomEvent(OS_ASK_EVENT, { detail: trimmed }));
            },
          },
          {
            key: "verb:tell",
            label: `${copy.tell} ${trimmed}`,
            hint: "",
            run: () => {
              const form = new FormData();
              form.set("fact", trimmed);
              form.set("kind", "fact");
              void teachMemoryAction(form);
              onOpenApp("memory");
            },
          },
        ]
      : [];

    return [...matched, ...verbs];
  }, [copy.ask, copy.tell, onOpenApp, targets, trimmed]);

  const run = useCallback(
    (index: number) => {
      const chosen = results[index];
      if (!chosen) return;
      setOpen(false);
      setQuery("");
      chosen.run();
    },
    [results],
  );

  if (!open) return null;

  return (
    <div
      className="os-command-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="os-command" role="dialog" aria-modal="true" aria-label={copy.placeholder}>
        <input
          ref={inputRef}
          className="os-command-input"
          value={query}
          placeholder={copy.placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((at) => Math.min(at + 1, Math.max(results.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((at) => Math.max(at - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              run(cursor);
            }
          }}
        />

        {results.length === 0 ? (
          <p className="os-command-empty">{copy.nothing}</p>
        ) : (
          <ul className="os-command-list">
            {results.map((result, index) =>
              result ? (
                <li key={result.key}>
                  <button
                    type="button"
                    className="os-command-item"
                    data-cursor={index === cursor}
                    onPointerEnter={() => setCursor(index)}
                    onClick={() => run(index)}
                  >
                    <span className="os-command-label">{result.label}</span>
                    <span className="os-command-hint">{result.hint}</span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        )}

        <p className="os-command-foot">{copy.hint}</p>
      </div>
    </div>
  );
}
