"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { OS_COPY } from "@/components/os/osCopy";
import { trackOsEvent } from "@/lib/osAnalytics";

// The OS demos itself: a ghost cursor types `proof` into the real shell,
// opens the Signal Array from the dock, drags a window, splashes the
// water, and ends circling the call-to-action. It is launched from the
// first-session guide, dock, or `tour` command and cancelled the instant
// the visitor touches anything themselves.
export function OsTour({ locale }: { locale: Locale }) {
  const copy = OS_COPY[locale].tour;
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean; clicking: boolean }>({
    x: 0,
    y: 0,
    visible: false,
    clicking: false,
  });
  const runningRef = useRef(false);
  const cancelRef = useRef(false);

  const runTour = useCallback(async () => {
    if (runningRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.dispatchEvent(new CustomEvent("os:toast", { detail: { text: copy.skipped } }));
      return;
    }
    runningRef.current = true;
    cancelRef.current = false;
    trackOsEvent("os_tour", { phase: "start" });

    const cancelled = () => cancelRef.current;
    const cancelOnRealInput = (event: Event) => {
      if (event.isTrusted) cancelRef.current = true;
    };
    window.addEventListener("pointerdown", cancelOnRealInput, true);
    window.addEventListener("keydown", cancelOnRealInput, true);
    window.addEventListener("wheel", cancelOnRealInput, { capture: true, passive: true });
    const hardStop = setTimeout(() => {
      cancelRef.current = true;
    }, 40_000);

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const started = performance.now();
        const check = () => {
          if (cancelled() || performance.now() - started >= ms) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });

    const position = { x: window.innerWidth * 0.55, y: window.innerHeight * 0.42 };
    const setGhost = (patch: Partial<typeof cursor>) =>
      setCursor((current) => ({ ...current, x: position.x, y: position.y, ...patch }));

    const glideTo = (targetX: number, targetY: number) =>
      new Promise<void>((resolve) => {
        const step = () => {
          if (cancelled()) return resolve();
          position.x += (targetX - position.x) * 0.13;
          position.y += (targetY - position.y) * 0.13;
          setGhost({});
          if (Math.hypot(targetX - position.x, targetY - position.y) < 3.5) resolve();
          else requestAnimationFrame(step);
        };
        step();
      });

    const glideToElement = async (selector: string, offsetX = 0, offsetY = 0) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      await glideTo(rect.left + rect.width / 2 + offsetX, rect.top + rect.height / 2 + offsetY);
      return true;
    };

    const clickRing = async () => {
      setGhost({ clicking: true });
      await wait(360);
      setGhost({ clicking: false });
    };

    const setNativeValue = (input: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    try {
      setGhost({ visible: true });
      await wait(500);

      // 1. Type `proof` into the real shell.
      if (!document.querySelector('[data-window="terminal"]')) {
        window.dispatchEvent(new CustomEvent("os:tour-action", { detail: { action: "open", id: "terminal" } }));
        await wait(600);
      }
      if (!cancelled() && (await glideToElement('[data-window="terminal"] .os-terminal-input input'))) {
        await clickRing();
        const input = document.querySelector<HTMLInputElement>('[data-window="terminal"] .os-terminal-input input');
        const form = document.querySelector<HTMLFormElement>('[data-window="terminal"] .os-terminal-input');
        if (input && form) {
          const text = "proof";
          for (let index = 1; index <= text.length && !cancelled(); index += 1) {
            setNativeValue(input, text.slice(0, index));
            await wait(110);
          }
          await wait(220);
          if (!cancelled()) form.requestSubmit();
        }
        await wait(1300);
      }

      // 2. Open the Signal Array from the dock.
      if (!cancelled() && (await glideToElement('[data-tour="dock-array"]'))) {
        await clickRing();
        window.dispatchEvent(new CustomEvent("os:tour-action", { detail: { action: "open", id: "array" } }));
        await wait(1500);
      }

      // 3. Drag the array window a little.
      if (!cancelled() && (await glideToElement('[data-window="array"] .os-window-bar'))) {
        await wait(250);
        for (let step = 0; step < 12 && !cancelled(); step += 1) {
          position.x -= 6;
          position.y += 3.4;
          setGhost({});
          window.dispatchEvent(new CustomEvent("os:tour-action", { detail: { action: "nudge", id: "array", dx: -6, dy: 3.4 } }));
          await wait(34);
        }
        await wait(500);
      }

      // 4. Splash the water.
      if (!cancelled()) {
        const waterX = window.innerWidth * 0.16;
        const waterY = window.innerHeight * 0.78;
        await glideTo(waterX, waterY);
        await clickRing();
        window.dispatchEvent(
          new CustomEvent("os:sea-pulse", { detail: { x: waterX / window.innerWidth, y: waterY / window.innerHeight } }),
        );
        await wait(900);
      }

      // 5. Circle the call-to-action, then hand over.
      if (!cancelled()) {
        const target = document.querySelector('[data-tour="start"]');
        if (target) {
          const rect = target.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          await glideTo(centerX, centerY - 6);
          const started = performance.now();
          while (!cancelled() && performance.now() - started < 1500) {
            const angle = ((performance.now() - started) / 1500) * Math.PI * 4;
            position.x = centerX + Math.cos(angle) * 20;
            position.y = centerY - 6 + Math.sin(angle) * 11;
            setGhost({});
            await wait(16);
          }
        }
      }

      if (!cancelled()) {
        trackOsEvent("os_tour", { phase: "complete" });
        window.dispatchEvent(new CustomEvent("os:toast", { detail: { text: copy.done } }));
      }
    } finally {
      clearTimeout(hardStop);
      window.removeEventListener("pointerdown", cancelOnRealInput, true);
      window.removeEventListener("keydown", cancelOnRealInput, true);
      window.removeEventListener("wheel", cancelOnRealInput, true);
      setCursor((current) => ({ ...current, visible: false, clicking: false }));
      runningRef.current = false;
    }
  }, [copy.done, copy.skipped]);

  useEffect(() => {
    const onSummon = () => void runTour();
    window.addEventListener("os:tour", onSummon);
    return () => window.removeEventListener("os:tour", onSummon);
  }, [runTour]);

  return (
    <>
      {cursor.visible ? (
        <div
          className={`os-ghost-cursor ${cursor.clicking ? "is-clicking" : ""}`}
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          aria-hidden="true"
        >
          <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
            <path d="M4 2 L4 19 L8.6 15.2 L11.4 21.4 L14.4 20 L11.6 13.9 L17.6 13.4 Z" fill="#f2f0ea" stroke="#0a0a09" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span>mayda</span>
        </div>
      ) : null}
    </>
  );
}
