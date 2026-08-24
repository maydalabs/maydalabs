// Synthesized UI sound for the signal-station experience. No audio files:
// a filtered noise tick for hovers and a two-tone lock blip for commits.
// Everything is gated behind an explicit, persisted opt-in.

let context: AudioContext | null = null;
let enabled = false;
const listeners = new Set<(value: boolean) => void>();

function ensureContext() {
  if (typeof window === "undefined") return null;
  if (!context) {
    if (!("AudioContext" in window)) return null;
    context = new AudioContext();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

export function isSoundEnabled() {
  return enabled;
}

export function loadSoundPreference() {
  try {
    enabled = window.localStorage.getItem("ml_sound") === "1";
  } catch {
    enabled = false;
  }
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    window.localStorage.setItem("ml_sound", value ? "1" : "0");
  } catch {
    // Preference simply won't persist.
  }
  if (value) ensureContext();
  for (const listener of listeners) listener(value);
}

export function onSoundChange(listener: (value: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function primeAudioContext() {
  if (enabled) ensureContext();
}

export function playTick() {
  if (!enabled) return;
  const audio = ensureContext();
  if (!audio || audio.state !== "running") return;

  const length = Math.floor(audio.sampleRate * 0.02);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }

  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 4;
  const gain = audio.createGain();
  gain.gain.value = 0.04;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

export function playLock() {
  if (!enabled) return;
  const audio = ensureContext();
  if (!audio || audio.state !== "running") return;

  const now = audio.currentTime;
  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(540, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}
