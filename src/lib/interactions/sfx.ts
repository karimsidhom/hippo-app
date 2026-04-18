"use client";

// ---------------------------------------------------------------------------
// sfx — tiny WebAudio-synthesised sound effects for button/log interactions.
//
// Why synth, not audio files?
//   - No network fetch. Works offline on day one, before the service worker
//     has cached anything.
//   - Zero bundle weight (a .mp3 "click" is 3–8 KB; this file is < 2 KB).
//   - Pitch, volume, and timing are trivially tweakable — when we decide a
//     sound is too loud, it's a constant change, not a re-record.
//   - No licensing concerns. Surgeons in the OR won't tolerate a gear whine
//     or a "ding" that sounds like their monitor alarm. These synths are
//     intentionally soft, short (< 120 ms), and in the mid register.
//
// Autoplay policy:
// Chrome and Safari block AudioContext creation until the user gestures.
// We lazy-create the context inside the first call and resume() it on
// every play — no-op if already running. This means the *first* tap after
// page load may be silent on some browsers (context is suspended and
// resume() is async); every subsequent tap plays cleanly.
//
// Preference:
// All calls respect window.localStorage["hippo_sfx_enabled"] === "false".
// Read on every play so the Settings toggle is instant, no reload.
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Default on. Off only when the user has explicitly opted out.
    return window.localStorage.getItem("hippo_sfx_enabled") !== "false";
  } catch {
    return true;
  }
}

/**
 * Schedule a single tone. Shaped with a short attack + exponential decay
 * so it reads as a "tick" rather than a sustained beep. duration is in ms.
 */
function tone(
  audio: AudioContext,
  {
    freq,
    type = "sine",
    duration = 80,
    gain = 0.04,
    startOffset = 0,
    glideTo,
  }: {
    freq: number;
    type?: OscillatorType;
    duration?: number;
    gain?: number;
    startOffset?: number;
    glideTo?: number;
  },
): void {
  const now = audio.currentTime + startOffset / 1000;
  const osc = audio.createOscillator();
  const amp = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (glideTo) {
    // Short pitch glide (used for the success/error sweeps)
    osc.frequency.exponentialRampToValueAtTime(glideTo, now + duration / 1000);
  }

  amp.gain.setValueAtTime(0, now);
  // 3 ms attack — avoids the click-at-start artefact from a zero-crossing.
  amp.gain.linearRampToValueAtTime(gain, now + 0.003);
  // Exponential decay (never truly reaches 0; stop the node at duration).
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration / 1000 + 0.02);
}

function safePlay(play: (audio: AudioContext) => void): void {
  if (!isEnabled()) return;
  const audio = getContext();
  if (!audio) return;
  // Resume if a prior user-gesture suspended it, or we're fresh.
  if (audio.state === "suspended") {
    void audio.resume().catch(() => { /* no-op */ });
  }
  try {
    play(audio);
  } catch {
    // If the audio graph is broken for any reason, fail silent — a missed
    // sound should never block the interaction it was supposed to adorn.
  }
}

/** Soft, short click for generic button taps. ~70ms, unobtrusive. */
export function playTap(): void {
  safePlay(audio => {
    tone(audio, { freq: 880, type: "sine", duration: 55, gain: 0.025 });
  });
}

/** Navigation tap — even quieter, slightly lower than playTap. */
export function playNav(): void {
  safePlay(audio => {
    tone(audio, { freq: 660, type: "sine", duration: 40, gain: 0.018 });
  });
}

/**
 * Case-logged celebration — two-note major third, C6→E6. Short but
 * satisfying, like Apple's "sent message" sound without the whoosh.
 */
export function playLog(): void {
  safePlay(audio => {
    tone(audio, { freq: 1047, type: "sine", duration: 90, gain: 0.035 });
    tone(audio, { freq: 1319, type: "sine", duration: 120, gain: 0.035, startOffset: 70 });
  });
}

/** Save confirmation — single confident mid-tone. */
export function playSave(): void {
  safePlay(audio => {
    tone(audio, { freq: 1175, type: "sine", duration: 110, gain: 0.03 });
  });
}

/**
 * Error — short downward sweep. Deliberately not harsh; doesn't need to
 * jolt. 440→330 over 140ms with triangle wave for a softer timbre.
 */
export function playError(): void {
  safePlay(audio => {
    tone(audio, {
      freq: 440,
      type: "triangle",
      duration: 160,
      gain: 0.035,
      glideTo: 330,
    });
  });
}

/**
 * Lightweight "toggle" tick — for switches, checkboxes, chip toggles.
 * Very short (30ms) and quiet so it doesn't get tiresome.
 */
export function playToggle(): void {
  safePlay(audio => {
    tone(audio, { freq: 1760, type: "sine", duration: 28, gain: 0.018 });
  });
}
