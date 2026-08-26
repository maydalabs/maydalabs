"use client";

import { useEffect, useRef, useState } from "react";
import { type Locale } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { trackOsEvent } from "@/lib/osAnalytics";
import { isRadioOn, startRadio, stopRadio } from "@/lib/soundSignal";
import {
  TERMINAL_BRIEF_SESSION_KEY,
  type TerminalBriefDraft,
  type TerminalBriefKind,
} from "@/lib/terminalBrief";
import { OS_COPY } from "@/components/os/osCopy";
import { resolveWallpaperId, WALLPAPER_IDS, WALLPAPER_LABELS } from "@/components/os/wallpaperRegistry";
import { type Telemetry } from "@/components/os/useTelemetry";

type TerminalWindowId = "work" | "about" | "trash" | "array";

type TermLine = { kind: "cmd" | "out" | "accent"; text: string };
type GuidedFlow = { kind: TerminalBriefKind; step: number; answers: string[] };

const COMMANDS = ["help", "meet", "problem", "idea", "review", "continue", "copy", "restart", "back", "cancel", "work", "open", "proof", "profile", "contact", "services", "about", "brief", "book-call", "lang", "whoami", "clear", "sudo", "gui", "neofetch", "trash", "screensaver", "date", "echo", "array", "radio", "reset", "matrix", "tour", "wallpaper"];

export function OsTerminal({
  locale,
  telemetry,
  variant = "desktop",
  onOpenWindow,
  onNavigate,
  onReset = () => undefined,
}: {
  locale: Locale;
  telemetry: Telemetry | null;
  variant?: "desktop" | "mobile";
  onOpenWindow: (id: TerminalWindowId) => void;
  onNavigate: (path: string) => void;
  onReset?: () => void;
}) {
  const copy = OS_COPY[locale];
  const [lines, setLines] = useState<TermLine[]>([
    { kind: "accent", text: copy.terminalGuide.welcome },
    ...copy.terminalGuide.routes.map((route) => ({
      kind: "out" as const,
      text: `${route.command.padEnd(9)} ${route.detail}`,
    })),
    { kind: "out", text: copy.terminalGuide.entryNote },
  ]);
  const [value, setValue] = useState("");
  const [guidedFlow, setGuidedFlow] = useState<GuidedFlow | null>(null);
  const [completedDraft, setCompletedDraft] = useState<TerminalBriefDraft | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const lastExciteRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobile = variant === "mobile";

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, guidedFlow, completedDraft]);

  const startGuide = (kind: TerminalBriefKind) => {
    const guide = copy.terminalGuide[kind];
    setCompletedDraft(null);
    setGuidedFlow({ kind, step: 0, answers: [] });
    setLines((current) => [
      ...current,
      { kind: "cmd", text: kind },
      { kind: "accent", text: guide.start },
      { kind: "out", text: `01 / ${String(guide.questions.length).padStart(2, "0")} — ${guide.questions[0]}` },
      { kind: "out", text: copy.terminalGuide.answerHint },
    ]);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const finishGuide = (flow: GuidedFlow, finalAnswer: string) => {
    const guide = copy.terminalGuide[flow.kind];
    const answers = [...flow.answers, finalAnswer];
    const summary = guide.labels.map((label, index) => `${label}\n${answers[index]}`).join("\n\n");
    const draft: TerminalBriefDraft = { kind: flow.kind, locale, summary };
    setGuidedFlow(null);
    setCompletedDraft(draft);
    setLines((current) => [
      ...current,
      { kind: "cmd", text: finalAnswer },
      { kind: "accent", text: copy.terminalGuide.ready },
      ...summary.split("\n").map((text) => ({ kind: "out" as const, text: text || " " })),
      { kind: "out", text: copy.terminalGuide.nextLabel },
      { kind: "out", text: `review    ${copy.terminalGuide.reviewDetail}` },
      { kind: "out", text: `meet      ${copy.terminalGuide.meetDetail}` },
      { kind: "out", text: `copy      ${copy.terminalGuide.copyDetail}` },
      { kind: "out", text: `restart   ${copy.terminalGuide.restartDetail}` },
    ]);
    trackOsEvent("os_terminal_brief_ready", { kind: flow.kind });
  };

  const answerGuide = (input: string) => {
    if (!guidedFlow) return false;
    const command = input.toLowerCase();
    const guide = copy.terminalGuide[guidedFlow.kind];

    if (command === "cancel") {
      setGuidedFlow(null);
      setCompletedDraft(null);
      setLines((current) => [...current, { kind: "cmd", text: "cancel" }, { kind: "out", text: copy.terminalGuide.cancelled }]);
      return true;
    }

    if (command === "back") {
      if (guidedFlow.step === 0) {
        setLines((current) => [...current, { kind: "cmd", text: "back" }, { kind: "out", text: copy.terminalGuide.backAtStart }]);
        return true;
      }
      const nextStep = guidedFlow.step - 1;
      setGuidedFlow({ ...guidedFlow, step: nextStep, answers: guidedFlow.answers.slice(0, -1) });
      setLines((current) => [
        ...current,
        { kind: "cmd", text: "back" },
        { kind: "out", text: `${String(nextStep + 1).padStart(2, "0")} / ${String(guide.questions.length).padStart(2, "0")} — ${guide.questions[nextStep]}` },
      ]);
      return true;
    }

    if (guidedFlow.step === guide.questions.length - 1) {
      finishGuide(guidedFlow, input);
      return true;
    }

    const nextStep = guidedFlow.step + 1;
    setGuidedFlow({ ...guidedFlow, step: nextStep, answers: [...guidedFlow.answers, input] });
    setLines((current) => [
      ...current,
      { kind: "cmd", text: input },
      { kind: "out", text: `${String(nextStep + 1).padStart(2, "0")} / ${String(guide.questions.length).padStart(2, "0")} — ${guide.questions[nextStep]}` },
    ]);
    return true;
  };

  const continueDraft = () => {
    if (!completedDraft) return;
    try {
      window.sessionStorage.setItem(TERMINAL_BRIEF_SESSION_KEY, JSON.stringify(completedDraft));
    } catch {
      setLines((current) => [...current, { kind: "out", text: copy.terminalGuide.handoffUnavailable }]);
      return;
    }
    trackOsEvent("os_terminal_brief_handoff", { kind: completedDraft.kind });
    onNavigate("/contact#brief");
  };

  const copyDraft = async () => {
    if (!completedDraft) return;
    try {
      await navigator.clipboard.writeText(completedDraft.summary);
      setLines((current) => [...current, { kind: "cmd", text: "copy" }, { kind: "accent", text: copy.terminalGuide.copied }]);
      trackOsEvent("os_terminal_brief_copy", { kind: completedDraft.kind });
    } catch {
      setLines((current) => [...current, { kind: "cmd", text: "copy" }, { kind: "out", text: copy.terminalGuide.copyUnavailable }]);
    }
  };

  const openMeeting = () => {
    trackOsEvent("os_terminal_meeting_opened", { surface: "terminal" });
    window.open(getIntroCallUrl("os_terminal"), "_blank", "noopener,noreferrer");
  };

  const run = (raw: string) => {
    const input = raw.trim();
    if (!input) return;
    if (answerGuide(input)) return;
    historyRef.current.push(input);
    historyIndexRef.current = -1;
    const push = (extra: TermLine[]) => setLines((current) => [...current, { kind: "cmd", text: input }, ...extra]);
    const [command, ...rest] = input.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    const commandName = command.toLowerCase();
    trackOsEvent("os_shell_command", { command: COMMANDS.includes(commandName) ? commandName : "unknown" });

    switch (commandName) {
      case "help":
        if (arg === "all") {
          push([
            { kind: "out", text: "work · open <tx-01…04> · proof · profile · services · about" },
            { kind: "out", text: "wallpaper <1–10> · radio · matrix · array · tour · trash · reset" },
            { kind: "out", text: "lang <en|tr|fr> · clear · tab completes · arrows replay history" },
          ]);
        } else {
          push([
            ...copy.terminalGuide.routes.map((route) => ({ kind: "out" as const, text: `${route.command.padEnd(9)} ${route.detail}` })),
            { kind: "out", text: copy.terminalGuide.helpAll },
          ]);
        }
        break;
      case "meet":
        push([{ kind: "accent", text: copy.terminalGuide.meetOpening }]);
        openMeeting();
        break;
      case "problem":
        startGuide("problem");
        break;
      case "idea":
        startGuide("idea");
        break;
      case "review":
      case "continue":
        if (completedDraft) {
          push([{ kind: "accent", text: copy.terminalGuide.reviewOpening }]);
          continueDraft();
        } else {
          push([{ kind: "out", text: copy.terminalGuide.noDraft }]);
        }
        break;
      case "copy":
        if (completedDraft) void copyDraft();
        else push([{ kind: "out", text: copy.terminalGuide.noDraft }]);
        break;
      case "restart":
        if (completedDraft) startGuide(completedDraft.kind);
        else push([{ kind: "out", text: copy.terminalGuide.noDraft }]);
        break;
      case "back":
      case "cancel":
        push([{ kind: "out", text: "`back` and `cancel` are available while shaping a problem or idea." }]);
        break;
      case "work":
        push([{ kind: "out", text: "TX-01 hodlstay · TX-02 gazette · TX-03 vault* · TX-04 sofra*  (* encrypted)" }]);
        if (!mobile) onOpenWindow("work");
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
        push([
          { kind: "accent", text: "  ▲▼   guest@maydalabs" },
          { kind: "accent", text: " ▲ ● ▼  ──────────────" },
          { kind: "out", text: `  ▼▲   OS: MaydaOS 26.08 (signal)` },
          { kind: "out", text: `       Shell: mayda-sh 1.0 · Locale: ${locale}` },
          { kind: "out", text: "       Uptime: live · Products: 4 (2 broadcasting)" },
          { kind: "out", text: `       Display: Bitcoin orange @ 60 Hz · Memory: enough` },
        ]);
        break;
      }
      case "services":
        push([{ kind: "accent", text: "opening services …" }]);
        onNavigate("/services");
        break;
      case "profile":
        push([{ kind: "accent", text: "opening the builder profile …" }]);
        onNavigate("/profile");
        break;
      case "contact":
        push([{ kind: "accent", text: "opening the guided brief …" }]);
        onNavigate("/contact");
        break;
      case "about":
        if (mobile) {
          push(OS_COPY[locale].aboutWindow.rows.map(([term, val]) => ({ kind: "out" as const, text: `${term}: ${val}` })));
        } else {
          push([{ kind: "accent", text: "about this mayda …" }]);
          onOpenWindow("about");
        }
        break;
      case "trash":
        if (mobile) {
          push([
            ...OS_COPY[locale].trashWindow.items.map((item) => ({ kind: "out" as const, text: item })),
            { kind: "accent", text: OS_COPY[locale].trashWindow.emptied },
          ]);
        } else {
          push([{ kind: "accent", text: "taking out the trash …" }]);
          onOpenWindow("trash");
        }
        break;
      case "array":
        if (mobile) {
          push([{ kind: "out", text: "the array wants a bigger antenna — visit from a desktop" }]);
        } else {
          push([{ kind: "accent", text: "raising the signal array …" }]);
          onOpenWindow("array");
        }
        break;
      case "screensaver":
        push([{ kind: "accent", text: "dimming the lights …" }]);
        window.dispatchEvent(new CustomEvent("os:screensaver"));
        break;
      case "matrix":
        push([{ kind: "accent", text: "there is no template." }]);
        window.dispatchEvent(new CustomEvent("os:matrix"));
        break;
      case "tour":
        if (mobile) {
          push([{ kind: "out", text: "the tour needs the big desktop" }]);
        } else {
          push([{ kind: "accent", text: "sit back — the ghost knows the way" }]);
          window.dispatchEvent(new CustomEvent("os:tour"));
        }
        break;
      case "wallpaper": {
        if (mobile) {
          push([{ kind: "out", text: "wallpapers live on the big desktop" }]);
          break;
        }
        if (!arg) {
          push([
            ...WALLPAPER_IDS.map((key, index) => ({ kind: "out" as const, text: `${index + 1}. ${key} — ${WALLPAPER_LABELS[key]}` })),
            { kind: "out", text: "usage: wallpaper <name|number|random>" },
          ]);
          break;
        }
        const target = arg === "random"
          ? WALLPAPER_IDS[historyRef.current.length % WALLPAPER_IDS.length]
          : resolveWallpaperId(arg);
        if (target) {
          push([{ kind: "accent", text: `hanging ${target} — ${WALLPAPER_LABELS[target]}` }]);
          window.dispatchEvent(new CustomEvent("os:wallpaper", { detail: { id: target } }));
        } else {
          push([{ kind: "out", text: `no wallpaper called "${arg}" — run wallpaper to list them` }]);
        }
        break;
      }
      case "radio":
        if (isRadioOn()) {
          stopRadio();
          push([{ kind: "out", text: "radio off — silence restored" }]);
        } else if (startRadio()) {
          push([{ kind: "accent", text: "◌ tuning 96.3 THE SIGNAL — lo-fi transmissions. `radio` again to stop" }]);
        } else {
          push([{ kind: "out", text: "no audio hardware on this frequency" }]);
        }
        break;
      case "reset":
        if (mobile) {
          push([{ kind: "out", text: "nothing to reset — the phone keeps it simple" }]);
        } else {
          onReset();
          push([{ kind: "accent", text: "desktop restored to factory settings" }]);
        }
        break;
      case "brief":
      case "book-call":
      case "book":
        push([{ kind: "accent", text: "opening the guided brief — bring the messy idea" }]);
        onNavigate("/contact");
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
        push([{ kind: "out", text: "guest@maydalabs — the terminal keeps no account and sends nothing by itself" }]);
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
    if (event.key === "Enter") {
      event.preventDefault();
      run(value);
      setValue("");
    } else if (event.key === "ArrowUp") {
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

  const promptName = guidedFlow?.kind ?? (completedDraft ? "draft" : "guest");

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
        <span aria-hidden>{promptName}@maydalabs:~$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            const now = performance.now();
            if (now - lastExciteRef.current > 140) {
              lastExciteRef.current = now;
              window.dispatchEvent(new CustomEvent("os:sea-excite"));
            }
          }}
          onKeyDown={onKeyDown}
          aria-label="maydalabs shell"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={mobile}
          lang={locale}
          placeholder={guidedFlow
            ? copy.terminalGuide.answerPlaceholder
            : completedDraft
              ? copy.terminalGuide.draftPlaceholder
              : copy.terminalGuide.inputPlaceholder}
        />
        <button type="submit" className="os-terminal-enter" aria-label="Run terminal command">{copy.terminalGuide.enterHint}</button>
      </form>
    </div>
  );
}
