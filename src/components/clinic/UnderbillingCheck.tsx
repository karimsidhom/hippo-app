"use client";

// Under-billing check. The resident or surgeon types the codes they claimed
// for this encounter; the server compares the note against every code the
// province library knows and returns the ones the note supports but the claim
// omits, priced, plus claimed codes the note does not support. Physician
// verification material only; the regional disclaimer is always shown.

import { useState } from "react";
import Link from "next/link";
import { Receipt, Loader2, AlertTriangle } from "lucide-react";

interface UnclaimedHit {
  code: string;
  shortLabel: string;
  modifier: string | null;
  feeCents: number | null;
  matchedOn: string;
  strength: "label" | "description";
  phrase: string;
}
interface Report {
  claimed: string[];
  unclaimed: UnclaimedHit[];
  unclaimedTotalCents: number;
  claimedButUnsupported: string[];
}
interface Payload {
  province?: string;
  codesConsidered?: number;
  report?: Report;
  disclaimer?: string;
  error?: string;
  configured?: boolean;
}

const cad = (c: number) => (c / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function UnderbillingCheck({ noteText, noteType }: { noteText: string; noteType?: string | null }) {
  const [claimed, setClaimed] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!noteText || noteText.trim().length < 20) return null;

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const codes = claimed.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);
      const res = await fetch("/api/billing/underbilling", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: noteText, claimed: codes, noteType: noteType ?? undefined }),
      });
      const json = (await res.json().catch(() => ({}))) as Payload;
      if (!res.ok) {
        if (json.configured === false) { setData(json); return; }
        throw new Error(json.error ?? `Check failed (${res.status})`);
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run the check");
    } finally {
      setBusy(false);
    }
  }

  const r = data?.report;

  return (
    <section style={{ marginBottom: 22 }}>
      <div className="section-title" style={{ marginBottom: 8 }}>Under-billing check</div>
      <div className="st-card" style={{ padding: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 8 }}>
          Enter the codes you claimed for this encounter. The note is compared against the whole provincial library and
          anything it supports that you did not claim comes back priced.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={claimed}
            onChange={(e) => setClaimed(e.target.value)}
            placeholder="Codes claimed, e.g. 8560 00101"
            style={{ flex: 1, minWidth: 0, fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)" }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); run(); } }}
          />
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border-mid)] bg-[var(--surface2)] text-[var(--text)] disabled:opacity-50"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : "Check"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger, #f87171)", display: "flex", gap: 6, alignItems: "center" }}>
            <AlertTriangle size={12} /> {error}
          </div>
        )}

        {data && data.configured === false && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-2)" }}>
            {data.error ?? "Set a billing province in Clinic settings first."}{" "}
            <Link href="/clinic/settings" style={{ color: "var(--primary-hi)" }}>Open settings →</Link>
          </div>
        )}

        {r && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {r.unclaimed.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                <Receipt size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                Nothing in the note supports a code beyond what you claimed ({data.codesConsidered} codes considered).
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {r.unclaimed.length} supported but unclaimed, {cad(r.unclaimedTotalCents)} at schedule rates
                </div>
                {r.unclaimed.map((h) => (
                  <div key={h.code} className="st-card" style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{h.code}{h.modifier ? ` ${h.modifier}` : ""} · {h.shortLabel}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                        matched on {h.strength}: &ldquo;{h.phrase}&rdquo;
                      </div>
                    </div>
                    {typeof h.feeCents === "number" && (
                      <span className="badge badge-muted" style={{ alignSelf: "flex-start", fontVariantNumeric: "tabular-nums" }}>{cad(h.feeCents)}</span>
                    )}
                  </div>
                ))}
              </>
            )}
            {r.claimedButUnsupported.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--warning, #fbbf24)", display: "flex", gap: 6, alignItems: "flex-start" }}>
                <AlertTriangle size={12} style={{ marginTop: 2 }} />
                <span>Claimed but not supported by the note as written: {r.claimedButUnsupported.join(", ")}. Document it or drop it.</span>
              </div>
            )}
            {data.disclaimer && (
              <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", paddingTop: 4 }}>{data.disclaimer}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
