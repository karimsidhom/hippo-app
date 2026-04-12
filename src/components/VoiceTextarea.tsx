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

  const start = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    baseValueRef.current = value.trimEnd();

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
          {listening ? <Square size={12} /> : <Mic size={14} />}
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
