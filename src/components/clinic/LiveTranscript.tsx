"use client";

// Hippo Clinic — LiveTranscript.
//
// Renders the encounter transcript as it accumulates and subscribes to
// Supabase Realtime so the desktop sees segments arrive while the phone
// is still recording.
//
// Each segment shows its source (whisper / browser-stt / manual) so the
// clinician knows which path produced it. We never "clean up" or compact
// the transcript on the client — what was heard is what's shown.

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

interface TranscriptRow {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speaker: string | null;
  source: string;
  provenance: string;
  isFinal: boolean;
  createdAt: string;
}

export function LiveTranscript({
  encounterId,
  initial,
}: {
  encounterId: string;
  initial: TranscriptRow[];
}) {
  const [rows, setRows] = useState<TranscriptRow[]>(() => sortByStart(initial));
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to inserts on clinic_transcripts for this encounter.
  useEffect(() => {
    const supa = createClient();
    const channel = supa
      .channel(`clinic-transcripts:${encounterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clinic_transcripts",
          filter: `encounterId=eq.${encounterId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const r = mapRow(payload.new);
          if (!r) return;
          setRows((prev) => {
            if (prev.some((p) => p.id === r.id)) return prev;
            return sortByStart([...prev, r]);
          });
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(channel);
    };
  }, [encounterId]);

  // Auto-scroll to bottom on new content.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [rows.length]);

  const text = useMemo(() => rows.map((r) => r.text).join(" "), [rows]);

  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 32 }}>
        <div className="empty-title">No transcript yet</div>
        <div className="empty-text">Start recording, dictate, or paste a transcript to begin.</div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{
        maxHeight: 360,
        overflowY: "auto",
        background: "var(--surface)",
        border: "1px solid var(--border-mid)",
        borderRadius: "var(--r)",
        padding: 14,
        fontSize: 13,
        lineHeight: 1.6,
        color: "var(--text)",
      }}
    >
      {rows.map((r) => (
        <span key={r.id} title={`${r.source} · ${r.provenance}`}>
          {r.text}{" "}
        </span>
      ))}
      <div style={{ marginTop: 12, fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
        {rows.length} segment{rows.length === 1 ? "" : "s"} · {text.length} chars
      </div>
    </div>
  );
}

function sortByStart(rows: TranscriptRow[]): TranscriptRow[] {
  return [...rows].sort((a, b) => a.startMs - b.startMs || a.createdAt.localeCompare(b.createdAt));
}

function mapRow(raw: Record<string, unknown>): TranscriptRow | null {
  if (typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    startMs: Number(raw.startMs ?? 0),
    endMs: Number(raw.endMs ?? 0),
    text: String(raw.text ?? ""),
    speaker: (raw.speaker as string | null) ?? null,
    source: String(raw.source ?? "manual"),
    provenance: String(raw.provenance ?? "said"),
    isFinal: Boolean(raw.isFinal ?? true),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}
