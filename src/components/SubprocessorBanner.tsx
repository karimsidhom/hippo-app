"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, AlertCircle } from "lucide-react";
import {
  upcomingSubprocessorNotices,
  type SubprocessorNotice,
} from "@/lib/subprocessor-notices";

/**
 * Dismissible in-app banner announcing upcoming subprocessor changes.
 *
 * Must be rendered inside the authenticated app shell. Shows the FIRST
 * upcoming notice (not all of them — too noisy). Dismissal is stored in
 * localStorage keyed by the notice's `id` so bumping the id re-surfaces
 * to everyone.
 *
 * The banner is intentionally visible and mildly alarming — this is a
 * contractual commitment to users (30-day notice), not marketing.
 */
const LS_KEY_PREFIX = "hippo.subprocessor-notice.dismissed.";

export function SubprocessorBanner() {
  const [notice, setNotice] = useState<SubprocessorNotice | null>(null);

  useEffect(() => {
    const upcoming = upcomingSubprocessorNotices();
    for (const n of upcoming) {
      if (localStorage.getItem(LS_KEY_PREFIX + n.id) !== "1") {
        setNotice(n);
        return;
      }
    }
  }, []);

  if (!notice) return null;

  const dismiss = () => {
    localStorage.setItem(LS_KEY_PREFIX + notice.id, "1");
    setNotice(null);
  };

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 14px",
        background: "rgba(234,179,8,0.08)",
        border: "1px solid rgba(234,179,8,0.25)",
        borderRadius: 8,
        margin: "10px 16px 0",
        fontSize: 13,
        color: "var(--text-2, #d4d4d8)",
      }}
    >
      <AlertCircle size={16} style={{ color: "#eab308", flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, lineHeight: 1.5 }}>
        <strong style={{ color: "var(--text, #f4f4f5)" }}>Upcoming subprocessor change:</strong>{" "}
        On {notice.effectiveDate}, we will begin using <strong>{notice.vendor}</strong> to{" "}
        {notice.purpose.replace(/\.$/, "")}. Data processed: {notice.data}.{" "}
        <Link
          href="/legal/subprocessors"
          style={{ color: "#3b82f6", textDecoration: "none" }}
        >
          Full subprocessor list →
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-3, #71717a)",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
