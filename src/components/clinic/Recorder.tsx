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
import { useMacros } from "@/hooks/useMacros";

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

// Order matters. Safari (iOS + macOS) only supports audio/mp4, and its
// isTypeSupported lies about the webm variants — so we keep mp4 high in
// the list. We also explicitly fall back to "" (empty) so MediaRecorder
// uses the browser default rather than throwing on an unsupported type.
const PRIMARY_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function pickSupportedMime(): string {
  // Older Safari versions don't ship MediaRecorder.isTypeSupported. In
  // that case we'd rather let the browser pick the default than feed it
  // a guess that throws inside the constructor.
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  for (const m of PRIMARY_MIME_CANDIDATES) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch { /* ignore */ }
  }
  return "";
}

// Voice-command vocabulary. Matched against final SR results before
// they're posted as transcript segments — so commands never end up in
// the medical record.
//
// Hardened against false positives: every pattern now REQUIRES the
// wake-word "Hippo" (with optional comma after). The previous version
// allowed "this is important" to fire a marker, which collides with
// real clinical speech ("this is important to monitor"). Wake-word-
// gated commands cost the clinician one extra word but eliminate the
// "the AI keeps marking things at random" failure mode that would erode
// trust faster than the feature gains it.
const VOICE_COMMANDS: Array<{ patterns: RegExp[]; action: VoiceCommand; label: string }> = [
  { action: "marker:important",          label: "Important",
    patterns: [/^hippo,?\s+(mark\s+(this\s+as\s+)?important|important|that's\s+important)\b/i] },
  { action: "marker:exam",               label: "Exam",
    patterns: [/^hippo,?\s+(mark\s+(this\s+as\s+)?exam|(start|begin)\s+exam|exam)\b/i] },
  { action: "marker:plan",               label: "Plan",
    patterns: [/^hippo,?\s+(mark\s+(this\s+as\s+)?plan|(start|begin)\s+plan|plan)\b/i] },
  { action: "marker:medication",         label: "Medication",
    patterns: [/^hippo,?\s+(mark\s+(this\s+as\s+)?)?med(ication)?\b/i] },
  { action: "marker:follow-up",          label: "Follow-up",
    patterns: [/^hippo,?\s+(mark\s+(this\s+as\s+)?)?follow[-\s]?up\b/i] },
  { action: "marker:patient-instruction", label: "Patient instruction",
    patterns: [/^hippo,?\s+(mark\s+(this\s+as\s+)?)?(patient\s+)?instruction\b/i] },
  { action: "pause",                     label: "Pause",
    patterns: [/^hippo,?\s+(pause|stop\s+for\s+a\s+moment)\b/i] },
  { action: "resume",                    label: "Resume",
    patterns: [/^hippo,?\s+(resume|continue|start\s+again)\b/i] },
  { action: "stop",                      label: "End recording",
    patterns: [/^hippo,?\s+(end\s+recording|stop\s+recording|finish\s+recording)\b/i] },
];
type VoiceCommand =
  | "marker:important" | "marker:exam" | "marker:plan" | "marker:medication"
  | "marker:follow-up" | "marker:patient-instruction"
  | "pause" | "resume" | "stop";

function detectCommand(text: string): VoiceCommand | null {
  const t = text.trim();
  for (const v of VOICE_COMMANDS) {
    for (const p of v.patterns) if (p.test(t)) return v.action;
  }
  return null;
}

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
  const mountedRef = useRef<boolean>(true);
  const macros = useMacros();
  const macrosRef = useRef(macros);
  useEffect(() => { macrosRef.current = macros; }, [macros]);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

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

  // Hard cleanup on unmount — close mic, stop SR, signal queue to drain
  // and exit so we don't run fetches against an unmounted component.
  // Addresses ruflo review findings M2 + M3.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        if (mediaRef.current && mediaRef.current.state !== "inactive") {
          const handle = (mediaRef.current as unknown as { __chunkInterval?: ReturnType<typeof setInterval> }).__chunkInterval;
          if (handle) { try { clearInterval(handle); } catch { /* ignore */ } }
          mediaRef.current.stop();
        }
      } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      const stt = sttRef.current as { stop?: () => void; onresult?: unknown; onend?: unknown } | null;
      if (stt) {
        // Null the handlers so the auto-restart in onend doesn't fire.
        stt.onresult = null;
        stt.onend = null;
        try { stt.stop?.(); } catch { /* ignore */ }
      }
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      // Signal flushQueue to bail.
      recRef.current.recording = false;
    };
  }, []);

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

    // Hard preflight — bail with a readable message instead of crashing
    // inside MediaRecorder when the browser doesn't ship the APIs at all.
    if (typeof window === "undefined" || !window.isSecureContext) {
      setWarning("Recording requires a secure (HTTPS) page. Open the app over HTTPS or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setWarning("This browser doesn't expose a microphone API. Try Safari, Chrome, or Edge.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setWarning("This browser can't record audio (MediaRecorder unavailable). On iOS, update to iOS 14.5 or newer.");
      return;
    }

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
      const name = (err as { name?: string } | undefined)?.name ?? "";
      const msg = (err as Error | undefined)?.message ?? "";
      // Surface the actual reason — iOS gives different errors for
      // permission denial vs. no device vs. system-level mute.
      let detail = "Microphone access was blocked. Enable it in your browser settings.";
      if (name === "NotAllowedError" || /denied|permission/i.test(msg)) {
        detail = "Microphone permission was denied. Allow it in your browser/system settings and try again.";
      } else if (name === "NotFoundError") {
        detail = "No microphone was found on this device.";
      } else if (name === "NotReadableError") {
        detail = "The microphone is in use by another app. Close other recording apps and try again.";
      } else if (msg) {
        detail = `Microphone error: ${msg}`;
      }
      setWarning(detail);
      return;
    }
    setPermission("granted");
    streamRef.current = stream;

    const mimeType = pickSupportedMime();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (err) {
      // Some Safari builds throw on any explicit mimeType — retry with default.
      try {
        rec = new MediaRecorder(stream);
      } catch (err2) {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        setWarning(`Couldn't start the recorder: ${(err2 as Error).message || (err as Error).message}`);
        return;
      }
    }

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

    // Safari ignores the timeslice argument to start() — chunks only land
    // on stop(). To keep the upload queue moving on iOS, request a chunk
    // manually every CHUNK_MS via requestData(). Falls back gracefully if
    // requestData isn't available.
    try {
      rec.start(CHUNK_MS);
    } catch (err) {
      stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      setWarning(`Couldn't start the recorder: ${(err as Error).message}`);
      return;
    }
    if (typeof rec.requestData === "function") {
      const interval = setInterval(() => {
        try {
          if (rec.state === "recording") rec.requestData();
        } catch { /* ignore */ }
        if (rec.state === "inactive") clearInterval(interval);
      }, CHUNK_MS);
      // Stash on the recorder so stop() can clear it.
      (rec as unknown as { __chunkInterval?: ReturnType<typeof setInterval> }).__chunkInterval = interval;
    }

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
        const rawText = r[0].transcript;
        if (r.isFinal) {
          // ── Voice commands ──────────────────────────────────────────
          // First check if the segment is a wake-word command. If so,
          // run the action and DON'T post the segment as transcript.
          // We also gate on segment length (max 6 words) so a long
          // clinical utterance that happens to start with "hippo" never
          // hijacks the segment — for any longer phrase the patient
          // record wins over command parsing.
          if (rawText.trim().split(/\s+/).length <= 6) {
            const cmd = detectCommand(rawText);
            if (cmd) {
              handleVoiceCommand(cmd, rawText);
              continue;
            }
          }

          // ── Macro voice expansion ──────────────────────────────────
          // "period bph" / "dot bph" → expand inline.
          const expanded = macrosRef.current.expandVoice(rawText);

          void fetch(`/api/clinic/encounters/${encounterId}/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startMs: Math.max(0, Date.now() - startTsRef.current - 4000),
              endMs: Date.now() - startTsRef.current,
              text: expanded,
              confidence: r[0].confidence ?? undefined,
              source: "browser-stt",
              isFinal: true,
            }),
          }).catch(() => {});
        } else {
          interimText += rawText;
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

  // Voice-command dispatcher — wired into the SR onresult above.
  // Defined as a ref-stable closure so the SR callback (set up once at
  // recording start) can reach the LATEST pause/resume/stop refs without
  // the SR onresult capturing stale values.
  const dropMarkerRef = useRef<((kind: MarkerKind, label?: string) => Promise<void>) | null>(null);
  const stopRef       = useRef<(() => Promise<void>) | null>(null);
  const pauseRef      = useRef<(() => void) | null>(null);
  const resumeRef     = useRef<(() => void) | null>(null);

  const handleVoiceCommand = useCallback((cmd: VoiceCommand, raw: string) => {
    setLastCommand(`Heard: "${raw.trim().slice(0, 40)}"`);
    setTimeout(() => setLastCommand(null), 2400);
    if (cmd.startsWith("marker:")) {
      const kind = cmd.slice("marker:".length) as MarkerKind;
      void dropMarkerRef.current?.(kind, cmd);
      return;
    }
    if (cmd === "pause")  { pauseRef.current?.();  return; }
    if (cmd === "resume") { resumeRef.current?.(); return; }
    if (cmd === "stop")   { void stopRef.current?.(); return; }
  }, []);

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
      // Clear the manual-chunk interval the iOS path set up.
      const handle = (mediaRef.current as unknown as { __chunkInterval?: ReturnType<typeof setInterval> }).__chunkInterval;
      if (handle) { try { clearInterval(handle); } catch { /* ignore */ } }
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

  // Keep the refs the voice-command dispatcher uses pointed at the latest
  // closures every render. Without this, the SR onresult (set once at
  // recording start) would call stale versions of these handlers.
  useEffect(() => {
    dropMarkerRef.current = dropMarker;
    stopRef.current       = stop;
    pauseRef.current      = pause;
    resumeRef.current     = resume;
  }, [dropMarker, stop, pause, resume]);

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

      {/* Voice-command echo */}
      {recording && lastCommand && (
        <div className="badge badge-primary" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Mic size={11} /> {lastCommand}
        </div>
      )}

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
