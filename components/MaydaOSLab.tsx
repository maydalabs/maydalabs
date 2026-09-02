"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import type { MaydaOsApp, MaydaOsCopy } from "@/components/maydaOsLabCopy";
import { type Locale, localizePath } from "@/lib/i18n";
import styles from "./MaydaOSLab.module.css";

type TerminalLine = {
  kind: "command" | "output";
  text: string;
};

const COMMAND_TO_APP: Partial<Record<string, MaydaOsApp>> = {
  overview: "overview",
  launch: "pathways",
  accelerate: "pathways",
  optimize: "pathways",
  systems: "capabilities",
  work: "work",
};

const MAYDA_OS_APPS: MaydaOsApp[] = [
  "overview",
  "pathways",
  "capabilities",
  "work",
  "terminal",
];

export function MaydaOSLab({ locale, copy }: { locale: Locale; copy: MaydaOsCopy }) {
  const router = useRouter();
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const [activeApp, setActiveApp] = useState<MaydaOsApp>("overview");
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<TerminalLine[]>([
    { kind: "output", text: copy.terminal.welcome },
  ]);

  useEffect(() => {
    if (activeApp === "terminal") terminalInputRef.current?.focus();
  }, [activeApp]);

  const openApp = (app: MaydaOsApp) => {
    setActiveApp(app);
  };

  const executeCommand = (rawCommand: string) => {
    const normalized = rawCommand.trim().toLowerCase();
    if (!normalized) return;

    if (normalized === "clear") {
      setHistory([{ kind: "output", text: copy.terminal.cleared }]);
      setCommand("");
      return;
    }

    let output = copy.terminal.unknown;
    const nextApp = COMMAND_TO_APP[normalized];

    if (normalized === "help") {
      output = copy.terminal.help;
    } else if (nextApp) {
      setActiveApp(nextApp);
      output = copy.terminal.opened + " " + copy.apps[nextApp].label + ".";
    } else if (normalized === "map") {
      output = copy.terminal.navigating + " " + copy.overview.primaryAction + ".";
      router.push(localizePath("/start", locale));
    } else if (normalized === "contact") {
      output = copy.terminal.navigating + " /contact.";
      router.push(localizePath("/contact", locale));
    }

    setHistory((current) =>
      [
        ...current,
        { kind: "command" as const, text: normalized },
        { kind: "output" as const, text: output },
      ].slice(-18),
    );
    setCommand("");
  };

  const activeCopy = copy.apps[activeApp];

  return (
    <section
      id="mayda-os-lab"
      className={styles.frame}
      aria-label={copy.ariaLabel}
      data-mayda-os="v3"
    >
      <header className={styles.systemBar}>
        <div className={styles.brand}>
          <Wordmark className={styles.wordmark} />
          <span className={styles.productName}>MaydaOS</span>
          <span className={styles.version}>03.0</span>
        </div>
        <div className={styles.systemState}>
          <span className={styles.stateDot} aria-hidden="true" />
          <span>{copy.connected}</span>
          <span className={styles.mode}>{copy.labMode}</span>
        </div>
      </header>

      <div className={styles.workspace}>
        <nav className={styles.dock} aria-label={copy.dockLabel} role="tablist">
          <span className={styles.dockLabel}>MaydaOS</span>
          {MAYDA_OS_APPS.map((app) => {
            const item = copy.apps[app];
            const isActive = activeApp === app;
            return (
              <button
                key={app}
                type="button"
                role="tab"
                id={"mayda-os-tab-" + app}
                aria-controls="mayda-os-panel"
                aria-selected={isActive}
                className={isActive ? styles.dockItemActive : styles.dockItem}
                onClick={() => openApp(app)}
                title={item.hint}
              >
                <span className={styles.dockGlyph} aria-hidden="true">
                  {item.glyph}
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className={styles.desktop}>
          <div className={styles.fieldGrid} aria-hidden="true">
            <i className={styles.fieldInput} />
            <i className={styles.fieldBranchOne} />
            <i className={styles.fieldBranchTwo} />
            <i className={styles.fieldBranchThree} />
          </div>

          <section
            id="mayda-os-panel"
            className={styles.window}
            role="tabpanel"
            aria-labelledby={"mayda-os-tab-" + activeApp}
            tabIndex={0}
          >
            <header className={styles.windowBar}>
              <span className={styles.windowMark} aria-hidden="true">
                ×
              </span>
              <div>
                <strong>{activeCopy.label}</strong>
                <small>{copy.windowLabel}</small>
              </div>
              <span className={styles.windowPath}>/lab/{activeApp}</span>
            </header>

            <div className={styles.windowBody}>
              {activeApp === "overview" ? (
                <OverviewPanel locale={locale} copy={copy} />
              ) : null}
              {activeApp === "pathways" ? (
                <PathwaysPanel locale={locale} copy={copy} />
              ) : null}
              {activeApp === "capabilities" ? (
                <CapabilitiesPanel copy={copy} />
              ) : null}
              {activeApp === "work" ? <WorkPanel locale={locale} copy={copy} /> : null}
              {activeApp === "terminal" ? (
                <TerminalPanel
                  copy={copy}
                  command={command}
                  history={history}
                  inputRef={terminalInputRef}
                  onCommandChange={setCommand}
                  onRun={executeCommand}
                />
              ) : null}
            </div>
          </section>

        </div>
      </div>

      <footer className={styles.statusBar}>
        <span>{copy.footerStatus}</span>
        <span className={styles.statusRoute}>maydalabs.local/os</span>
      </footer>
    </section>
  );
}

type Copy = MaydaOsCopy;

function PanelIntro({
  kicker,
  heading,
  body,
}: {
  kicker: string;
  heading: string;
  body: string;
}) {
  return (
    <header className={styles.panelIntro}>
      <p>{kicker}</p>
      <h2>{heading}</h2>
      <div>{body}</div>
    </header>
  );
}

function OverviewPanel({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <div className={styles.overviewPanel}>
      <div className={styles.overviewCopy}>
        <PanelIntro
          kicker={copy.overview.kicker}
          heading={copy.overview.heading}
          body={copy.overview.body}
        />

        <dl className={styles.factGrid}>
          {copy.overview.facts.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.actions}>
          <Link className="mayda-button mayda-button-small" href={localizePath("/start", locale)}>
            {copy.overview.primaryAction} <span aria-hidden="true">→</span>
          </Link>
          <Link
            className="mayda-button mayda-button-small mayda-button-outline"
            href={localizePath("/approach", locale)}
          >
            {copy.overview.secondaryAction}
          </Link>
        </div>
      </div>

      <div className={styles.systemMap} aria-label={copy.overview.heading}>
        <div className={styles.mapInput}>
          <span>{copy.overview.inputLabel}</span>
          <strong>{copy.overview.input}</strong>
        </div>
        <div className={styles.mapNode} aria-hidden="true">
          ×
        </div>
        <div className={styles.mapOutputs}>
          <span>{copy.overview.outputLabel}</span>
          {copy.overview.outputs.map((output, index) => (
            <div key={output}>
              <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
              <strong>{output}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PathwaysPanel({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <div>
      <PanelIntro
        kicker={copy.pathways.kicker}
        heading={copy.pathways.heading}
        body={copy.pathways.body}
      />
      <div className={styles.pathGrid}>
        {copy.pathways.items.map((item) => (
          <article key={item.number} className={styles.pathCard}>
            <header>
              <span>{item.number}</span>
              <em>{item.label}</em>
            </header>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <strong className={styles.result}>{item.result}</strong>
            <Link href={localizePath("/start", locale)}>
              {copy.pathways.action} <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function CapabilitiesPanel({ copy }: { copy: Copy }) {
  return (
    <div>
      <PanelIntro
        kicker={copy.capabilities.kicker}
        heading={copy.capabilities.heading}
        body={copy.capabilities.body}
      />
      <div className={styles.capabilityGrid}>
        {copy.capabilities.items.map((item) => (
          <article key={item.number} className={styles.capabilityCard}>
            <span>{item.number}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <ul>
              {item.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <aside className={styles.onchainNote}>
        <span>{copy.capabilities.onchainLabel}</span>
        <div>
          <h3>{copy.capabilities.onchainTitle}</h3>
          <p>{copy.capabilities.onchainBody}</p>
        </div>
      </aside>
    </div>
  );
}

function WorkPanel({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <div>
      <PanelIntro kicker={copy.work.kicker} heading={copy.work.heading} body={copy.work.body} />
      <div className={styles.workGrid}>
        {copy.work.items.map((item, index) => (
          <Link
            key={item.title}
            className={styles.workCard}
            href={localizePath(item.href, locale)}
          >
            <header>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <em>{item.status}</em>
            </header>
            <h3>{item.title}</h3>
            <strong>{item.relationship}</strong>
            <p>{item.body}</p>
            <small>
              {copy.work.action} <span aria-hidden="true">→</span>
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TerminalPanel({
  copy,
  command,
  history,
  inputRef,
  onCommandChange,
  onRun,
}: {
  copy: Copy;
  command: string;
  history: TerminalLine[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onCommandChange: (value: string) => void;
  onRun: (value: string) => void;
}) {
  return (
    <div>
      <PanelIntro
        kicker={copy.terminal.kicker}
        heading={copy.terminal.heading}
        body={copy.terminal.body}
      />

      <div className={styles.terminal}>
        <div className={styles.terminalOutput} aria-live="polite">
          {history.map((line, index) => (
            <p key={String(index) + line.kind + line.text}>
              {line.kind === "command" ? (
                <span className={styles.prompt}>{copy.terminal.prompt}</span>
              ) : (
                <span className={styles.outputMark}>↳</span>
              )}
              <span>{line.text}</span>
            </p>
          ))}
        </div>

        <form
          className={styles.terminalForm}
          onSubmit={(event) => {
            event.preventDefault();
            onRun(command);
          }}
        >
          <label htmlFor="mayda-os-command">{copy.terminal.inputLabel}</label>
          <span className={styles.prompt}>{copy.terminal.prompt}</span>
          <input
            ref={inputRef}
            id="mayda-os-command"
            value={command}
            onChange={(event) => onCommandChange(event.currentTarget.value)}
            placeholder={copy.terminal.placeholder}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit">{copy.terminal.run}</button>
        </form>
      </div>

      <div className={styles.suggestions}>
        <span>{copy.terminal.suggestionsLabel}</span>
        <div>
          {copy.terminal.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => onRun(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
