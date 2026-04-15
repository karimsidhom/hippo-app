export const metadata = { title: "Security · Hippo" };

export default function SecurityPage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text, #f4f4f5)", letterSpacing: "-.4px", marginBottom: 6 }}>Security</h1>
      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginBottom: 28 }}>Last updated: 2026-04-14</p>

      <p>Hippo is early-stage. We are transparent about what controls are in place today and what is on the roadmap before institutional agreements are signed.</p>

      <h2 style={H2}>In place today</h2>
      <ul>
        <li><strong>Encryption in transit:</strong> TLS 1.2+ for all traffic (Vercel + Supabase).</li>
        <li><strong>Encryption at rest:</strong> AES-256 on the Supabase-managed Postgres cluster and Storage, hosted in the Canada (Central) region.</li>
        <li><strong>Authentication:</strong> Supabase Auth with email/password + OAuth. Passwords are stored hashed (bcrypt) by Supabase; we never see them.</li>
        <li><strong>Authorization:</strong> every data-bearing API route calls <code>requireAuth</code>; row-level scoping by <code>userId</code>.</li>
        <li><strong>Audit log:</strong> append-only record of create/update/delete on cases and EPAs, including actor, IP, and user-agent. Visible to the user at <a href="/settings/audit-log" style={A}>Settings → Audit Log</a>.</li>
        <li><strong>PHI minimization:</strong> Hippo does not ask for patient identifiers. Free-text fields are scrubbed for obvious PHI tokens before storage. Audit snapshots redact free-text to a character count.</li>
        <li><strong>Data portability:</strong> every user can download a complete JSON archive of their data on demand.</li>
        <li><strong>Account deletion:</strong> one-click, purged within 30 days.</li>
        <li><strong>Third-party dependencies:</strong> auto-scanned weekly via Dependabot; security advisories open PRs automatically.</li>
        <li><strong>Rate limiting:</strong> per-user sliding-window limits on AI, write, and auth endpoints to prevent abuse and credential stuffing.</li>
        <li><strong>AI vendor gate + server-side scrubbing:</strong> every prompt is regex-scrubbed on the server (catching health-card numbers, MRNs, phone numbers, dates of birth, postal codes, addresses, patient-name patterns) before being transmitted. Every AI vendor we use commits in their commercial terms that inputs are NOT used for model training. A code-level gate (<code>AI_VENDOR_APPROVED</code>) blocks all LLM calls unless a qualifying vendor is configured.</li>
        <li><strong>Row-level security baseline:</strong> RLS enabled on every table with a default-deny policy for Supabase&apos;s anon and authenticated roles. Even if our public key leaked, direct PostgREST access is blocked.</li>
        <li><strong>Click-wrap legal acceptance:</strong> every user must accept EULA, Terms, Privacy, PHIA, and Acceptable Use during onboarding. Every acceptance is recorded with the policy version, timestamp, IP, and user-agent in an append-only table.</li>
        <li><strong>Subprocessor notice:</strong> dismissible in-app banner gives users a minimum of 30 days&apos; notice before any new third-party vendor begins processing their data.</li>
      </ul>

      <h2 style={H2}>On the roadmap (not yet in place)</h2>
      <ul>
        <li><strong>SOC 2 Type I audit</strong> — scoping in progress.</li>
        <li><strong>Signed BAA with AI providers</strong> (Anthropic, OpenAI) — required before any AI feature is used with PHI. Until signed, do not enter PHI into AI-facing fields.</li>
        <li><strong>Penetration test</strong> by an external firm — planned prior to first institutional deployment.</li>
        <li><strong>Formal incident-response plan</strong> with 72-hour breach notification.</li>
      </ul>

      <h2 style={H2}>Responsible disclosure</h2>
      <p>If you believe you have found a security vulnerability, please email <a href="mailto:security@hippomedicine.com" style={A}>security@hippomedicine.com</a>. We will acknowledge within 48 hours. Please do not publicly disclose until we have had a reasonable opportunity to fix.</p>
    </>
  );
}

const H2 = { fontSize: 17, fontWeight: 600, color: "var(--text, #f4f4f5)", marginTop: 28, marginBottom: 10 };
const A = { color: "#3b82f6", textDecoration: "none" };
