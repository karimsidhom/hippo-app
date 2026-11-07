"use client";

// Hippo Clinic — Billing suggestions panel.
//
// Reads /api/clinic/encounters/[id]/billing-suggestions and renders one of
// three states:
//
//   1. Module disabled (off in settings) — render nothing.
//   2. Module enabled but no province configured — explanatory tile.
//   3. Module enabled, codes loaded — show suggestions or a benign empty
//      "no matches" line. We never invent or hallucinate codes — what
//      shows here came from the user's province table.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Loader2 } from "lucide-react";

interface Suggestion {
  code: string;
  shortLabel: string;
  feeCents: number | null;
  rationale: string;
  source: string;
}

interface Payload {
  enabled: boolean;
  configured: boolean;
  province: string | null;
  suggestions: Suggestion[];
  reason?: string;
}

export function BillingSuggestions({ encounterId, hasNote }: { encounterId: string; hasNote: boolean }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasNote) { setLoading(false); return; }
    let alive = true;
    fetch(`/api/clinic/encounters/${encounterId}/billing-suggestions`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: Payload) => { if (alive) setData(j); })
      .catch(() => { /* ignore */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [encounterId, hasNote]);

  if (!hasNote) return null;
  if (loading) return null;
  if (!data?.enabled) return null;

  return (
    <section style={{ marginBottom: 22 }}>
      <div className="section-title" style={{ marginBottom: 8 }}>Billing</div>

      {!data.configured ? (
        <div className="st-card" style={{ borderLeft: "2px solid var(--warning)" }}>
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--text)" }}>Billing module not configured</strong>
            {data.province ? ` for ${data.province}` : ""}.
            {data.reason ?? " No validated fee schedule has been loaded for your province. The module shows nothing rather than risk inventing a code."}
            <div style={{ marginTop: 8 }}>
              <Link href="/clinic/settings" style={{ color: "var(--primary-hi)", fontSize: 12 }}>
                Open settings →
              </Link>
            </div>
          </div>
        </div>
      ) : data.suggestions.length === 0 ? (
        <div className="st-card" style={{ fontSize: 12, color: "var(--text-3)" }}>
          <Receipt size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
          No matching codes for this note. Add codes in settings if expected.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.suggestions.map((s) => (
            <div key={s.code} className="st-card" style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {s.code} — {s.shortLabel}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  {s.rationale} · source: {s.source}
                </div>
              </div>
              {typeof s.feeCents === "number" && (
                <span className="badge badge-muted" style={{ alignSelf: "flex-start", fontVariantNumeric: "tabular-nums" }}>
                  {(s.feeCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}
                </span>
              )}
            </div>
          ))}
          <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", paddingTop: 4 }}>
            Verify each code against your provincial manual before billing.
          </div>
        </div>
      )}
    </section>
  );
}
