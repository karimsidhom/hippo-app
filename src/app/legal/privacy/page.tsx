export const metadata = { title: "Privacy Policy · Hippo" };

export default function PrivacyPage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text, #f4f4f5)", letterSpacing: "-.4px", marginBottom: 6 }}>Privacy Policy</h1>
      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginBottom: 28 }}>Effective date: 2026-04-14 · Last updated: 2026-04-14</p>

      <h2 style={H2}>1. What Hippo is (and is not)</h2>
      <p>Hippo is a personal surgical training companion. It is <strong>not</strong> an official training record, credentialing system, or accreditation platform unless your program has explicitly entered into an institutional agreement with us. You should continue to use your program&apos;s official learning-management system (Elentra, MedHub, New Innovations, one45, Entrada, etc.) for any records your program requires.</p>

      <h2 style={H2}>2. Data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email, name, specialty, institution, PGY year, role.</li>
        <li><strong>Case logs:</strong> procedure, date, role, autonomy level, operative time, approach, and free-text notes/reflections that you enter yourself.</li>
        <li><strong>EPA observations:</strong> ratings, attending information, and free-text comments.</li>
        <li><strong>Device & audit data:</strong> IP address and user-agent when you take sensitive actions (case edits, sign-offs, exports). Retained in the audit log.</li>
        <li><strong>No PHI by design:</strong> Hippo does not ask you for patient names, dates of birth, medical record numbers, or any direct identifiers. Our notes fields are scrubbed for obvious PHI tokens before storage, but you are responsible for not entering PHI.</li>
      </ul>

      <h2 style={H2}>3. How we use it</h2>
      <p>To provide the product, to generate the analytics and briefs you see in the app, and to maintain security and integrity of the service. We do not sell your data. We do not show third-party advertising. We do not share your data with your program unless you explicitly opt in.</p>

      <h2 style={H2}>4. Where it lives</h2>
      <p>Primary storage is Supabase (Postgres) with encryption at rest and in transit. Files you upload are stored in Supabase Storage. For a full list of subprocessors see <a href="/legal/subprocessors" style={A}>Subprocessors</a>.</p>

      <h2 style={H2}>5. AI processing</h2>
      <p>
        Some features (morning brief, debrief parsing, dictation refinement, PHI preflight,
        feed drafts) send content to third-party large-language-model providers. Our default
        provider is <strong>Groq</strong> running open-weight Llama 3.3 70B. Every AI vendor
        we use has committed in their commercial terms of service that inputs and outputs
        are <strong>not used to train their models</strong>. We additionally regex-scrub
        every prompt on our server to remove obvious patient identifiers before it leaves
        our infrastructure, as defense-in-depth. You should still never enter patient
        names, health-card numbers, MRNs, or dates of birth into any free-text field. You
        can disable AI features in Settings if you prefer fully local processing.
      </p>

      <h2 style={H2}>6. Your rights</h2>
      <ul>
        <li><strong>Access & export:</strong> download a complete archive of your data from Settings → Data Export. This is machine-readable JSON and includes everything we hold for your account.</li>
        <li><strong>Correction:</strong> edit anything you&apos;ve entered from within the app.</li>
        <li><strong>Deletion:</strong> request full account deletion from Settings → Delete account. We purge within 30 days, except for audit-log entries retained for legal/compliance reasons for up to 7 years (de-identified).</li>
        <li><strong>Audit trail:</strong> see every action taken on your account at Settings → Audit Log.</li>
      </ul>

      <h2 style={H2}>7. Privacy Officer</h2>
      <p>
        Under PHIA and PIPEDA, Hippo is required to designate an individual accountable for
        our privacy practices. This person investigates complaints, processes access
        requests, and is your single point of contact for anything privacy-related.
      </p>
      <div style={{
        marginTop: 12,
        padding: "14px 16px",
        background: "var(--surface, #111113)",
        border: "1px solid var(--border, #1f1f23)",
        borderRadius: 8,
      }}>
        <p style={{ margin: 0, fontSize: 13 }}>
          <strong style={{ color: "var(--text, #f4f4f5)" }}>Privacy Officer:</strong> Karim Sidhom, Founder<br />
          <strong style={{ color: "var(--text, #f4f4f5)" }}>Email:</strong>{" "}
          <a href="mailto:privacy@hippomedicine.com" style={A}>privacy@hippomedicine.com</a><br />
          <strong style={{ color: "var(--text, #f4f4f5)" }}>Response SLA:</strong> acknowledgement within 48 hours, substantive response within 30 days.
        </p>
      </div>

      <h2 style={H2}>8. Contact & escalation</h2>
      <p>
        Complaints, access requests, or corrections should first go to the Privacy Officer
        above. If you are not satisfied with our response, you may escalate to:
      </p>
      <ul>
        <li><strong>Manitoba Ombudsman</strong> (for PHIA matters in Manitoba) — <a href="https://www.ombudsman.mb.ca" target="_blank" rel="noopener noreferrer" style={A}>ombudsman.mb.ca</a></li>
        <li><strong>Office of the Privacy Commissioner of Canada</strong> (for PIPEDA matters) — <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" style={A}>priv.gc.ca</a></li>
        <li>Your provincial or national supervisory authority if you are outside Manitoba.</li>
      </ul>

      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginTop: 32 }}>Hippo reserves the right to update this policy. Material changes will be notified in-app.</p>
    </>
  );
}

const H2 = { fontSize: 17, fontWeight: 600, color: "var(--text, #f4f4f5)", marginTop: 28, marginBottom: 10 };
const A = { color: "#3b82f6", textDecoration: "none" };
