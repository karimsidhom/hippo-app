"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionInstance,
} from "@/lib/speech/recognition";

// ---------------------------------------------------------------------------
// VoiceTextarea
//
// A textarea with a microphone button in the corner. Tapping the mic starts
// the Web Speech API; interim transcripts are appended to the textarea as
// they come in, and the user can keep typing at the same time. Tapping the
// mic again (or stopping speech) ends the session.
//
// Graceful degradation: browsers that do not support the API (Firefox,
// older Safari, non-HTTPS) simply render a normal textarea — no mic button,
// no error, no explanation pop-up.
//
// This component is intentionally UI-agnostic about what the transcript
// means. It is reused across the debrief flow, voice case logging, and any
// future voice-driven text field.
// ---------------------------------------------------------------------------

export interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  /** Optional className to override styles on the outer wrapper. */
  className?: string;
  /** Optional style override for the textarea itself. */
  textareaStyle?: React.CSSProperties;
  /** Auto-focus the textarea on mount. */
  autoFocus?: boolean;
  /** Called with (event) when the user presses a key — lets parents wire Cmd+Enter etc. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Hide the mic entirely, even if supported — for consumers that only want text. */
  forceTextOnly?: boolean;
}

export function VoiceTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  className,
  textareaStyle,
  autoFocus,
  onKeyDown,
  forceTextOnly,
}: VoiceTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a live ref to the recognition instance so handlers from closed-over
  // callbacks can .stop() cleanly on unmount or state change.
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Snapshot of the value at the moment the user tapped the mic. New speech
  // results are appended to THIS value, not to the (mutable) `value` prop,
  // so that interim re-renders don't duplicate recognized words.
  const baseValueRef = useRef<string>("");

  // Parallel MediaRecorder — captures raw audio while Web Speech gives us a
  // live preview. On stop, the raw audio is sent to Gemini for a much more
  // accurate transcription of medical terminology, which replaces the
  // Web-Speech result. Web Speech is still used for the live interim text.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [polishing, setPolishing] = useState(false);

  const supported = useMemo(() => {
    if (forceTextOnly) return false;
    return getSpeechRecognitionCtor() !== null;
  }, [forceTextOnly]);

  // Autofocus — wait one frame so the element is mounted.
  useEffect(() => {
    if (!autoFocus) return;
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [autoFocus]);

  // Stop any in-flight recognition when the component unmounts.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startMediaRecorder = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      // Pick the most compatible mime type — Chrome prefers webm/opus, Safari mp4.
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const mimeType = mimeCandidates.find(
        (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      // If mic access is denied we still have Web Speech — no error shown.
    }
  };

  const stopMediaRecorderAndPolish = async (): Promise<void> => {
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (!recorder) return;
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try { recorder.stop(); } catch { resolve(); }
    });
    // Release the mic immediately (visible indicator in the OS goes away).
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];
    if (chunks.length === 0) return;
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
    // Too small to bother — Gemini audio needs some signal.
    if (blob.size < 2000) return;

    try {
      setPolishing(true);
      const res = await fetch("/api/dictation/transcribe", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": blob.type },
        body: blob,
      });
      if (!res.ok) return;
      const { text } = (await res.json()) as { text?: string };
      if (!text) return;
      // Replace the Web-Speech preview with the Gemini result. Preserve the
      // text that was already in the textarea before the mic opened.
      const preMic = baseValueRef.current.replace(/\s+$/, "");
      const joined = preMic ? `${preMic}${preMic.endsWith(".") || preMic.endsWith("?") ? " " : ". "}${text}` : text;
      onChange(joined);
    } catch {
      // Fail silently — Web Speech's result is already in the textarea.
    } finally {
      setPolishing(false);
    }
  };

  const start = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    baseValueRef.current = value.trimEnd();
    // Kick off audio capture in parallel — Gemini will polish it on stop.
    void startMediaRecorder();

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      // Accumulate both final and interim results, but only treat finals as
      // committed text — interim is a live preview that gets overwritten.
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interimChunk += text;
        }
      }

      // Commit finals to the base so the next frame's interim preview starts
      // from the right place.
      if (finalChunk) {
        baseValueRef.current = joinTranscript(
          baseValueRef.current,
          finalChunk.trim(),
        );
      }

      const live = interimChunk.trim()
        ? joinTranscript(baseValueRef.current, interimChunk.trim())
        : baseValueRef.current;

      onChange(live);
    };

    rec.onerror = (event) => {
      // "no-speech" and "aborted" are routine — don't treat them as errors.
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(`Voice input error: ${event.error}`);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (err) {
      setError(
        `Could not start voice input: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    // Fire-and-forget: upload the captured audio for Gemini polish.
    void stopMediaRecorderAndPolish();
  };

  const toggle = () => (listening ? stop() : start());

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%" }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          fontFamily: "inherit",
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--text)",
          background: "var(--glass-lo)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: supported ? "12px 44px 12px 12px" : 12,
          resize: "vertical",
          outline: "none",
          ...(textareaStyle ?? {}),
        }}
      />

      {supported && (
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          title={listening ? "Stop voice input" : "Dictate"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 6,
            background: listening
              ? "rgba(220,38,38,0.18)"
              : "var(--glass-mid)",
            border: `1px solid ${
              listening
                ? "rgba(220,38,38,0.45)"
                : "var(--border-glass)"
            }`,
            color: listening ? "#fca5a5" : "var(--text-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "background .15s, color .15s, border-color .15s",
          }}
        >
          {listening ? <Square size={12} /> : polishing ? <Mic size={14} style={{ opacity: 0.5 }} /> : <Mic size={14} />}
          {listening && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: -3,
                borderRadius: 9,
                border: "1px solid rgba(220,38,38,0.4)",
                animation: "pulse 1.4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
        </button>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: "#fca5a5",
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      {/* Pulse keyframes — scoped globally but only active while the mic is
          live. Safe to inject repeatedly because the rule is idempotent. */}
      <style>{`
        @keyframes pulse {
          0%   { opacity: 0.9; transform: scale(1); }
          50%  { opacity: 0.35; transform: scale(1.12); }
          100% { opacity: 0.9; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Append a new transcript chunk to an existing base, inserting a space
 * between them unless the base ends with a sentence terminator.
 */
function joinTranscript(base: string, chunk: string): string {
  if (!chunk) return base;
  if (!base) return chunk;
  const needsSpace = !/[\s.!?,:;-]$/.test(base);
  return needsSpace ? `${base} ${chunk}` : `${base}${chunk}`;
}
