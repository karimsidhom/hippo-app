"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck, CreditCard, FileText, Loader2, Send, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

type FormState = {
  institutionLegalName: string; institutionType: string; jurisdiction: string;
  addressLine1: string; addressLine2: string; city: string; province: string; postalCode: string; country: string;
  signatoryName: string; signatoryTitle: string; signatoryEmail: string;
  billingContactName: string; billingContactEmail: string;
  residentSeats: number; facultySeats: number; pilotStartDate: string;
  purchaseOrderRequired: boolean; purchaseOrderNumber: string;
  securityReviewRequired: boolean; dataProcessingRequired: boolean; notes: string;
};

const emptyForm: FormState = {
  institutionLegalName: "", institutionType: "University / teaching hospital", jurisdiction: "Manitoba, Canada",
  addressLine1: "", addressLine2: "", city: "", province: "Manitoba", postalCode: "", country: "Canada",
  signatoryName: "", signatoryTitle: "", signatoryEmail: "", billingContactName: "", billingContactEmail: "",
  residentSeats: 20, facultySeats: 10, pilotStartDate: "", purchaseOrderRequired: false, purchaseOrderNumber: "",
  securityReviewRequired: false, dataProcessingRequired: true, notes: "",
};

const steps = ["Institution", "Pilot scope", "Procurement", "Agreement & billing"];

export default function ProgramProcurementPage() {
  const [programId, setProgramId] = useState("");
  const [program, setProgram] = useState<{ name: string; institution: string | null; specialty: string | null } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("none");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setProgramId(new URLSearchParams(window.location.search).get("programId") ?? ""), []);
  useEffect(() => {
    if (!programId) return;
    fetch(`/api/programs/${encodeURIComponent(programId)}/procurement`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to open procurement");
        setProgram(result.program);
        setStripeConfigured(result.stripeConfigured);
        setSubscriptionStatus(result.subscriptionStatus);
        if (result.procurement) {
          const procurement = result.procurement;
          setRecord(procurement);
          setForm({
            institutionLegalName: procurement.institutionLegalName, institutionType: procurement.institutionType, jurisdiction: procurement.jurisdiction,
            addressLine1: procurement.addressLine1, addressLine2: procurement.addressLine2 ?? "", city: procurement.city, province: procurement.province, postalCode: procurement.postalCode, country: procurement.country,
            signatoryName: procurement.signatoryName, signatoryTitle: procurement.signatoryTitle, signatoryEmail: procurement.signatoryEmail,
            billingContactName: procurement.billingContactName, billingContactEmail: procurement.billingContactEmail,
            residentSeats: procurement.residentSeats, facultySeats: procurement.facultySeats,
            pilotStartDate: procurement.pilotStartDate ? procurement.pilotStartDate.slice(0, 10) : "",
            purchaseOrderRequired: procurement.purchaseOrderRequired, purchaseOrderNumber: procurement.purchaseOrderNumber ?? "",
            securityReviewRequired: procurement.securityReviewRequired, dataProcessingRequired: procurement.dataProcessingRequired, notes: procurement.notes ?? "",
          });
          if (procurement.agreementAcceptedAt) setStep(3); else if (procurement.submittedAt) setStep(3);
        } else {
          setForm((current) => ({ ...current, institutionLegalName: result.program.institution ?? "" }));
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to open procurement"))
      .finally(() => setLoading(false));
  }, [programId]);

  const status = String(record?.status ?? "DRAFT");
  const agreementAccepted = Boolean(record?.agreementAcceptedAt);
  const active = ["active", "trialing"].includes(subscriptionStatus) || status === "ACTIVE";
  const readiness = useMemo(() => [
    Boolean(form.institutionLegalName && form.addressLine1 && form.city && form.postalCode),
    form.residentSeats > 0 && form.facultySeats > 0 && Boolean(form.pilotStartDate),
    Boolean(form.signatoryName && form.signatoryTitle && form.signatoryEmail && form.billingContactName && form.billingContactEmail),
    agreementAccepted && (stripeConfigured ? active : true),
  ], [form, agreementAccepted, stripeConfigured, active]);

  const save = async (submit: boolean) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/programs/${encodeURIComponent(programId)}/procurement`, {
        method: "PUT", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, submit }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save procurement request");
      setRecord(result.procurement);
      setNotice(submit ? "The agreement was sent to the authorized signatory." : "Draft saved.");
      if (submit) setStep(3);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save procurement request"); }
    finally { setBusy(false); }
  };

  const checkout = async () => {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ programId }) });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error ?? "Billing is unavailable");
      window.location.assign(result.url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Billing is unavailable"); setBusy(false); }
  };

  if (!programId) return <State title="Choose a program" copy="Open this workflow from the Program plan section of a program you own." />;
  if (loading) return <State title="Opening institutional onboarding" copy="Loading the program order form..." loading />;
  if (!program) return <State title="Unable to open onboarding" copy={error ?? "Program owner access is required."} />;

  return <main className={styles.workspace}>
    <header><div><Link href="/programs"><ArrowLeft size={14} /> Programs</Link><span>Institutional onboarding</span><h1>{program.name}</h1><p>{program.institution} · {program.specialty}</p></div><Status status={active ? "ACTIVE" : status} /></header>
    <nav className={styles.steps} aria-label="Institutional onboarding steps">{steps.map((label, index) => <button key={label} type="button" data-active={step === index} data-complete={readiness[index]} onClick={() => setStep(index)}><i>{readiness[index] ? <Check size={13} /> : index + 1}</i><span>{label}</span></button>)}</nav>

    <section className={styles.panel}>
      {step === 0 && <><Heading icon={<ClipboardCheck />} eyebrow="Step 1" title="Institution profile" copy="Use the legal entity and address that should appear on the agreement and invoice." /><div className={styles.formGrid}>
        <Field label="Legal institution name" value={form.institutionLegalName} onChange={(value) => setForm({ ...form, institutionLegalName: value })} wide />
        <Field label="Institution type" value={form.institutionType} onChange={(value) => setForm({ ...form, institutionType: value })} />
        <Field label="Jurisdiction" value={form.jurisdiction} onChange={(value) => setForm({ ...form, jurisdiction: value })} />
        <Field label="Address line 1" value={form.addressLine1} onChange={(value) => setForm({ ...form, addressLine1: value })} wide />
        <Field label="Address line 2" value={form.addressLine2} onChange={(value) => setForm({ ...form, addressLine2: value })} wide optional />
        <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} /><Field label="Province / state" value={form.province} onChange={(value) => setForm({ ...form, province: value })} />
        <Field label="Postal code" value={form.postalCode} onChange={(value) => setForm({ ...form, postalCode: value })} /><Field label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} />
      </div></>}
      {step === 1 && <><Heading icon={<CheckCircle2 />} eyebrow="Step 2" title="Pilot scope" copy="Define the 30-day cohort. The executive report uses this baseline and window." /><div className={styles.formGrid}>
        <Field label="Pilot start date" type="date" value={form.pilotStartDate} onChange={(value) => setForm({ ...form, pilotStartDate: value })} />
        <Field label="Pilot end" value={form.pilotStartDate ? new Date(new Date(`${form.pilotStartDate}T12:00:00Z`).getTime() + 30 * 86400000).toLocaleDateString("en-CA", { dateStyle: "medium", timeZone: "UTC" }) : "Calculated from start date"} disabled />
        <Field label="Resident / fellow seats" type="number" value={String(form.residentSeats)} onChange={(value) => setForm({ ...form, residentSeats: Number(value) })} />
        <Field label="Faculty / staff seats" type="number" value={String(form.facultySeats)} onChange={(value) => setForm({ ...form, facultySeats: Number(value) })} />
      </div><div className={styles.deliverables}><strong>Pilot deliverables</strong><span>Weekly director summary</span><span>Pilot Command Center</span><span>Executive outcome PDF</span><span>Eight accreditation exports</span></div></>}
      {step === 2 && <><Heading icon={<ShieldCheck />} eyebrow="Step 3" title="Procurement contacts" copy="Identify the authorized signatory, billing owner, and review requirements." /><div className={styles.formGrid}>
        <Field label="Authorized signatory" value={form.signatoryName} onChange={(value) => setForm({ ...form, signatoryName: value })} /><Field label="Signatory title" value={form.signatoryTitle} onChange={(value) => setForm({ ...form, signatoryTitle: value })} />
        <Field label="Signatory email" type="email" value={form.signatoryEmail} onChange={(value) => setForm({ ...form, signatoryEmail: value })} wide />
        <Field label="Billing contact" value={form.billingContactName} onChange={(value) => setForm({ ...form, billingContactName: value })} /><Field label="Billing email" type="email" value={form.billingContactEmail} onChange={(value) => setForm({ ...form, billingContactEmail: value })} />
      </div><div className={styles.checks}><Toggle checked={form.purchaseOrderRequired} onChange={(checked) => setForm({ ...form, purchaseOrderRequired: checked })} label="Purchase order required" /><Toggle checked={form.securityReviewRequired} onChange={(checked) => setForm({ ...form, securityReviewRequired: checked })} label="Security review required" /><Toggle checked={form.dataProcessingRequired} onChange={(checked) => setForm({ ...form, dataProcessingRequired: checked })} label="Include data-processing schedule" /></div>{form.purchaseOrderRequired && <div className={styles.formGrid}><Field label="Purchase order number" value={form.purchaseOrderNumber} onChange={(value) => setForm({ ...form, purchaseOrderNumber: value })} wide optional /></div>}<label className={styles.notes}>Procurement notes <span>Optional</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label></>}
      {step === 3 && <><Heading icon={<FileText />} eyebrow="Step 4" title="Agreement and billing" copy="The authorized signatory executes the order form and institutional terms before checkout opens." /><div className={styles.executionGrid}>
        <Milestone complete={Boolean(record?.submittedAt)} title="Agreement prepared" copy={record?.submittedAt ? "Secure execution link sent to the signatory." : "Submit the completed order form to generate the agreement."} />
        <Milestone complete={agreementAccepted} title="Agreement executed" copy={agreementAccepted ? `Accepted ${new Date(String(record?.agreementAcceptedAt)).toLocaleDateString("en-CA", { dateStyle: "medium" })}.` : "Waiting for the authorized signatory."} />
        <Milestone complete={active} title="Billing active" copy={active ? `Stripe subscription: ${subscriptionStatus}.` : stripeConfigured ? "Checkout opens after execution." : "Stripe activation credentials are pending."} />
      </div><div className={styles.documentLinks}><Link href="/legal/institutional-agreement" target="_blank"><FileText size={15} /> Agreement template</Link><Link href="/pd-dashboard/reports"><ClipboardCheck size={15} /> Accreditation reports</Link><Link href="/program-command-center"><CheckCircle2 size={15} /> Pilot Command Center</Link></div>
      {!record?.submittedAt && <button className={styles.primaryAction} type="button" onClick={() => void save(true)} disabled={busy}><Send size={16} /> Send for signature</button>}
      {record?.submittedAt && !agreementAccepted && <p className={styles.waiting}>The secure agreement link is active for 30 days. It was sent to {form.signatoryEmail}.</p>}
      {agreementAccepted && !active && (stripeConfigured ? <button className={styles.primaryAction} type="button" onClick={checkout} disabled={busy}><CreditCard size={16} /> Continue to secure checkout</button> : <div className={styles.pendingStripe}><ShieldCheck size={18} /><div><strong>Agreement complete</strong><span>Checkout will activate as soon as Hippo&apos;s live Stripe product and webhook credentials are installed.</span></div></div>)}
      {active && <div className={styles.pendingStripe}><CheckCircle2 size={18} /><div><strong>Institutional plan active</strong><span>The pilot command center, reports, and billing record are connected.</span></div></div>}
      </>}
      {error && <p className={styles.error}>{error}</p>}{notice && <p className={styles.notice}>{notice}</p>}
      <footer><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</button><div>{!agreementAccepted && <button type="button" onClick={() => void save(false)} disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>}{step < 3 && <button type="button" className={styles.next} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={14} /></button>}</div></footer>
    </section>
  </main>;
}

function Heading({ icon, eyebrow, title, copy }: { icon: React.ReactNode; eyebrow: string; title: string; copy: string }) { return <div className={styles.heading}><i>{icon}</i><div><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div></div>; }
function Field({ label, value, onChange, wide, optional, type = "text", disabled }: { label: string; value: string; onChange?: (value: string) => void; wide?: boolean; optional?: boolean; type?: string; disabled?: boolean }) { return <label className={wide ? styles.wide : undefined}>{label}{optional && <span>Optional</span>}<input type={type} value={value} disabled={disabled} onChange={(event) => onChange?.(event.target.value)} /></label>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) { return <label><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>; }
function Milestone({ complete, title, copy }: { complete: boolean; title: string; copy: string }) { return <div data-complete={complete}><i>{complete ? <Check size={15} /> : null}</i><strong>{title}</strong><span>{copy}</span></div>; }
function Status({ status }: { status: string }) { return <div className={styles.status} data-status={status}><i />{status.replaceAll("_", " ").toLowerCase()}</div>; }
function State({ title, copy, loading }: { title: string; copy: string; loading?: boolean }) { return <main className={styles.state}>{loading && <Loader2 />}<h1>{title}</h1><p>{copy}</p>{!loading && <Link href="/programs">Open programs</Link>}</main>; }
