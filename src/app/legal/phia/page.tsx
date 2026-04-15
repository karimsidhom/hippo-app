export const metadata = { title: "PHIA Notice · Hippo" };

export default function PhiaPage() {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text, #f4f4f5)", letterSpacing: "-.4px", marginBottom: 6 }}>
        PHIA Notice (Manitoba)
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginBottom: 28 }}>
        Effective date: 2026-04-14 · Last updated: 2026-04-14
      </p>

      <p style={{ marginBottom: 18 }}>
        This notice explains how Hippo handles personal health information (&quot;PHI&quot;) under Manitoba&apos;s
        <em> Personal Health Information Act</em> (PHIA, C.C.S.M. c. P33.5). It supplements — and does
        not replace — our <a href="/legal/privacy" style={A}>Privacy Policy</a>.
      </p>

      <h2 style={H2}>1. Hippo&apos;s role under PHIA</h2>
      <p>
        Hippo is <strong>not a trustee</strong> under PHIA. We do not operate on behalf of a health-care
        facility, regional health authority, or health professional in the delivery of patient care.
        We provide educational productivity software to individual clinicians and trainees. Where an
        institution signs a data-processing agreement with us, we act as an <em>information manager</em>
        for that institution with respect to the data the institution designates.
      </p>

      <h2 style={H2}>2. PHI is not required to use Hippo</h2>
      <p>
        Hippo is designed to operate without personal health information. Our case log, EPA, and
        dictation tools ask only for training-relevant data that does not identify a patient:
      </p>
      <ul>
        <li>procedure name, category, approach, date (not combined with other identifiers),</li>
        <li>your role, autonomy level, operative time, difficulty,</li>
        <li>outcome and complication <em>category</em> (not narrative),</li>
        <li>your own reflections and teaching notes.</li>
      </ul>
      <p>
        We do <strong>not</strong> ask for patient names, medical record numbers, dates of birth, health
        numbers, addresses, or dates of service combined with other identifiers. If you voluntarily
        enter such information in a free-text field, you are responsible for having the legal
        authority to do so.
      </p>

      <h2 style={H2}>3. What we do to reduce PHI risk</h2>
      <ul>
        <li>
          <strong>Field design:</strong> numeric and categorical inputs by default; free-text fields
          carry a visible &quot;no patient identifiers&quot; reminder.
        </li>
        <li>
          <strong>Automated scrubbing:</strong> free-text submissions are passed through a regex
          pre-filter for obvious identifiers (names, DOBs, MRN-shaped tokens, phone numbers, addresses,
          postal codes) before storage. Obvious matches are redacted and the author is warned.
        </li>
        <li>
          <strong>AI preflight:</strong> before publishing a pearl or case share, an AI model reviews
          the draft for potential identifiers that the regex missed (rare combinations, hospital
          names, attending names). The author is shown the suggested scrub and may accept or reject it.
        </li>
        <li>
          <strong>Audit logging:</strong> creation, modification, deletion, export, and disclosure of
          any record is logged with actor, timestamp, IP address, and user-agent. Audit entries are
          append-only and retained for up to 7 years.
        </li>
        <li>
          <strong>Minimum retention:</strong> user-deletable data is deleted within 30 days of a
          deletion request. De-identified audit-log rows may be retained for legal and security
          purposes.
        </li>
        <li>
          <strong>Data location:</strong> primary storage is in a Canadian region of our database
          provider. See <a href="/legal/subprocessors" style={A}>Subprocessors</a>.
        </li>
      </ul>

      <h2 style={H2}>4. AI features and PHI</h2>
      <p>
        Some optional features (dictation polish, brief generation, PHI preflight, debrief parsing)
        transmit the text you submit to a third-party AI provider (Anthropic, Google, or OpenAI) for
        processing. Until Hippo has executed a written data-processing agreement with the provider in
        which the provider agrees (a) not to train on your submissions and (b) to provide Canadian
        or equivalent safeguards, you <strong>must not</strong> enter PHI into AI-facing fields. You
        can disable AI features in <a href="/settings" style={A}>Settings → AI features</a>.
      </p>

      <h2 style={H2}>5. Your rights under PHIA</h2>
      <p>If PHIA applies to data you have stored with Hippo, you have the right to:</p>
      <ul>
        <li><strong>access</strong> the personal health information we hold about you;</li>
        <li><strong>request correction</strong> of inaccurate information;</li>
        <li><strong>obtain a record of disclosures</strong> we have made;</li>
        <li><strong>file a complaint</strong> with the Manitoba Ombudsman (ombudsman.mb.ca) if you
          believe we have not complied with PHIA.</li>
      </ul>
      <p>
        Requests should be sent to our Privacy Officer (below) in writing. We will respond within 30
        days, or explain why a 30-day extension is required.
      </p>

      <h2 style={H2}>6. Institutional use</h2>
      <p>
        If your residency program, hospital, or health authority deploys Hippo under an institutional
        agreement, that institution may be the trustee of any data it designates as PHI. In that case,
        Hippo operates as an information manager and processes the data only on the institution&apos;s
        written instructions. Contact your program administrator for institution-specific details.
      </p>

      <h2 style={H2}>7. Breach notification</h2>
      <p>
        If we experience a security incident affecting data that reasonably may be personal health
        information, we will notify affected users without unreasonable delay and in any event within
        72 hours of confirmation. We will notify the Manitoba Ombudsman where PHIA requires. Our
        incident response process is summarized in our <a href="/legal/security" style={A}>Security</a>
        {" "}page.
      </p>

      <h2 style={H2}>8. Privacy Officer</h2>
      <p>
        Hippo&apos;s Privacy Officer is responsible for PHIA compliance and handles access requests and
        complaints: <a href="mailto:privacy@hippomedicine.com" style={A}>privacy@hippomedicine.com</a>.
      </p>

      <p style={{ fontSize: 12, color: "var(--text-3, #71717a)", marginTop: 32 }}>
        This notice summarizes our practices. It is not legal advice. If you believe you are required
        to enter PHI into Hippo for any reason, stop and consult your institution&apos;s privacy officer
        first.
      </p>
    </>
  );
}

const H2 = { fontSize: 17, fontWeight: 600, color: "var(--text, #f4f4f5)", marginTop: 28, marginBottom: 10 };
const A = { color: "#3b82f6", textDecoration: "none" };
