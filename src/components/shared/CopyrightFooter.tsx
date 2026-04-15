import Link from "next/link";

/**
 * Compact copyright line used on public-facing pages (auth, legal, marketing).
 *
 * Two reasons this exists:
 *  1. Visible © assertion is the single cheapest signal that the work is
 *     claimed — helps in any later infringement action. (Registration with
 *     the Canadian IP Office is still recommended, but visibility matters.)
 *  2. Surfaces the legal hub so users can always reach Terms/Privacy from
 *     any entry point — a requirement under PIPEDA and the Consumer
 *     Protection Act (Manitoba).
 *
 * The "™" on "Hippo" asserts common-law trademark rights. Upgrade to "®"
 * once the mark is registered with CIPO (see docs/IP-FILING-CHECKLIST.md).
 */
export function CopyrightFooter({ variant = "dark" }: { variant?: "dark" | "subtle" }) {
  const color = variant === "dark" ? "#52525b" : "#71717a";
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        width: "100%",
        padding: "24px 16px",
        textAlign: "center",
        fontSize: 11,
        lineHeight: 1.6,
        color,
        fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
        letterSpacing: 0,
      }}
    >
      <div>
        © {year} Hippo Medicine Inc. All rights reserved. Hippo
        <sup style={{ fontSize: 8, marginLeft: 1, verticalAlign: "super" }}>™</sup>{" "}
        is a trademark of Hippo Medicine Inc.
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/legal/terms" style={{ color, textDecoration: "none" }}>Terms</Link>
        <Link href="/legal/privacy" style={{ color, textDecoration: "none" }}>Privacy</Link>
        <Link href="/legal/phia" style={{ color, textDecoration: "none" }}>PHIA</Link>
        <Link href="/legal/security" style={{ color, textDecoration: "none" }}>Security</Link>
      </div>
    </footer>
  );
}
