"use client";

import { useEffect } from "react";

// ---------------------------------------------------------------------------
// InstallCapture — mounts once at the root so the `beforeinstallprompt`
// event fires into a hand we're holding.
//
// Why this is a separate component:
// The browser fires `beforeinstallprompt` very early — sometimes before
// the onboarding page renders. If the event fires while nothing is
// listening, the browser's one-shot delivery is lost. By registering the
// listener in the root layout, we guarantee we're ready regardless of
// which route the user lands on.
//
// The event is stashed on `window.__hippoInstallPromptEvent` and consumed
// by `usePWAInstall()` from any screen that needs to trigger install.
// We also call `preventDefault()` to suppress Chrome's mini-infobar — we
// want the install to happen at onboarding's finale, not at a random
// moment of the browser's choosing.
// ---------------------------------------------------------------------------

export function InstallCapture() {
  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.__hippoInstallPromptEvent = e as any;
    };
    const onInstalled = () => {
      // User installed via browser UI — no longer any prompt to preserve.
      window.__hippoInstallPromptEvent = null;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
