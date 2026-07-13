"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { marketingStyles as styles } from "./MarketingShell";

type State = "idle" | "submitting" | "success" | "error";

export function PilotLeadForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      role: form.get("role"),
      institution: form.get("institution"),
      programName: form.get("programName") || null,
      specialty: form.get("specialty") || null,
      residentCount: form.get("residentCount") ? Number(form.get("residentCount")) : null,
      country: form.get("country") || null,
      message: form.get("message") || null,
      consent: form.get("consent") === "on",
      website: form.get("website") || "",
    };
    try {
      const response = await fetch("/api/growth/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We could not send the request.");
      setState("success");
      setMessage("Your pilot request is in. We will follow up with the 30-day scope and onboarding steps.");
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not send the request. Please try again.");
    }
  }

  return <form className={styles.formWrap} onSubmit={submit}>
    <div className={styles.formGrid}>
      <div className={styles.honeypot} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className={styles.field}><label htmlFor="pilot-name">Your name</label><input id="pilot-name" name="name" autoComplete="name" required maxLength={120} /></div>
      <div className={styles.field}><label htmlFor="pilot-email">Work email</label><input id="pilot-email" name="email" type="email" autoComplete="email" required maxLength={180} /></div>
      <div className={styles.field}><label htmlFor="pilot-role">Role</label><select id="pilot-role" name="role" required defaultValue=""><option value="" disabled>Select role</option><option>Program Director</option><option>Department Chair</option><option>Program Coordinator</option><option>Competence Committee Member</option><option>Faculty</option><option>Privacy or Procurement</option><option>Other</option></select></div>
      <div className={styles.field}><label htmlFor="pilot-institution">Institution</label><input id="pilot-institution" name="institution" autoComplete="organization" required maxLength={180} /></div>
      <div className={styles.field}><label htmlFor="pilot-program">Program name</label><input id="pilot-program" name="programName" maxLength={180} placeholder="Urology Residency" /></div>
      <div className={styles.field}><label htmlFor="pilot-specialty">Specialty</label><input id="pilot-specialty" name="specialty" maxLength={120} /></div>
      <div className={styles.field}><label htmlFor="pilot-residents">Number of residents</label><input id="pilot-residents" name="residentCount" type="number" min={1} max={2000} inputMode="numeric" /></div>
      <div className={styles.field}><label htmlFor="pilot-country">Country</label><input id="pilot-country" name="country" autoComplete="country-name" maxLength={100} defaultValue="Canada" /></div>
      <div className={`${styles.field} ${styles.fieldFull}`}><label htmlFor="pilot-message">What would make the pilot useful?</label><textarea id="pilot-message" name="message" maxLength={2000} placeholder="Current workflow, reporting needs, or target start date" /></div>
      <label className={`${styles.consent} ${styles.fieldFull}`}><input type="checkbox" name="consent" required /><span>I agree that Hippo Medicine may contact me about this institutional pilot. I can ask Hippo to stop at any time.</span></label>
      {message && <div className={`${styles.formMessage} ${state === "success" ? styles.success : styles.error} ${styles.fieldFull}`} role="status">{message}</div>}
      <div className={styles.fieldFull}><button className={styles.submit} type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending…" : "Request the pilot"} <ArrowRight size={17} /></button></div>
    </div>
  </form>;
}
