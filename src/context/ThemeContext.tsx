"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Theme Context
// Manages light/dark mode with localStorage persistence and system preference
// detection. Applies via data-theme attribute on <html>.
//
// HYDRATION SAFETY (React error #418 fix):
//   The actual mutation of <html>'s class + data-theme happens BEFORE React
//   hydrates, via the inline <script> rendered by <ThemeBootstrapScript /> in
//   the document <head> (see src/app/layout.tsx). That script reads
//   localStorage synchronously and writes the correct attributes on <html>
//   so the SSR markup and the first client paint already agree. The
//   Provider's job here is just to mirror that bootstrap state into React
//   and react to user changes — it never mutates DOM during the initial
//   useEffect run, which would race React's hydration check and trip
//   error #418.
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  /** The user's preference: "light", "dark", or "system" */
  mode: ThemeMode;
  /** The resolved (actual) theme applied */
  resolved: "light" | "dark";
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "hippo-theme";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return getSystemPreference();
  return mode;
}

/**
 * Apply theme attributes to <html>. We intentionally DO NOT touch
 * document.body.style here — the body picks up its colours via the
 * `--bg` / `--text` CSS variables which the [data-theme="light"]
 * selector in globals.css already swaps. Mutating body inline styles
 * during hydration was the source of React error #418.
 */
function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-theme", resolved);
  if (resolved === "light") {
    html.classList.remove("dark");
    html.classList.add("light");
  } else {
    html.classList.remove("light");
    html.classList.add("dark");
  }
  // Update meta theme-color so the iOS / Android browser chrome matches.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "light" ? "#f8fafc" : "#0a0a0f");
  }
}

/**
 * Inline script that runs SYNCHRONOUSLY in <head> before React hydrates.
 * Reads the stored theme (or system preference if "system" / unset) and
 * writes the matching `data-theme` attribute + `light`/`dark` class on
 * <html>. This makes the SSR markup and the first client render agree,
 * eliminating React error #418.
 *
 * Render via `<ThemeBootstrapScript />` inside <head> in the root layout.
 */
export function ThemeBootstrapScript() {
  // Build the script inline — single line, no template-literal interpolation
  // of variables that could escape the string. STORAGE_KEY is hardcoded.
  const code = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var m=(s==='light'||s==='dark'||s==='system')?s:'dark';var r=m==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;var h=document.documentElement;h.setAttribute('data-theme',r);if(r==='light'){h.classList.remove('dark');h.classList.add('light');}else{h.classList.remove('light');h.classList.add('dark');}var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute('content',r==='light'?'#f8fafc':'#0a0a0f');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read whatever the bootstrap script already applied so React state
  // matches the live DOM from the first render. Falls back to "dark" on
  // the server (where document doesn't exist) — that's also the default
  // SSR class on <html> so the server-rendered markup matches.
  const initial = readInitialMode();
  const [mode, setModeState] = useState<ThemeMode>(initial.mode);
  const [resolved, setResolved] = useState<"light" | "dark">(initial.resolved);

  // Listen for system preference changes (when mode = "system"). We
  // don't apply the theme on initial mount — the bootstrap script
  // already did that, and re-applying here would race React hydration.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const r = resolveTheme("system");
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try { localStorage.setItem(THEME_STORAGE_KEY, newMode); } catch { /* private mode etc. */ }
    const r = resolveTheme(newMode);
    setResolved(r);
    applyTheme(r);
  }, []);

  return (
    <ThemeCtx.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}

function readInitialMode(): { mode: ThemeMode; resolved: "light" | "dark" } {
  if (typeof document === "undefined") {
    // Server render — match the SSR <html className="dark"> default.
    return { mode: "dark", resolved: "dark" };
  }
  let stored: ThemeMode = "dark";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
  } catch {
    /* localStorage may be unavailable — keep default */
  }
  // The bootstrap script will have already set data-theme on <html>;
  // trust that as the resolved value rather than recomputing.
  const liveResolved = document.documentElement.getAttribute("data-theme");
  const resolved: "light" | "dark" =
    liveResolved === "light" ? "light" :
    liveResolved === "dark" ? "dark" :
    resolveTheme(stored);
  return { mode: stored, resolved };
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
