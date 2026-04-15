"use client";

import { useState } from "react";
import { BadgeCheck, Award } from "lucide-react";
import type { UserRoleType } from "@/lib/types";

// Attending "co-sign" button + ribbon. Shown as:
//   - A small "Co-signed by N attending(s)" ribbon above the card footer when
//     endorseCount > 0.
//   - A subtle "Co-sign" CTA only if the current viewer is an attending/staff/PD.
//
// The ribbon is deliberately understated — we want the verified attending
// signal to read as trustworthy, not flashy.

const ENDORSER_ROLES: UserRoleType[] = ["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"];

interface Props {
  pearlId: string;
  initialCount: number;
  initialMine: boolean;
  viewerRoleType?: UserRoleType;
}

export function EndorsementRibbon({ pearlId, initialCount, initialMine, viewerRoleType }: Props) {
  const [count, setCount] = useState<number>(initialCount);
  const [mine, setMine] = useState<boolean>(initialMine);
  const [busy, setBusy] = useState(false);
  const canEndorse = !!viewerRoleType && ENDORSER_ROLES.includes(viewerRoleType);

  const toggle = async () => {
    if (busy || !canEndorse) return;
    const had = mine;
    setMine(!had);
    setCount((c) => Math.max(0, c + (had ? -1 : 1)));
    setBusy(true);
    try {
      const res = await fetch(`/api/pearls/${pearlId}/endorse`, {
        method: had ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("rejected");
      const data = (await res.json()) as { endorseCount: number };
      setCount(data.endorseCount);
    } catch {
      setMine(had);
      setCount((c) => Math.max(0, c + (had ? 1 : -1)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: count > 0 ? "6px 10px" : 0,
      marginBottom: count > 0 ? 10 : 0,
      background: count > 0 ? "rgba(14,165,233,0.06)" : "transparent",
      border: count > 0 ? "1px solid rgba(14,165,233,0.18)" : "none",
      borderRadius: 8,
      fontSize: 12,
    }}>
      {count > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", flex: 1, minWidth: 0 }}>
          <BadgeCheck size={14} />
          <span style={{ fontWeight: 600 }}>
            Co-signed by {count} attending{count === 1 ? "" : "s"}
          </span>
        </div>
      )}
      {canEndorse && (
        <button
          onClick={toggle}
          disabled={busy}
          title={mine ? "Remove co-sign" : "Co-sign this pearl"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px",
            background: mine ? "var(--primary)" : "transparent",
            color: mine ? "#fff" : "var(--primary)",
            border: `1px solid ${mine ? "var(--primary)" : "var(--primary)"}`,
            borderRadius: 999,
            cursor: busy ? "wait" : "pointer",
            fontSize: 11, fontWeight: 600,
            fontFamily: "'Geist', sans-serif",
            transition: "background .12s",
          }}
        >
          <Award size={12} /> {mine ? "Co-signed" : "Co-sign"}
        </button>
      )}
    </div>
  );
}
