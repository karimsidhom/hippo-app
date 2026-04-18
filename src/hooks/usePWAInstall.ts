"use client";

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// usePWAInstall — one place to answer: "Can I install this thing, and if so,
// how?" + actually trigger the install.
//
// Three platforms, three paths:
//
//   Android Chrome / desktop Chrome (non-iOS): the browser fires a
//     `beforeinstallprompt` event. We catch it at the root (<InstallCapture/>)
//     and stash the event on `window`. This hook reads that stash and
//     exposes `triggerInstall()` → single tap → native install sheet.
//
//   iOS Safari: Apple gives us NO install API. Everyone has to tap
//     Share → Add to Home Screen manually. This hook reports `kind: "ios"`
//     so the UI can show the visual guide.
//
//   Anything else (iOS Chrome/Firefox, in-app browsers, already-installed
//     PWAs): `kind: "unavailable"` — UI should offer "Continue on web".
//
// Intentional non-goals:
//   - We don't fire install automatically. Onboarding asks first.
//   - We don't track dismissals here. Whatever surface mounts this hook
//     is responsible for its own "don't show again" state.
// ---------------------------------------------------------------------------

// Shape of the native install event. Minimal — we only use prompt()+userChoice.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

// Shared reference so multiple hook instances stay in sync. The actual
// capture happens in <InstallCapture/> which sets
// `window.__hippoInstallPromptEvent`.
declare global {
  interface Window {
    __hippoInstallPromptEvent?: BeforeInstallPromptEvent | null;
  }
}

type InstallKind =
  | "native"        // beforeinstallprompt captured — one-tap install works
  | "ios"           // iOS Safari — show the visual guide (no programmatic API)
  | "installed"     // already running as a PWA — hide install UX entirely
  | "unavailable";  // not supported here (iOS Chrome, in-app browser, desktop non-Chrome)

export interface PWAInstallState {
  kind: InstallKind;
  /** True when kind === "native" AND the event is still fresh. */
  canInstallNative: boolean;
  /** True while the browser is showing its native install sheet. */
  installing: boolean;
  /**
   * Trigger the native install. Only useful when `kind === "native"`.
   * Resolves after the user accepts or dismisses; cleans up the event
   * reference either way so the second tap doesn't re-prompt.
   */
  triggerInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

function detectKind(): InstallKind {
  if (typeof window === "undefined") return "unavailable";

  // Already installed? No more install UX needed.
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || iosStandalone) return "installed";

  // Android Chrome / desktop Chrome: the captured event decides it.
  if (window.__hippoInstallPromptEvent) return "native";

  // iOS detection — including iPadOS 13+ that pretends to be Mac.
  const ua = navigator.userAgent.toLowerCase();
  const isIpadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIOS = /iphone|ipad|ipod/.test(ua) || isIpadOS;

  if (!isIOS) {
    // Not iOS and no captured event — could be Firefox, Edge, or a
    // browser that hasn't fired the event yet. Call it unavailable;
    // caller can show "Open in your default browser" guidance.
    return "unavailable";
  }

  // iOS path — only Safari can Add-to-Home-Screen. iOS Chrome/Firefox/
  // Edge all share the WebKit engine but hide install inside their own
  // menus, which we can't control.
  const isInAppBrowser =
    /fban|fbav|instagram|line\/|twitter|tiktok|linkedin/i.test(ua);
  if (isInAppBrowser) return "unavailable";

  const isSafari =
    /safari/.test(ua) && !/crios|fxios|edgios|yabrowser|ucbrowser/.test(ua);
  return isSafari ? "ios" : "unavailable";
}

export function usePWAInstall(): PWAInstallState {
  const [kind, setKind] = useState<InstallKind>("unavailable");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Initial probe.
    setKind(detectKind());

    // Re-probe when the captured event changes (InstallCapture sets it
    // asynchronously after mount). We poll at most once a second, max 6
    // times — the event almost always fires within 2s of first paint.
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const next = detectKind();
      setKind((prev) => (prev === next ? prev : next));
      if (attempts >= 6 || next === "native" || next === "installed") {
        clearInterval(interval);
      }
    }, 1000);

    // Also listen for `appinstalled` so if the user installs through
    // the browser menu (instead of our button) we hide the UI.
    const onInstalled = () => setKind("installed");
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearInterval(interval);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (typeof window === "undefined") return "unavailable";
    const evt = window.__hippoInstallPromptEvent;
    if (!evt) return "unavailable";

    setInstalling(true);
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      // Either way, the prompt event is single-use. Clear it so we don't
      // try to call prompt() twice on the same event (throws in Chrome).
      window.__hippoInstallPromptEvent = null;
      if (choice.outcome === "accepted") {
        setKind("installed");
      } else {
        setKind(detectKind());
      }
      return choice.outcome;
    } finally {
      setInstalling(false);
    }
  }, []);

  return {
    kind,
    canInstallNative: kind === "native",
    installing,
    triggerInstall,
  };
}
