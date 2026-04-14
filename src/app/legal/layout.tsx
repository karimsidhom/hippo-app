import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #09090b)",
      color: "var(--text, #f4f4f5)",
      fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
    }}>
      <div style={{
        maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px",
      }}>
        <Link href="/" style={{
          display: "inline-block", fontSize: 14, color: "var(--text-3, #71717a)",
          textDecoration: "none", marginBottom: 24,
        }}>
          ← Hippo
        </Link>
        <nav style={{
          display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28,
          paddingBottom: 16, borderBottom: "1px solid var(--border, #1f1f23)",
          fontSize: 13,
        }}>
          <Link href="/legal/privacy" style={{ color: "var(--text-2, #a1a1aa)", textDecoration: "none" }}>Privacy</Link>
          <Link href="/legal/terms" style={{ color: "var(--text-2, #a1a1aa)", textDecoration: "none" }}>Terms</Link>
          <Link href="/legal/security" style={{ color: "var(--text-2, #a1a1aa)", textDecoration: "none" }}>Security</Link>
          <Link href="/legal/subprocessors" style={{ color: "var(--text-2, #a1a1aa)", textDecoration: "none" }}>Subprocessors</Link>
        </nav>
        <article style={{
          fontSize: 15, lineHeight: 1.7, color: "var(--text-2, #d4d4d8)",
        }}>
          {children}
        </article>
      </div>
    </div>
  );
}
