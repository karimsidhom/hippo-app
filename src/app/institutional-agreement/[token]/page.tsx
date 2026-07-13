"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { InstitutionalAgreementDocument, type AgreementDisplayData } from "@/components/legal/InstitutionalAgreementDocument";
import styles from "./page.module.css";

interface Agreement extends AgreementDisplayData {
  signatoryName: string;
  signatoryTitle: string;
  signatoryEmail: string;
  status: string;
  acceptedAt: string | null;
}

export default function AgreementExecutionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authority, setAuthority] = useState(false);
  const [terms, setTerms] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", email: "" });

  useEffect(() => {
    fetch(`/api/procurement/agreement/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to open agreement");
        setAgreement(result.agreement);
        setForm({ name: result.agreement.signatoryName, title: result.agreement.signatoryTitle, email: result.agreement.signatoryEmail });
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to open agreement"));
  }, [token]);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/procurement/agreement/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, authorityConfirmed: authority, termsConfirmed: terms }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to execute agreement");
      setAgreement(result.agreement);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to execute agreement");
    } finally {
      setBusy(false);
    }
  };

  if (!agreement && !error) return <main className={styles.state}><Loader2 className={styles.spin} /><span>Opening secure agreement...</span></main>;
  if (!agreement) return <main className={styles.state}><h1>Agreement unavailable</h1><p>{error}</p><a href="mailto:legal@hippomedicine.com">Contact Hippo legal</a></main>;

  const accepted = Boolean(agreement.acceptedAt);
  return <main className={styles.page}>
    <nav><Link href="/">Hippo Medicine</Link><span><ShieldCheck size={15} /> Secure institutional agreement</span></nav>
    {accepted ? <section className={styles.executed}><CheckCircle2 size={22} /><div><strong>Agreement executed</strong><span>Accepted {new Date(agreement.acceptedAt!).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}. The program owner can now complete billing in Hippo.</span></div></section> : <section className={styles.instructions}><strong>Review before accepting</strong><span>This document includes the order form, pilot terms, subscription terms, and data-processing schedule.</span></section>}
    <InstitutionalAgreementDocument data={agreement} />
    {!accepted && <section className={styles.signature}>
      <div><span>Electronic execution</span><h2>Authorized signatory</h2><p>Typing your name and selecting both certifications creates an electronic signature on behalf of the Customer.</p></div>
      <div className={styles.fields}>
        <label>Full legal name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label className={styles.wide}>Authorized email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      </div>
      <label className={styles.check}><input type="checkbox" checked={authority} onChange={(event) => setAuthority(event.target.checked)} /><span>I certify that I am authorized to bind the Customer identified in the Order Form.</span></label>
      <label className={styles.check}><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} /><span>I have reviewed and accept the Order Form, Institutional Pilot and Services Agreement, and Data Processing Schedule.</span></label>
      {error && <p className={styles.error}>{error}</p>}
      <button type="button" disabled={busy || !authority || !terms} onClick={accept}>{busy ? <Loader2 className={styles.spin} size={16} /> : <ShieldCheck size={16} />} Execute agreement</button>
    </section>}
  </main>;
}
