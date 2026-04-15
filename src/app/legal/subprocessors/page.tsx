export const metadata = { title: "Subprocessors · Hippo" };

const ROWS: { vendor: string; purpose: string; data: string; region: string }[] = [
  { vendor: "Supabase (Postgres + Storage + Auth)", purpose: "Primary database, file storage, authentication", data: "All account and training data", region: "Canada (Central) — ca-central-1" },
  { vendor: "Vercel", purpose: "Application hosting + edge network", data: "Request metadata, logs", region: "Global edge; primary US" },
  { vendor: "Groq (Llama 3.3 70B)", purpose: "AI brief, dictation refinement, debrief parsing, PHI preflight, feed drafts", data: "De-identified free-text you submit to AI features (regex-scrubbed server-side before transmission). Groq's commercial terms forbid using inputs/outputs for model training.", region: "US" },
  { vendor: "Anthropic (Claude) — optional fallback", purpose: "AI features when Groq is unavailable", data: "Same as Groq. Anthropic's API commercial terms forbid training on API inputs.", region: "US" },
  { vendor: "OpenAI (Whisper)", purpose: "Speech-to-text for voice logging", data: "Audio clips you record", region: "US" },
  { vendor: "Stripe", purpose: "Payment processing for Pro subscriptions", data: "Email, billing address, payment card data (held by Stripe, not Hippo)", region: "Global" },
  { vendor: "Resend", purpose: "Transactional email (attending sign-off links, password resets)", data: "Email addresses, email bodies", region: "US" },
];

export default function SubprocessorsPage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text, #f4f4f5)", letterSpacing: "-.4px", marginBottom: 6 }}>Subprocessors</h1>
      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginBottom: 28 }}>Last updated: 2026-04-14</p>

      <p>A &quot;subprocessor&quot; is a third-party service Hippo uses to deliver the product. This page lists all of them. We will notify customers in-app 30 days before adding a new subprocessor that processes personal data.</p>

      <div style={{
        marginTop: 24,
        border: "1px solid var(--border, #1f1f23)",
        borderRadius: 8, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface2, #111113)" }}>
              <th style={TH}>Vendor</th>
              <th style={TH}>Purpose</th>
              <th style={TH}>Data processed</th>
              <th style={TH}>Region</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={r.vendor} style={{ borderTop: i > 0 ? "1px solid var(--border, #1f1f23)" : "none" }}>
                <td style={TD}>{r.vendor}</td>
                <td style={TD}>{r.purpose}</td>
                <td style={TD}>{r.data}</td>
                <td style={TD}>{r.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-3, #71717a)" }}>
        For institutional plans requiring regional data residency (e.g. Canadian data in Canada), contact <a href="mailto:sales@hippomedicine.com" style={{ color: "#3b82f6", textDecoration: "none" }}>sales@hippomedicine.com</a>.
      </p>
    </>
  );
}

const TH: React.CSSProperties = { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--text-3, #71717a)", textTransform: "uppercase", letterSpacing: ".06em" };
const TD: React.CSSProperties = { padding: "12px 14px", color: "var(--text-2, #d4d4d8)", verticalAlign: "top" };
