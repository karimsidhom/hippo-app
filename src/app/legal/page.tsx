import Link from "next/link";

export const metadata = { title: "Legal · Hippo" };

const DOCS: { href: string; title: string; desc: string; badge?: string }[] = [
  {
    href: "/legal/eula",
    title: "End User Licence Agreement",
    desc: "The binding contract for using Hippo — licence grants, ownership of your content, restrictions, liability.",
  },
  {
    href: "/legal/terms",
    title: "Terms of Use",
    desc: "Short operational terms layered on top of the EULA — not an official record, no medical advice, fees and cancellation.",
  },
  {
    href: "/legal/privacy",
    title: "Privacy Policy",
    desc: "What we collect, how we use it, your rights, contact for access or deletion.",
  },
  {
    href: "/legal/phia",
    title: "PHIA Notice",
    desc: "Manitoba-specific notice on personal health information, our role as information manager, and your rights under PHIA.",
    badge: "Manitoba",
  },
  {
    href: "/legal/acceptable-use",
    title: "Acceptable Use Policy",
    desc: "What you can and can't do on Hippo — the do-not-upload-PHI rule lives here.",
  },
  {
    href: "/legal/security",
    title: "Security",
    desc: "Controls in place today, roadmap items, and how to report a vulnerability.",
  },
  {
    href: "/legal/subprocessors",
    title: "Subprocessors",
    desc: "Every third-party we share data with, what they do, and where they're hosted.",
  },
];

export default function LegalIndex() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text, #f4f4f5)", letterSpacing: "-.4px", marginBottom: 6 }}>
        Legal
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-3, #71717a)", marginBottom: 28 }}>
        Everything in one place. By using Hippo you agree to all of these.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DOCS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            style={{
              display: "block",
              padding: "14px 16px",
              background: "var(--surface, #111113)",
              border: "1px solid var(--border, #1f1f23)",
              borderRadius: 10,
              textDecoration: "none",
              transition: "border-color .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #f4f4f5)" }}>
                {d.title}
              </span>
              {d.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 4,
                  background: "rgba(14,165,233,0.12)",
                  color: "#3b82f6",
                  letterSpacing: ".04em",
                }}>
                  {d.badge.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2, #a1a1aa)", lineHeight: 1.5 }}>
              {d.desc}
            </div>
          </Link>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginTop: 28 }}>
        Questions: <a href="mailto:legal@hippomedicine.com" style={{ color: "#3b82f6" }}>legal@hippomedicine.com</a>
        {" · "}Privacy: <a href="mailto:privacy@hippomedicine.com" style={{ color: "#3b82f6" }}>privacy@hippomedicine.com</a>
        {" · "}Security: <a href="mailto:security@hippomedicine.com" style={{ color: "#3b82f6" }}>security@hippomedicine.com</a>
      </p>
    </>
  );
}
