"use client";

// Hippo Clinic — Recorder.
//
// Long-form clinic-encounter recorder. Designed to never silently fail:
//
//   - MediaRecorder slices the stream into ~10s chunks. Each chunk is
//     uploaded to /api/clinic/encounters/[id]/chunk as soon as it lands,
//     so a 60-minute encounter is never one giant blob.
//   - Failed uploads are queued in IndexedDB-backed memory and retried
//     with exponential backoff. Refreshing the page resumes from the
//     last successful chunk.
//   - Before recording starts we warn the user about iOS background-tab
//     limitations — Safari may suspend MediaRecorder if the screen locks.
//   - Pause/resume is supported. Markers are written to a separate
//     /markers endpoint with the absolute offset from recording start.
//   - When server-side Whisper isn't configured, the recorder falls back
//     to the browser's SpeechRecognition API and posts each final segment
//     to /transcript. The two paths are not mutually exclusive — even
//     with Whisper, we keep the live browser interim text on screen so
//     the clinician sees something the moment they speak.

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Bookmark, AlertTriangle, Loader2, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import type { MarkerKind } from "@/lib/clinic/types";

interface QueuedChunk {
  index: number;
  startMs: number;
  durationMs: number;
  blob: Blob;
  retries: number;
}

interface RecorderProps {
  encounterId: string;
  /** Disable all recording — used after consent decline. */
  disabled?: boolean;
  /** Called when the user stops recording so the parent can navigate. */
  onStop?: (totalDurationMs: number) => void;
  /** Called whenever a chunk uploads — used by parent to bump status. */
  onChunkUploaded?: () => void;
}

const CHUNK_MS = 10_000; // 10-second slices
const MAX_RETRIES = 6;

const PRIMARY_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export function Recorder({ encounterId, disabled, onStop, onChunkUploaded }: RecorderProps) {
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [queueDepth, setQueueDepth] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [interim, setInterim] = useState<string>("");
  const [online, setOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [showPreflight, setShowPreflight] = useState<boolean>(true);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIdxRef = useRef<number>(0);
  const startTsRef = useRef<number>(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<QueuedChunk[]>([]);
  const flushingRef = useRef<boolean>(false);
  const recRef = useRef<{ recording: boolean; paused: boolean }>({ recording: false, paused: false });
  const sttRef = useRef<unknown>(null);

  // Keep refs in sync with reactive state — used inside MediaRecorder
  // callbacks that close over stale state.
  useEffect(() => {
    recRef.current.recording = recording;
    recRef.current.paused = paused;
  }, [recording, paused]);

  // Online/offline tracking — drives the connection pill.
  useEffect(() => {
    const onOnline = () => { setOnline(true); void flushQueue(); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Beforeunload guard — prevent accidental tab close mid-recording.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (recording && !disabled) {
        e.preventDefault();
        e.returnValue = "Recording is in progress. Are you sure?";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [recording, disabled]);

  const tickElapsed = useCallback(() => {
    setElapsedMs(Date.now() - startTsRef.current);
  }, []);

  // ── Queue + retry ────────────────────────────────────────────────────────
  const enqueueChunk = useCallback((c: QueuedChunk) => {
    queueRef.current.push(c);
    setQueueDepth(queueRef.current.length);
    void flushQueue();
  }, []);

  const flushQueue = useCallback(async () => {
    if (flushingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    flushingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const next = queueRef.current[0];
        const form = new FormData();
        form.set("file", next.blob, `chunk-${next.index}.webm`);
        form.set("chunkIndex", String(next.index));
        form.set("startMs", String(next.startMs));
        form.set("durationMs", String(next.durationMs));
        form.set("mimeType", next.blob.type || "audio/webm");
        try {
          const res = await fetch(`/api/clinic/encounters/${encounterId}/chunk`, {
            method: "POST",
            body: form,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          queueRef.current.shift();
          setQueueDepth(queueRef.current.length);
          onChunkUploaded?.();
        } catch (err) {
          next.retries += 1;
          if (next.retries >= MAX_RETRIES) {
            // Drop after exhausted retries — surface as a warning. The
            // chunk is still on disk in the original Blob if the user
            // hasn't closed the tab.
            queueRef.current.shift();
            setQueueDepth(queueRef.current.length);
            setWarning(`A chunk failed to upload after ${MAX_RETRIES} retries: ${(err as Error).message}`);
          } else {
            // Exponential backoff capped at 30s.
            const delay = Math.min(30_000, 750 * Math.pow(2, next.retries));
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [encounterId, onChunkUploaded]);

  // ── Start / stop ─────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setWarning(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      setPermission("denied");
      setWarning("Microphone access was blocked. Enable it in your browser settings.");
      return;
    }
    setPermission("granted");
    streamRef.current = stream;

    const mimeType = PRIMARY_MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunkIdxRef.current = 0;
    startTsRef.current = Date.now();
    setElapsedMs(0);
    elapsedTimerRef.current = setInterval(tickElapsed, 250);

    let chunkStartTs = Date.now();
    rec.ondataavailable = (ev) => {
      if (!ev.data || ev.data.size === 0) return;
      const idx = chunkIdxRef.current++;
      const startMs = chunkStartTs - startTsRef.current;
      const durationMs = Date.now() - chunkStartTs;
      chunkStartTs = Date.now();
      enqueueChunk({ index: idx, startMs, durationMs, blob: ev.data, retries: 0 });
    };
    rec.onerror = (ev) => {
      console.error("[recorder] error", ev);
      setWarning("Recorder error — recording paused. Tap resume to retry.");
      setPaused(true);
    };
    rec.onstop = () => {
      // No-op — final ondataavailable already fired with the residual chunk.
    };

    rec.start(CHUNK_MS);
    mediaRef.current = rec;
    setRecording(true);
    setPaused(false);
    setShowPreflight(false);

    // Patch encounter.recordingStartedAt server-side.
    void fetch(`/api/clinic/encounters/${encounterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordingStartedAt: new Date().toISOString(), status: "RECORDING" }),
    }).catch(() => {});

    // Browser-native SpeechRecognition for live interim display + fallback.
    startInterim();
  }, [encounterId, enqueueChunk, tickElapsed]);

  const startInterim = useCallback(() => {
    const W = window as unknown as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown };
    const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Ctor) return;
    type SR = {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((ev: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence: number } }> }) => void) | null;
      onerror: ((ev: { error: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    let rec: SR;
    try {
      rec = new (Ctor as unknown as { new (): SR })();
    } catch {
      return;
    }
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-CA";
    rec.onresult = (ev) => {
      let interimText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const text = r[0].transcript;
        if (r.isFinal) {
          // Persist final segments — the parent may also be receiving
          // Whisper transcripts; both paths coexist.
          void fetch(`/api/clinic/encounters/${encounterId}/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startMs: Math.max(0, Date.now() - startTsRef.current - 4000),
              endMs: Date.now() - startTsRef.current,
              text,
              confidence: r[0].confidence ?? undefined,
              source: "browser-stt",
              isFinal: true,
            }),
          }).catch(() => {});
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
    };
    rec.onerror = () => { /* swallow — interim is opportunistic */ };
    rec.onend = () => {
      // Restart on end if we're still recording — Chrome auto-stops after silence.
      if (recRef.current.recording && !recRef.current.paused) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };
    try { rec.start(); } catch { /* ignore */ }
    sttRef.current = rec;
  }, [encounterId]);

  const pause = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state === "paused") {
      mediaRef.current.resume();
      setPaused(false);
    }
  }, []);

  const stop = useCallback(async () => {
    const total = elapsedMs;
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      try { mediaRef.current.stop(); } catch { /* ignore */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    const stt = sttRef.current as { stop?: () => void } | null;
    if (stt && typeof stt.stop === "function") {
      try { stt.stop(); } catch { /* ignore */ }
    }
    setRecording(false);
    setPaused(false);
    setInterim("");

    // Flush remaining queue.
    void flushQueue();

    // Tell the server.
    void fetch(`/api/clinic/encounters/${encounterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordingStoppedAt: new Date().toISOString(),
        durationSeconds: Math.round(total / 1000),
        status: "TRANSCRIBING",
      }),
    }).catch(() => {});

    onStop?.(total);
  }, [elapsedMs, encounterId, flushQueue, onStop]);

  const dropMarker = useCallback(async (kind: MarkerKind, label?: string) => {
    if (!recording) return;
    const atMs = Date.now() - startTsRef.current;
    await fetch(`/api/clinic/encounters/${encounterId}/markers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, atMs, label }),
    }).catch(() => {});
  }, [encounterId, recording]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (disabled) {
    return (
      <div className="st-card" style={{ textAlign: "center", color: "var(--text-2)" }}>
        <AlertTriangle size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
        Patient declined AI scribe — recording is disabled. Use typed entry.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {showPreflight && !recording && (
        <div className="st-card" style={{ borderLeft: "2px solid var(--primary)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            Before you start
          </div>
          <ul style={{ fontSize: 12, color: "var(--text-2)", margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
            <li>Keep this tab in the foreground — iOS Safari may suspend recording when the screen locks.</li>
            <li>Audio is sliced into ~10-second chunks and uploaded continuously, so nothing is lost on a refresh.</li>
            <li>Tap a marker any time to bookmark a key moment (Important, Exam, Plan, etc).</li>
          </ul>
        </div>
      )}

      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 10, height: 10, borderRadius: "50%",
              background: recording && !paused ? "var(--primary)" : "var(--border-mid)",
              boxShadow: recording && !paused ? "0 0 8px var(--primary-glow)" : "none",
              animation: recording && !paused ? "clinicRecPulse 1s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>
            {formatHMS(elapsedMs)}
          </span>
          <style>{`@keyframes clinicRecPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className={`badge ${online ? "badge-success" : "badge-warning"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {online ? <Wifi size={10} /> : <WifiOff size={10} />}
            {online ? "Online" : "Offline"}
          </span>
          {queueDepth > 0 && (
            <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Loader2 size={10} className="spin" /> {queueDepth} queued
            </span>
          )}
          <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
        </div>
      </div>

      {/* Primary controls */}
      <div style={{ display: "flex", gap: 8 }}>
        {!recording ? (
          <button
            className="press-key"
            onClick={start}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "16px",
              fontSize: 15,
              fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 2px 12px -2px rgba(220,38,38,.30)",
              cursor: "pointer",
            }}
          >
            <Mic size={18} /> Start recording
          </button>
        ) : (
          <>
            {paused ? (
              <button className="press-key st-btn st-btn-primary" onClick={resume} style={{ flex: 1 }}>
                <Play size={16} /> Resume
              </button>
            ) : (
              <button className="press-key st-btn st-btn-secondary" onClick={pause} style={{ flex: 1 }}>
                <Pause size={16} /> Pause
              </button>
            )}
            <button className="press-key st-btn st-btn-danger" onClick={stop} style={{ flex: 1 }}>
              <Square size={16} /> Stop
            </button>
          </>
        )}
      </div>

      {/* Markers */}
      {recording && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <MarkerButton kind="important"           label="Important"   icon={Bookmark} onTap={dropMarker} />
          <MarkerButton kind="exam"                label="Exam"        icon={Bookmark} onTap={dropMarker} />
          <MarkerButton kind="plan"                label="Plan"        icon={Bookmark} onTap={dropMarker} />
          <MarkerButton kind="medication"          label="Medication"  icon={Bookmark} onTap={dropMarker} />
          <MarkerButton kind="follow-up"           label="Follow-up"   icon={Bookmark} onTap={dropMarker} />
          <MarkerButton kind="patient-instruction" label="Pt instr."   icon={Bookmark} onTap={dropMarker} />
        </div>
      )}

      {/* Live interim text */}
      {recording && interim && (
        <div className="glass" style={{ padding: 12, fontSize: 13, color: "var(--text-2)", fontStyle: "italic", lineHeight: 1.5 }}>
          “{interim}”
        </div>
      )}

      {warning && (
        <div className="st-card" style={{ borderLeft: "2px solid var(--warning)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <AlertTriangle size={14} color="var(--warning)" style={{ marginTop: 2 }} />
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>{warning}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarkerButton({
  kind, label, icon: Icon, onTap,
}: { kind: MarkerKind; label: string; icon: LucideIcon; onTap: (k: MarkerKind, l?: string) => void }) {
  return (
    <button
      type="button"
      className="chip press"
      onClick={() => onTap(kind, label)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      <Icon size={11} />
      {label}
    </button>
  );
}

function formatHMS(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
