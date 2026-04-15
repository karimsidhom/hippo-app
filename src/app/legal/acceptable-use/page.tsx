export const metadata = { title: "Acceptable Use Policy · Hippo" };

export default function AcceptableUsePage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text, #f4f4f5)", letterSpacing: "-.4px", marginBottom: 6 }}>
        Acceptable Use Policy
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginBottom: 28 }}>
        Effective date: 2026-04-14
      </p>

      <p style={{ marginBottom: 18 }}>
        Hippo is a community of verified surgeons, residents, and medical trainees. This policy
        explains what you can and can&apos;t do here. It supplements — and does not replace — our
        {" "}<a href="/legal/eula" style={A}>End User Licence Agreement</a>.
      </p>

      <h2 style={H2}>1. You must be eligible</h2>
      <ul>
        <li>You are at least 18 years old.</li>
        <li>You are a medical student, resident, fellow, attending, or other verified healthcare professional or trainee.</li>
        <li>You are using your real identity, except when posting through the documented Anonymous feature (which still links the post to your verified account internally).</li>
        <li>You have not been previously banned from Hippo.</li>
      </ul>

      <h2 style={H2}>2. Do not upload patient identifiers</h2>
      <p>
        This is the single most important rule on Hippo. Do not enter, paste, upload, or transmit any
        of the following in any field, note, image, or voice recording:
      </p>
      <ul>
        <li>patient names, initials that could identify a patient in a small program, or nicknames;</li>
        <li>dates of birth, exact dates of service when combined with other identifiers, or ages over 89;</li>
        <li>health-card numbers, medical record numbers, accession numbers, account numbers;</li>
        <li>phone numbers, addresses, postal codes finer than the first three characters;</li>
        <li>photographs of charts, wristbands, whiteboards, consent forms, or any image containing the above;</li>
        <li>rare combinations that could re-identify (e.g., &quot;the only bilateral adrenal case at our centre last month&quot;).</li>
      </ul>
      <p>
        If you are unsure whether information is de-identified, don&apos;t post it. Hippo&apos;s
        automated scrubbers reduce risk but do not relieve you of responsibility.
      </p>

      <h2 style={H2}>3. Do not misuse the community feed</h2>
      <ul>
        <li>No harassment, discrimination, hate speech, or personal attacks.</li>
        <li>No doxing, including revealing the identity of an anonymous poster.</li>
        <li>No spam, off-topic promotion, or recruitment outside of supported channels.</li>
        <li>No promotion of dangerous, unproven, or unsupervised clinical practice.</li>
        <li>No misrepresentation — do not falsely attribute pearls, co-signs, or observations to another clinician.</li>
        <li>No attempting to identify, disparage, or retaliate against specific patients, colleagues, or institutions.</li>
      </ul>

      <h2 style={H2}>4. Do not misuse the platform</h2>
      <ul>
        <li>No scraping, crawling, or bulk extraction beyond supported export functions.</li>
        <li>No reverse engineering, load testing, or probing for vulnerabilities without written permission (see <a href="/legal/security" style={A}>Security</a> for responsible disclosure).</li>
        <li>No using Hippo to train machine-learning models or to generate derivative datasets for third parties.</li>
        <li>No sharing of credentials, and no use of a shared account by more than one person.</li>
      </ul>

      <h2 style={H2}>5. Professional and institutional obligations remain yours</h2>
      <p>
        Hippo does not replace your institution&apos;s policies. You remain responsible for:
      </p>
      <ul>
        <li>complying with your institution&apos;s rules about case documentation, social-media use, and patient privacy;</li>
        <li>obtaining any approvals required before publishing teaching material;</li>
        <li>maintaining your official training record in the system your program specifies;</li>
        <li>reporting adverse events through institutional channels — Hippo is not a reporting system.</li>
      </ul>

      <h2 style={H2}>6. AI output is your responsibility</h2>
      <p>
        AI features (drafts, briefs, dictations, suggestions) are tools you direct. You must review,
        verify, and edit any AI output before relying on it or signing it. Never publish AI output
        verbatim as a clinical record.
      </p>

      <h2 style={H2}>7. Enforcement</h2>
      <p>
        We may remove content, limit or suspend accounts, or terminate access for any violation of
        this policy, at our discretion. Suspected criminal activity may be reported to law
        enforcement. Suspected PHIA breaches will be handled under our
        {" "}<a href="/legal/phia" style={A}>PHIA Notice</a>.
      </p>

      <h2 style={H2}>8. Reporting violations</h2>
      <p>
        Report violations to <a href="mailto:trust@hippomedicine.com" style={A}>trust@hippomedicine.com</a>.
        Include a link to the content if applicable. We acknowledge reports within 48 hours.
      </p>
    </>
  );
}

const H2 = { fontSize: 17, fontWeight: 600, color: "var(--text, #f4f4f5)", marginTop: 28, marginBottom: 10 };
const A = { color: "#3b82f6", textDecoration: "none" };
