import Link from "next/link";
import type { Metadata } from "next";
import { HippoMark } from "@/components/HippoMark";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100dvh", background: "var(--bg)", color: "var(--text)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <HippoMark size={36} />
        </div>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: ".08em",
          textTransform: "uppercase", color: "var(--text-2)", margin: "0 0 8px",
        }}>
          404
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.4px", margin: "0 0 8px" }}>
          This page does not exist
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5, margin: "0 0 24px" }}>
          The link may be old or mistyped. Your cases are safe.
        </p>
        <Link href="/dashboard" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minHeight: 44, padding: "0 20px", borderRadius: 8,
          background: "var(--primary)", color: "#fff",
          fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}>
          Back to Hippo Logs
        </Link>
      </div>
    </main>
  );
}
