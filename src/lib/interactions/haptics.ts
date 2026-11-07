"use client";

// ---------------------------------------------------------------------------
// haptics — navigator.vibrate wrappers. No-op on iOS (Apple removed the
// Vibration API from Safari) but a nice touch on Android and Pixel devices.
//
// Durations are in milliseconds. We keep every pattern short (< 40 ms for
// single taps, < 120 ms total for compound patterns) — the app is used
// during long shifts, and buzzing phones become fatiguing fast.
// ---------------------------------------------------------------------------

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return false;
  try {
    return window.localStorage.getItem("hippo_haptics_enabled") !== "false";
  } catch {
    return true;
  }
}

function buzz(pattern: number | number[]): void {
  if (!isEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw if the pattern is too long / total > 10000ms.
    // Our patterns are tiny, so this would be a platform quirk — swallow.
  }
}

/** Light tap for generic button presses. 8ms — a tick, not a thump. */
export function tapLight(): void { buzz(8); }

/** A shade stronger — for confirming primary actions (Save, Log). */
export function tapMedium(): void { buzz(14); }

/** Success double-tap — case logged, milestone unlocked, etc. */
export function tapSuccess(): void { buzz([10, 40, 16]); }

/** Gentle error pattern — one longer buzz so it registers without panic. */
export function tapError(): void { buzz([20, 30, 20]); }

/** Toggle — quickest possible acknowledgement. */
export function tapToggle(): void { buzz(5); }
