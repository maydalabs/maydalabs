"use client";

import { useEffect } from "react";
import { loadSoundPreference, playLock, playTick, primeAudioContext } from "@/lib/soundSignal";

const HOVER_TARGETS =
  ".studio-button, .studio-nav-link, .studio-text-link, .visual-proof-card, .constellation-index a";
const LOCK_TARGETS = ".studio-button, .visual-proof-card, .constellation-index a";

export function SoundLayer() {
  useEffect(() => {
    loadSoundPreference();

    // Browsers keep the AudioContext suspended until a user gesture; the
    // first pointer interaction unlocks it when sound was left enabled.
    const prime = () => primeAudioContext();
    window.addEventListener("pointerdown", prime, { once: true, passive: true });

    const lastTick = new WeakMap<Element, number>();

    const onPointerOver = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest?.(HOVER_TARGETS);
      if (!target) return;
      const now = performance.now();
      const previous = lastTick.get(target) ?? 0;
      if (now - previous < 350) return;
      lastTick.set(target, now);
      playTick();
    };

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.(LOCK_TARGETS);
      if (!target) return;
      playLock();
    };

    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("click", onClick, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", prime);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
