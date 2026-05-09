"use client";

// ---------------------------------------------------------------------------
// DebugBanner — surfaces silent backend failures the user would otherwise
// only feel as "the app feels weird".
//
// The story it solves: today's incident (2026-05-09). Schema drift made
// /api/auth/me 500 and AuthContext silently fell through to /onboarding.
// Without this banner the user's only signal is "everything is gone." With
// it, we'd have shown "Auth API failed (P2022) — schema drift, run
// `prisma migrate deploy`" in the corner the moment they hit the dashboard.
//
// Mechanism: monkey-patches window.fetch. Any non-2xx hop on a same-origin
// `/api/...` URL pushes a structured row into a small in-memory queue. The
// banner renders the most recent error (with the API hint payload if the
// route returned one). Click to dismiss. Disappears after 30s.
//
// Production-safe: errors are only counted, never re-thrown. If the queue
// fills past 8 entries we drop the oldest. localStorage'd off-switch
// `hippo-debug-banner=off` for users / staff who want it muted.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";

interface ApiError {
  url: string;
  method: string;
  status: number;
  hint?: string;
  code?: string;
  message?: string;
  ts: number;
}

const QUEUE_KEY = "hippo-debug-queue";
const OFF_KEY = "hippo-debug-banner";
const FADE_MS = 30_000;

let installed = false;
const queue: ApiError[] = [];
const subs = new Set<(e: ApiError | null) => void>();

function broadcast() {
  const latest = queue[queue.length - 1] ?? null;
  for (const fn of subs) fn(latest);
}

function pushError(e: ApiError) {
  queue.push(e);
  if (queue.length > 8) queue.shift();
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore */ }
  broadcast();
}

function installFetchWatcher() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    let res: Response;
    try {
      res = await original(...args);
    } catch (err) {
      if (url.startsWith("/api/")) {
        pushError({
          url,
          method,
          status: 0,
          message: err instanceof Error ? err.message : "Network error",
          ts: Date.now(),
        });
      }
      throw err;
    }
    // Only watch same-origin /api/* hops; ignore the noise of analytics or
    // 3rd-party CDN failures.
    if (url.startsWith("/api/") && !res.ok) {
      // Clone before reading body — caller may still consume the original.
      let body: { error?: string; code?: string; hint?: string } = {};
      try {
        body = await res.clone().json();
      } catch { /* non-JSON 500 */ }
      pushError({
        url,
        method,
        status: res.status,
        message: body.error,
        code: body.code,
        hint: body.hint,
        ts: Date.now(),
      });
    }
    return res;
  };
}

export function DebugBanner() {
  const [latest, setLatest] = useState<ApiError | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(OFF_KEY) === "off") setMuted(true);
    } catch { /* ignore */ }
    installFetchWatcher();
    const handler = (e: ApiError | null) => setLatest(e);
    subs.add(handler);
    return () => { subs.delete(handler); };
  }, []);

  // Auto-hide after FADE_MS so a stale failure doesn't camp the screen.
  useEffect(() => {
    if (!latest) return;
    const timer = setTimeout(() => setLatest(null), FADE_MS);
    return () => clearTimeout(timer);
  }, [latest]);

  const dismiss = useCallback(() => setLatest(null), []);
  const muteForever = useCallback(() => {
    try { localStorage.setItem(OFF_KEY, "off"); } catch {}
    setMuted(true);
  }, []);

  if (!latest || muted) return null;

  const code = latest.code ? ` · ${latest.code}` : "";
  const headline =
    latest.status === 0
      ? `Network error · ${latest.method} ${shortUrl(latest.url)}`
      : `API ${latest.status}${code} · ${latest.method} ${shortUrl(latest.url)}`;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 99_999,
        maxWidth: 360,
        padding: "10px 12px",
        background: "rgba(220,38,38,0.96)",
        color: "#fff",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{headline}</div>
      {latest.hint && (
        <div style={{ opacity: 0.92, marginBottom: 4 }}>{latest.hint}</div>
      )}
      {latest.message && !latest.hint && (
        <div style={{ opacity: 0.85, marginBottom: 4, wordBreak: "break-word" }}>
          {latest.message.slice(0, 220)}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={dismiss}
          style={btnStyle}
        >
          Dismiss
        </button>
        <button
          onClick={muteForever}
          style={{ ...btnStyle, opacity: 0.75 }}
          title="Persist a localStorage flag — clear it from devtools to re-enable."
        >
          Mute
        </button>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "4px 8px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 11,
  fontFamily: "inherit",
  cursor: "pointer",
} as const;

function shortUrl(u: string): string {
  // Strip query string + hide deep paths so the banner stays compact
  const clean = u.split("?")[0];
  if (clean.length <= 36) return clean;
  return clean.slice(0, 16) + "…" + clean.slice(-18);
}
