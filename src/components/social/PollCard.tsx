"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { PollOption } from "@/lib/types";

// In-card poll renderer for postType === "poll". Loads current tally on mount;
// optimistically updates on vote. Shows % bars + vote counts; once voted, the
// viewer's choice is marked with a check. Results are always visible
// (no "show after voting" gating — surgical discussions are the whole point).

interface Props {
  pearlId: string;
  options: PollOption[];
}

interface Tally {
  byOption: Record<string, number>;
  total: number;
  myVote: string | null;
  byPgy?: Record<string, Record<string, number>>;
}

export function PollCard({ pearlId, options }: Props) {
  const [tally, setTally] = useState<Tally>({ byOption: {}, total: 0, myVote: null });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pearls/${pearlId}/vote`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setTally({
          byOption: data.byOption ?? {},
          total: data.total ?? 0,
          myVote: data.myVote ?? null,
          byPgy: data.byPgy,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pearlId]);

  const vote = async (optionId: string) => {
    if (busy) return;
    setBusy(optionId);
    // Optimistic: shift the count by 1 (subtract previous if any)
    setTally((t) => {
      const next: Record<string, number> = { ...t.byOption };
      if (t.myVote && t.myVote !== optionId) {
        next[t.myVote] = Math.max(0, (next[t.myVote] ?? 0) - 1);
      }
      const isNew = t.myVote !== optionId;
      next[optionId] = (next[optionId] ?? 0) + (isNew ? 1 : 0);
      return {
        ...t,
        byOption: next,
        total: isNew && !t.myVote ? t.total + 1 : t.total,
        myVote: optionId,
      };
    });
    try {
      const res = await fetch(`/api/pearls/${pearlId}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) throw new Error("vote rejected");
      const data = await res.json();
      setTally({
        byOption: data.byOption ?? {},
        total: data.total ?? 0,
        myVote: data.myVote ?? optionId,
        byPgy: data.byPgy,
      });
    } catch {
      // Leave optimistic state; next mount reloads truth.
    } finally {
      setBusy(null);
    }
  };

  const totalNonZero = Math.max(1, tally.total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      {options.map((o) => {
        const count = tally.byOption[o.id] ?? 0;
        const pct = Math.round((count / totalNonZero) * 100);
        const mine = tally.myVote === o.id;
        return (
          <button
            key={o.id}
            onClick={() => vote(o.id)}
            disabled={busy !== null}
            style={{
              position: "relative",
              textAlign: "left",
              padding: "10px 12px",
              background: mine ? "rgba(14,165,233,0.08)" : "var(--surface2)",
              border: `1px solid ${mine ? "rgba(14,165,233,0.45)" : "var(--border)"}`,
              borderRadius: 8,
              color: "var(--text)",
              fontFamily: "'Geist', sans-serif",
              fontSize: 13,
              cursor: busy ? "wait" : "pointer",
              overflow: "hidden",
              transition: "background .12s",
            }}
          >
            {/* Fill bar — painted behind the label */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                width: `${pct}%`,
                background: mine
                  ? "rgba(14,165,233,0.15)"
                  : "rgba(100,116,139,0.10)",
                transition: "width .4s cubic-bezier(.16,1,.3,1)",
              }}
            />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
              {mine && <Check size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />}
              <span style={{ flex: 1, fontWeight: mine ? 600 : 500 }}>{o.label}</span>
              <span style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 12,
                color: "var(--text-2)",
                flexShrink: 0,
              }}>
                {pct}% · {count}
              </span>
            </div>
          </button>
        );
      })}
      <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
        {tally.total} vote{tally.total === 1 ? "" : "s"}
        {tally.byPgy && Object.keys(tally.byPgy).length > 0 && " \u00b7 Results broken down by PGY"}
      </div>
    </div>
  );
}
