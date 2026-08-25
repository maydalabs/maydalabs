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

// ── the radio ────────────────────────────────────────────────────────
// A fully synthesized lo-fi signal tuner: a filtered static bed, a
// slow detuned drone, and sparse echoing blips. Started only by the
// explicit `radio` command (that keypress is the audio gesture), and
// independent of the SND interface-tick preference.

let radio: { stop: () => void } | null = null;

export function isRadioOn() {
  return radio !== null;
}

export function stopRadio() {
  radio?.stop();
  radio = null;
}

export function startRadio(): boolean {
  if (radio) return true;
  if (typeof window === "undefined" || !("AudioContext" in window)) return false;
  const audio = ensureContext();
  if (!audio) return false;

  const master = audio.createGain();
  master.gain.value = 0.5;
  master.connect(audio.destination);

  const length = Math.floor(audio.sampleRate * 2);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const band = audio.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 850;
  band.Q.value = 0.7;
  const noiseGain = audio.createGain();
  noiseGain.gain.value = 0.014;
  noise.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(master);
  noise.start();

  const droneGain = audio.createGain();
  droneGain.gain.value = 0.02;
  droneGain.connect(master);
  const droneA = audio.createOscillator();
  droneA.type = "sine";
  droneA.frequency.value = 108;
  const droneB = audio.createOscillator();
  droneB.type = "sine";
  droneB.frequency.value = 108.8;
  droneA.connect(droneGain);
  droneB.connect(droneGain);
  droneA.start();
  droneB.start();
  const lfo = audio.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = audio.createGain();
  lfoGain.gain.value = 0.01;
  lfo.connect(lfoGain);
  lfoGain.connect(droneGain.gain);
  lfo.start();

  let blipTimer = 0;
  const scheduleBlip = () => {
    blipTimer = window.setTimeout(() => {
      const t0 = audio.currentTime;
      const frequency = [880, 1174, 1318][Math.floor(Math.random() * 3)];
      for (let echo = 0; echo < 3; echo += 1) {
        const osc = audio.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        const gain = audio.createGain();
        const start = t0 + echo * 0.28;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.028 / (echo + 1), start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + 0.26);
      }
      // Each blip stirs the desktop sea a little.
      window.dispatchEvent(new CustomEvent("os:sea-excite"));
      scheduleBlip();
    }, 2800 + Math.random() * 4200);
  };
  scheduleBlip();

  radio = {
    stop: () => {
      window.clearTimeout(blipTimer);
      try {
        noise.stop();
        droneA.stop();
        droneB.stop();
        lfo.stop();
      } catch {
        // Already stopped.
      }
      master.disconnect();
    },
  };
  return true;
}
