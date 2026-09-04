"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { localizePath, type Locale } from "@/lib/i18n";
import { OS_APPS, type OsApp } from "@/components/os/OsShell";
import styles from "@/components/MaydaOSLab.module.css";

/* A terminal that actually does things: it moves you between apps and
 * answers questions about your own account. Nothing here can spend a credit
 * or send anything, because the terminal is navigation, not authority. */

type Line = { kind: "command" | "output"; text: string };

const HELP = [
  "desk      open the desk and run something",
  "record    everything that happened here",
  "pilot     your engagement, reports and invoices",
  "account   maps, briefs, preferences, sign out",
  "credits   how many runs you have left",
  "whoami    the account you are signed in as",
  "clear     empty this screen",
];

export function OsTerminal({
  locale,
  email,
  credits,
  runs,
}: {
  locale: Locale;
  email: string;
  credits: { left: number; granted: number };
  runs: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<Line[]>([
    { kind: "output", text: `MaydaOS 03.0 — signed in as ${email}. Type help.` },
  ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function run(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) return;
    const lines: Line[] = [{ kind: "command", text: value }];

    if (value === "clear") {
      setHistory([]);
      setCommand("");
      return;
    }
    if (value === "help") {
      lines.push(...HELP.map((text) => ({ kind: "output" as const, text })));
    } else if (value === "credits") {
      lines.push({ kind: "output", text: `${credits.left} of ${credits.granted} credits left · ${runs} runs recorded` });
    } else if (value === "whoami") {
      lines.push({ kind: "output", text: email });
    } else if ((OS_APPS as readonly string[]).includes(value)) {
      lines.push({ kind: "output", text: `opening ${value}...` });
      router.push(localizePath(`/os/${value as OsApp}`, locale));
    } else {
      lines.push({ kind: "output", text: `${value}: unknown command. Type help.` });
    }

    setHistory((previous) => [...previous, ...lines]);
    setCommand("");
  }

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalOutput} aria-live="polite">
        {history.map((line, index) => (
          <p key={index} className={line.kind === "command" ? styles.prompt : styles.result}>
            {line.kind === "command" ? `> ${line.text}` : line.text}
          </p>
        ))}
      </div>
      <form
        className={styles.terminalForm}
        onSubmit={(event) => {
          event.preventDefault();
          run(command);
        }}
      >
        <label htmlFor="os-terminal-input" className="sr-only">Command</label>
        <input
          id="os-terminal-input"
          ref={inputRef}
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="help"
        />
      </form>
    </div>
  );
}
