"use client";

import { useState } from "react";
import type { ReactionKind } from "@/lib/types";

// Structured reaction set. The glyph is a single emoji; the short label
// appears below (not as alt text) because accessibility tooling reads the
// emoji itself. Kept small and surgeon-native on purpose — this is the
// taxonomy that drives feed ranking.
const REACTIONS: {
  kind: ReactionKind;
  glyph: string;
  label: string;
  color: string;
}[] = [
  { kind: "technique", glyph: "\uD83D\uDD2A", label: "Clean", color: "#0EA5E9" }, // 🔪
  { kind: "saved",     glyph: "\uD83C\uDFAF", label: "Saved me", color: "#10B981" }, // 🎯
  { kind: "teaching",  glyph: "\uD83E\uDDE0", label: "Teaching", color: "#8B5CF6" }, // 🧠
  { kind: "warning",   glyph: "\uD83D\uDEA8", label: "Watch out", color: "#F59E0B" }, // 🚨
  { kind: "seen",      glyph: "\uD83D\uDC40", label: "Seen it",  color: "#64748B" }, // 👀
];

interface Props {
  pearlId: string;
  initialMine?: ReactionKind[];
  initialCount?: number;
  /** If you have a per-kind breakdown already (from GET /reactions), pass it. */
  initialKinds?: Partial<Record<ReactionKind, number>>;
  size?: "sm" | "md";
}

export function ReactionBar({ pearlId, initialMine = [], initialCount = 0, initialKinds, size = "md" }: Props) {
  const [mine, setMine] = useState<Set<ReactionKind>>(new Set(initialMine));
  const [kinds, setKinds] = useState<Partial<Record<ReactionKind, number>>>(initialKinds ?? {});
  const [total, setTotal] = useState<number>(initialCount);
  const [pending, setPending] = useState<ReactionKind | null>(null);

  const toggle = async (kind: ReactionKind) => {
    if (pending) return;
    const had = mine.has(kind);
    // Optimistic update — rolled back if the server disagrees.
    const nextMine = new Set(mine);
    had ? nextMine.delete(kind) : nextMine.add(kind);
    setMine(nextMine);
    setKinds((k) => ({ ...k, [kind]: Math.max(0, (k[kind] ?? 0) + (had ? -1 : 1)) }));
    setTotal((t) => Math.max(0, t + (had ? -1 : 1)));
    setPending(kind);
    try {
      const res = await fetch(
        `/api/pearls/${pearlId}/reactions${had ? `?kind=${kind}` : ""}`,
        {
          method: had ? "DELETE" : "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: had ? undefined : JSON.stringify({ kind }),
        },
      );
      if (!res.ok) throw new Error("server rejected");
      const data = (await res.json()) as { total: number; kinds: Record<ReactionKind, number> };
      setTotal(data.total);
      setKinds(data.kinds);
    } catch {
      // Rollback
      setMine((prev) => {
        const rolled = new Set(prev);
        had ? rolled.add(kind) : rolled.delete(kind);
        return rolled;
      });
      setKinds((k) => ({ ...k, [kind]: Math.max(0, (k[kind] ?? 0) + (had ? 1 : -1)) }));
      setTotal((t) => Math.max(0, t + (had ? 1 : -1)));
    } finally {
      setPending(null);
    }
  };

  const pad = size === "sm" ? "3px 6px" : "4px 8px";
  const fs = size === "sm" ? 11 : 12;

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {REACTIONS.map((r) => {
        const selected = mine.has(r.kind);
        const count = kinds[r.kind] ?? 0;
        return (
          <button
            key={r.kind}
            onClick={() => toggle(r.kind)}
            disabled={pending === r.kind}
            aria-label={`${r.label} (${count})`}
            title={r.label}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: pad,
              fontFamily: "'Geist', sans-serif",
              fontSize: fs,
              background: selected ? `${r.color}18` : "var(--surface2)",
              border: `1px solid ${selected ? r.color + "55" : "var(--border)"}`,
              color: selected ? r.color : "var(--text-2)",
              borderRadius: 999,
              cursor: pending === r.kind ? "wait" : "pointer",
              transition: "background .12s, border-color .12s, color .12s, transform .1s",
              transform: selected ? "scale(1.02)" : "scale(1)",
            }}
          >
            <span aria-hidden style={{ fontSize: fs + 1, lineHeight: 1 }}>{r.glyph}</span>
            {count > 0 && (
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: fs - 1 }}>{count}</span>
            )}
          </button>
        );
      })}
      {total > 0 && (
        <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 2 }}>
          {total} reaction{total === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
