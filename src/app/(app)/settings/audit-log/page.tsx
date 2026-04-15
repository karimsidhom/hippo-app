"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Download } from "lucide-react";

interface AuditEntry {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

const ACTION_LABELS: Record<string, string> = {
  "case.create": "Logged a case",
  "case.update": "Updated a case",
  "case.delete": "Deleted a case",
  "epa.create": "Created an EPA observation",
  "epa.update": "Updated an EPA observation",
  "epa.sign": "EPA signed by attending",
  "epa.delete": "Deleted an EPA observation",
  "profile.update": "Updated profile",
  "role.change": "Changed account role",
  "consent.shadowRecord": "Acknowledged shadow-record notice",
  "export.download": "Downloaded data export",
  "account.delete": "Deleted account",
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "audit.correction": "Audit correction",
};

function formatAction(a: string): string {
  return ACTION_LABELS[a] ?? a;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    fetch("/api/account/audit-log?limit=500")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter
    ? logs.filter(
        (l) =>
          l.action.includes(filter) ||
          l.entityType.toLowerCase().includes(filter.toLowerCase()),
      )
    : logs;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px", animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      <Link
        href="/settings"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "var(--text-3)", fontSize: 13, textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <Shield size={18} style={{ color: "var(--text)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.3px" }}>
          Activity & Audit Log
        </h1>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.5 }}>
        Every sensitive action on your account — case edits, EPA sign-offs, exports, role
        changes — is recorded here. These entries are append-only and cannot be edited
        or deleted, even by us. Free-text fields (notes, reflections) are redacted to a
        character count rather than stored in full.
      </p>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Filter by action (e.g. case.update)…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1, padding: "8px 12px",
            background: "var(--surface2)", border: "1px solid var(--border-mid)",
            borderRadius: 6, color: "var(--text)", fontSize: 13,
            fontFamily: "'Geist', sans-serif",
          }}
        />
        <a
          href="/api/account/audit-log/export"
          download
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 12px", fontSize: 13, fontWeight: 500,
            background: "var(--surface2)", border: "1px solid var(--border-mid)",
            borderRadius: 6, color: "var(--text)", textDecoration: "none",
            whiteSpace: "nowrap", fontFamily: "'Geist', sans-serif",
          }}
          title="Download your full audit log as a CSV (up to 10 000 rows)"
        >
          <Download size={14} /> Export CSV
        </a>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
          No entries yet.
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {filtered.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                padding: "12px 14px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                background: "var(--bg-1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                  {formatAction(entry.action)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>
                  {formatDate(entry.createdAt)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                {entry.entityType}
                {entry.entityId ? `/${entry.entityId.slice(0, 8)}` : ""}
                {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
              </div>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <details style={{ fontSize: 11, color: "var(--text-3)" }}>
                  <summary style={{ cursor: "pointer", userSelect: "none" }}>details</summary>
                  <pre style={{
                    marginTop: 6, padding: 8,
                    background: "var(--surface2)",
                    borderRadius: 4, fontSize: 10,
                    overflowX: "auto", color: "var(--text-2)",
                  }}>
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
