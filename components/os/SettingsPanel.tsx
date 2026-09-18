"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { resetDesktopAction } from "@/app/actions/desktop";
import { OS_ACCENTS, OS_MOODS, type OsPrefs } from "@/lib/osDesktop";

/* The part of Settings that changes the desk under your hand.
 *
 * A choice is applied the moment it is pressed, by telling the shell — the
 * same window-event route everything else on the desk uses to reach it —
 * and the shell is the one that remembers it. Nothing here waits for a
 * server to say yes: a wallpaper is not a decision.
 */

export const OS_PREFS_EVENT = "maydaos:prefs";

export type SettingsPanelCopy = {
  wallpaper: string;
  moods: Record<string, string>;
  accent: string;
  accents: Record<string, string>;
  desk: string;
  resetLayout: string;
  install: string;
  installBody: string;
  installButton: string;
  installHint: string;
  installed: string;
};

/* Chrome offers to install a page as an app through this event and no
 * other way; Safari has a menu item instead. The button appears only where
 * pressing it can do something. */
type InstallPrompt = Event & { prompt: () => Promise<void> };

let installPrompt: InstallPrompt | null = null;
const installListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    for (const listener of installListeners) listener();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    for (const listener of installListeners) listener();
  });
}

function subscribeInstall(listener: () => void) {
  installListeners.add(listener);
  return () => {
    installListeners.delete(listener);
  };
}

const canInstall = () => installPrompt !== null;
const cannotInstall = () => false;

export function SettingsPanel({ prefs: initial, copy }: { prefs: OsPrefs; copy: SettingsPanelCopy }) {
  const [prefs, setPrefs] = useState(initial);
  const [resetting, startReset] = useTransition();
  const installable = useSyncExternalStore(subscribeInstall, canInstall, cannotInstall);
  const [installed, setInstalled] = useState(false);

  /* Standalone means already installed: the page is running in its own
   * window, so the offer would be offering what the person already has. */
  const standalone = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );

  // Told to the shell from the press itself, not from an effect: an effect
  // would also announce the initial value on every mount, and the shell would
  // dutifully save what it already had.
  const choose = (patch: Partial<OsPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    window.dispatchEvent(new CustomEvent<OsPrefs>(OS_PREFS_EVENT, { detail: next }));
  };

  return (
    <>
      <section className="os-settings-section">
        <h2 className="os-doc-label">{copy.wallpaper}</h2>
        <div className="os-swatches" role="radiogroup" aria-label={copy.wallpaper}>
          {OS_MOODS.map((mood) => (
            <label key={mood} className="os-swatch" data-mood={mood} data-chosen={prefs.mood === mood}>
              <input
                type="radio"
                name="mood"
                value={mood}
                checked={prefs.mood === mood}
                onChange={() => choose({ mood })}
              />
              <span className="os-swatch-sample" aria-hidden="true" />
              <span>{copy.moods[mood] ?? mood}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="os-settings-section">
        <h2 className="os-doc-label">{copy.accent}</h2>
        <div className="os-swatches" role="radiogroup" aria-label={copy.accent}>
          {OS_ACCENTS.map((accent) => (
            <label key={accent} className="os-swatch" data-accent={accent} data-chosen={prefs.accent === accent}>
              <input
                type="radio"
                name="accent"
                value={accent}
                checked={prefs.accent === accent}
                onChange={() => choose({ accent })}
              />
              <span className="os-swatch-sample" aria-hidden="true" />
              <span>{copy.accents[accent] ?? accent}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="os-settings-section">
        <h2 className="os-doc-label">{copy.desk}</h2>
        <button
          type="button"
          className="mayda-button mayda-button-outline"
          disabled={resetting}
          onClick={() =>
            startReset(async () => {
              await resetDesktopAction();
              // The shell hydrates its windows once, on arrival; the honest
              // way to arrive again is to arrive again.
              window.location.reload();
            })
          }
        >
          {copy.resetLayout}
        </button>
      </section>

      <section className="os-settings-section">
        <h2 className="os-doc-label">{copy.install}</h2>
        {standalone || installed ? (
          <p className="os-doc-quiet">{copy.installed}</p>
        ) : (
          <>
            <p className="os-settings-body">{copy.installBody}</p>
            {installable ? (
              <button
                type="button"
                className="mayda-button"
                onClick={async () => {
                  const prompt = installPrompt;
                  if (!prompt) return;
                  await prompt.prompt();
                  setInstalled(window.matchMedia("(display-mode: standalone)").matches);
                }}
              >
                {copy.installButton}
              </button>
            ) : (
              <p className="os-doc-quiet">{copy.installHint}</p>
            )}
          </>
        )}
      </section>
    </>
  );
}
