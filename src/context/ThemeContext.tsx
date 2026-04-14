"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Theme Context
// Manages light/dark mode with localStorage persistence and system preference
// detection. Applies via data-theme attribute on <html>.
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

const STORAGE_KEY = "hippo-theme";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return getSystemPreference();
  return mode;
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-theme", resolved);
  // Update body class for any Tailwind-dependent styles
  if (resolved === "light") {
    html.classList.remove("dark");
    html.classList.add("light");
    document.body.style.background = "#f8fafc";
    document.body.style.color = "#0f172a";
  } else {
    html.classList.remove("light");
    html.classList.add("dark");
    document.body.style.background = "#0a0a0f";
    document.body.style.color = "#f1f5f9";
  }
  // Update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "light" ? "#f8fafc" : "#0a0a0f");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored && ["light", "dark", "system"].includes(stored) ? stored : "dark";
    setModeState(initial);
    const r = resolveTheme(initial);
    setResolved(r);
    applyTheme(r);
  }, []);

  // Listen for system preference changes (when mode = "system")
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
    localStorage.setItem(STORAGE_KEY, newMode);
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

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
