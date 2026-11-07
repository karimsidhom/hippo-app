"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECIALTIES, USER_ROLE_TYPES, PGY_YEARS } from "@/lib/constants";
import { POLICY_KEYS, POLICY_VERSIONS, POLICY_META, type PolicyKey } from "@/lib/legal";
import { ProgramPicker, type PickedProgram } from "@/components/programs/ProgramPicker";
import { BadgeCheck, Check, ClipboardList, ExternalLink, GraduationCap, NotebookPen } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";
import "./onboarding.css";

const TOTAL_STEPS = 11;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError,setSaveError]=useState('');
  // Optional program chosen in step 9. Null means they skipped it.
  const [program, setProgram] = useState<PickedProgram | null>(null);

  const [form, setForm] = useState({
    roleType: "RESIDENT",
    trainingCountry: "",
    specialty: "",
    pgyYear: 3,
    institution: "",
    city: "",
    publicProfile: false,
    allowBenchmarkSharing: true,
    phiaAgreed: false,
  });

  // Per-policy acceptance. Every key in POLICY_KEYS must be true before
  // the user can leave step 3 or finish onboarding.
  const [legalAccepted, setLegalAccepted] = useState<Record<PolicyKey, boolean>>(
    () => Object.fromEntries(POLICY_KEYS.map((k) => [k, false])) as Record<PolicyKey, boolean>,
  );
  const allLegalAccepted = POLICY_KEYS.every((k) => legalAccepted[k]) && form.phiaAgreed;

  // Institution is required for staff / attending / PD roles
  const ROLES_REQUIRING_INSTITUTION = ["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"];
  const institutionRequired = ROLES_REQUIRING_INSTITUTION.includes(form.roleType);

  const update = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }));
  const toggleLegal = (key: PolicyKey) =>
    setLegalAccepted((prev) => ({ ...prev, [key]: !prev[key] }));

  const recordLegalAcceptances = async () => {
    // Only POST acceptances that the user actually ticked. The server
    // enforces version match against POLICY_VERSIONS.
    const acceptances = POLICY_KEYS.filter((k) => legalAccepted[k]).map((k) => ({
      policyKey: k,
      version: POLICY_VERSIONS[k],
    }));
    if (acceptances.length === 0) return;
    const response=await fetch("/api/legal/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptances }),
    });
    if(!response.ok)throw new Error('Your policy acceptance could not be saved. Please retry.');
  };

  // Fired after the profile is saved. Non-blocking by design: onboarding has
  // already saved the profile by this point, and an unsent request can
  // be retried from the dashboard card or from Programs.
  const requestProgramJoin = async () => {
    if (!program) return;
    await fetch(`/api/programs/${program.id}/join-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimedPgy: form.pgyYear }),
    }).catch(() => {});
  };

  const handleFinish = async () => {
    setSaving(true);setSaveError('');
    try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { phiaAgreed: _, ...profileData } = form;
    await recordLegalAcceptances();
    const profileResponse=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      ...profileData,
      onboardingCompleted: true,
      trainingYearLabel: form.trainingCountry === "SMSNA" ? "SMSNA Fellow" : `PGY-${form.pgyYear}`,
      trainingCountry: form.trainingCountry || undefined,
    })});
    if(!profileResponse.ok)throw new Error('Your profile completion could not be saved. Please retry.');
    await requestProgramJoin();
    setSaving(false);
    // Last onboarding beat: the install step. It knows how to self-skip
    // when the user is already running as a PWA (re-onboarding inside
    // an installed app) or when install isn't supported in the browser.
    window.location.assign("/onboarding/install");
    } catch(error) {setSaveError(error instanceof Error?error.message:'Could not complete setup. Please retry.');} finally {setSaving(false);}
  };

  const continueDisabled =
    (step === 3 && !allLegalAccepted) ||
    (step === 8 && institutionRequired && !form.institution.trim());
  const continueHint = step === 3 && !allLegalAccepted
    ? "Accept all policies and the privacy pledge to continue"
    : step === 8 && institutionRequired && !form.institution.trim()
      ? "Add your institution to continue"
      : "";
  const sectionName = step <= 2 ? "WELCOME"
    : step === 3 ? "AGREEMENTS"
      : step <= 8 ? "ABOUT YOU"
        : step === 9 ? "YOUR PROGRAM"
          : step === 10 ? "PRIVACY" : "READY";
  const countries = [
    { value: "US", label: "United States", description: "ACGME milestones and EPAs" },
    { value: "CA", label: "Canada", description: "Royal College CBD and CanMEDS" },
    { value: "SMSNA", label: "SMSNA Fellowship", description: "Sexual medicine fellowship: SMSNA case log and OPRS assessments" },
  ];
  const countryLabel = countries.find((country) => country.value === form.trainingCountry)?.label || "Not selected";
  const yearLabel = form.trainingCountry === "SMSNA"
    ? "SMSNA Fellow"
    : PGY_YEARS.find((year) => year.value === form.pgyYear)?.label;

  return (
    <div className="onboarding">
      {saveError && <p role="alert" style={{padding:12,color:'var(--danger, #9b3128)'}}>{saveError}</p>}
      <header className="onboarding__topbar">
        <div className="onboarding__topbar-inner">
          <div className="onboarding__brand">
            <HippoMark size={28} />
            <span>Hippo Cases</span>
          </div>
          <p className="onboarding__eyebrow">Step {step} of {TOTAL_STEPS}</p>
        </div>
        <div className="onboarding__progress" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              className={`onboarding__progress-segment${index < step ? " onboarding__progress-segment--complete" : ""}`}
              aria-current={index + 1 === step ? "step" : undefined}
            />
          ))}
        </div>
      </header>

      <main key={step} className="onboarding__main" aria-labelledby="onboarding-title">
        <section className="onboarding__step">
          <p className="onboarding__eyebrow onboarding__section-label">{sectionName}</p>

          {step === 1 && (
            <>
              <div className="onboarding__welcome-mark"><HippoMark size={56} /></div>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Welcome to Hippo Cases</h1>
                <p className="onboarding__description">
                  Your private surgical case log. Log a case in seconds, get your EPAs signed, and keep notes on what each case taught you. A few questions first so Hippo fits your training.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">What you can do here</h1>
              </div>
              <div className="onboarding__stack">
                {[
                  { icon: ClipboardList, title: "Log a case", description: "Procedure, role and autonomy in a few taps, from the + at the bottom of the screen." },
                  { icon: BadgeCheck, title: "EPAs", description: "Send an observation to your attending and get it signed in Hippo." },
                  { icon: NotebookPen, title: "Case notes", description: "Private notes and reflections, tied to each case." },
                  { icon: GraduationCap, title: "Your program", description: "The program calendar, shared documents and your progress." },
                ].map(({ icon: Icon, title, description }) => (
                  <div key={title} className="onboarding__feature">
                    <span className="onboarding__feature-icon"><Icon size={20} aria-hidden="true" /></span>
                    <div>
                      <h2>{title}</h2>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="onboarding__muted">Community and friends live in Hippo Pulse.</p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Agreements</h1>
                <p className="onboarding__description">Read each one and tick to accept. We record the version and time of each acceptance.</p>
              </div>
              <div className="onboarding__stack">
                {POLICY_KEYS.map((key) => {
                  const meta = POLICY_META[key];
                  const checked = legalAccepted[key];
                  return (
                    <label key={key} className={`onboarding__policy${checked ? " onboarding__policy--accepted" : ""}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleLegal(key)} />
                      <span className="onboarding__policy-content">
                        <span className="onboarding__policy-heading">
                          <span className="onboarding__policy-title">I have read &amp; agree to the {meta.title}</span>
                          <Link
                            href={meta.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="onboarding__policy-link"
                          >
                            Read <ExternalLink size={12} aria-hidden="true" />
                          </Link>
                        </span>
                        <span className="onboarding__policy-summary">{meta.summary}</span>
                        <span className="onboarding__eyebrow onboarding__policy-version">v{POLICY_VERSIONS[key]}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="onboarding__card onboarding__pledge">
                <h2>Patient privacy pledge</h2>
                {[
                  "I will never enter patient names, health-card numbers, MRNs, or other identifiers.",
                  "I will use age groups or decades instead of exact dates of birth.",
                  "I understand Hippo scrubs for PHI patterns automatically, but I am ultimately responsible.",
                ].map((item) => (
                  <div key={item} className="onboarding__pledge-item">
                    <Check size={14} aria-hidden="true" />
                    <p>{item}</p>
                  </div>
                ))}
                <label className="onboarding__pledge-accept">
                  <input
                    type="checkbox"
                    checked={form.phiaAgreed}
                    onChange={(event) => update({ phiaAgreed: event.target.checked })}
                  />
                  <span>I understand and commit to never entering patient-identifying information in Hippo.</span>
                </label>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Your role</h1>
                <p className="onboarding__description">This sets what Hippo shows you.</p>
              </div>
              <div className="onboarding__stack" role="group" aria-label="Your role">
                {USER_ROLE_TYPES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    aria-pressed={form.roleType === role.value}
                    onClick={() => update({ roleType: role.value })}
                    className="onboarding__option"
                  >
                    <span className="onboarding__option-copy">
                      <span className="onboarding__option-title">{role.label}</span>
                      <span className="onboarding__option-description">{role.description}</span>
                    </span>
                    <span className="onboarding__option-check" aria-hidden="true">
                      {form.roleType === role.value && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Where you train</h1>
                <p className="onboarding__description">This sets your case-log categories and assessment framework.</p>
              </div>
              <div className="onboarding__stack" role="group" aria-label="Training country">
                {countries.map((country) => (
                  <button
                    key={country.value}
                    type="button"
                    aria-pressed={form.trainingCountry === country.value}
                    onClick={() => {
                      update({ trainingCountry: country.value });
                      if (country.value === "SMSNA") {
                        update({ roleType: "FELLOW", pgyYear: 6, specialty: form.specialty || "Andrology" });
                      }
                    }}
                    className="onboarding__option"
                  >
                    <span className="onboarding__option-copy">
                      <span className="onboarding__option-title">{country.label}</span>
                      <span className="onboarding__option-description">{country.description}</span>
                    </span>
                    <span className="onboarding__option-check" aria-hidden="true">
                      {form.trainingCountry === country.value && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Your specialty</h1>
                <p className="onboarding__description">Choose your primary surgical specialty.</p>
              </div>
              <div className="onboarding__grid" role="group" aria-label="Your specialty">
                {SPECIALTIES.map((specialty) => (
                  <button
                    key={specialty.slug}
                    type="button"
                    aria-pressed={form.specialty === specialty.name}
                    onClick={() => update({ specialty: specialty.name })}
                    className="onboarding__option onboarding__option--tile"
                  >
                    <span className="onboarding__option-title">{specialty.name}</span>
                    <span className="onboarding__option-check" aria-hidden="true">
                      {form.specialty === specialty.name && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Training year</h1>
                <p className="onboarding__description">Used for your progress and EPA expectations.</p>
              </div>
              <div className="onboarding__grid" role="group" aria-label="Training year">
                {PGY_YEARS.map((year) => (
                  <button
                    key={year.value}
                    type="button"
                    aria-pressed={form.pgyYear === year.value}
                    onClick={() => update({ pgyYear: year.value })}
                    className="onboarding__option onboarding__option--tile"
                  >
                    <span className="onboarding__option-copy">
                      <span className="onboarding__option-title">{year.label}</span>
                      {year.description && <span className="onboarding__option-description">{year.description}</span>}
                    </span>
                    <span className="onboarding__option-check" aria-hidden="true">
                      {form.pgyYear === year.value && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 8 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Your institution</h1>
                <p className="onboarding__description">
                  {institutionRequired ? "Required for staff, attendings and program directors." : "Optional for residents and fellows."}
                </p>
              </div>
              <div className="onboarding__fields">
                <div className="onboarding__field">
                  <label htmlFor="onboarding-institution">Institution / Hospital{institutionRequired && <span aria-hidden="true"> *</span>}</label>
                  <input
                    id="onboarding-institution"
                    type="text"
                    value={form.institution}
                    onChange={(event) => update({ institution: event.target.value })}
                    placeholder="e.g. University Health Network"
                    required={institutionRequired}
                    aria-describedby={institutionRequired && !form.institution.trim() ? "onboarding-institution-hint" : undefined}
                    className="onboarding__input"
                  />
                  {institutionRequired && !form.institution.trim() && (
                    <p id="onboarding-institution-hint" className="onboarding__field-hint">Institution is required for your selected role.</p>
                  )}
                </div>
                <div className="onboarding__field">
                  <label htmlFor="onboarding-city">City</label>
                  <input
                    id="onboarding-city"
                    type="text"
                    value={form.city}
                    onChange={(event) => update({ city: event.target.value })}
                    placeholder="e.g. Toronto"
                    className="onboarding__input"
                  />
                </div>
              </div>
            </>
          )}

          {step === 9 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Your program</h1>
                <p className="onboarding__description">
                  Join your training program so your program director can see your progress. Optional, and you can join later.
                </p>
              </div>
              <div className={`onboarding__program-picker${program ? " onboarding__program-picker--selected" : ""}`}>
                <ProgramPicker value={program} onChange={setProgram} />
              </div>
            </>
          )}

          {step === 10 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">Privacy</h1>
                <p className="onboarding__description">You can change these any time in Settings.</p>
              </div>
              <div className="onboarding__stack">
                {[
                  { key: "publicProfile" as const, label: "Public profile", description: "Program members and colleagues can see your profile." },
                  { key: "allowBenchmarkSharing" as const, label: "Contribute to benchmarks", description: "Adds your anonymized case counts to national benchmarks." },
                ].map(({ key, label, description }) => (
                  <div key={key} className="onboarding__privacy-row">
                    <div>
                      <p id={`onboarding-${key}-label`} className="onboarding__option-title">{label}</p>
                      <p id={`onboarding-${key}-description`} className="onboarding__option-description">{description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form[key]}
                      aria-labelledby={`onboarding-${key}-label`}
                      aria-describedby={`onboarding-${key}-description`}
                      onClick={() => update({ [key]: !form[key] })}
                      className="onboarding__switch"
                    >
                      <span className="onboarding__switch-track"><span className="onboarding__switch-thumb" /></span>
                    </button>
                  </div>
                ))}
              </div>
              <p className="onboarding__muted">Friends, leaderboards and community settings live in Hippo Pulse.</p>
            </>
          )}

          {step === 11 && (
            <>
              <div className="onboarding__heading">
                <h1 id="onboarding-title" className="onboarding__title">You're set</h1>
                <p className="onboarding__description">Here is what we saved. You can change any of it in Settings.</p>
              </div>
              <dl className="onboarding__card onboarding__summary">
                <div><dt>Role</dt><dd>{USER_ROLE_TYPES.find((role) => role.value === form.roleType)?.label}</dd></div>
                <div><dt>Training</dt><dd>{countryLabel}, {yearLabel}</dd></div>
                <div><dt>Specialty</dt><dd>{form.specialty || "Not selected"}</dd></div>
                {form.institution.trim() && <div><dt>Institution</dt><dd>{form.institution}</dd></div>}
                {program && <div><dt>Program</dt><dd>We'll ask {program.name} to add you</dd></div>}
              </dl>
            </>
          )}
        </section>
      </main>

      <footer className="onboarding__footer">
        <div className="onboarding__footer-inner">
          <p className="onboarding__footer-hint" aria-live="polite">{continueHint}</p>
          <div className="onboarding__actions">
            {step === 1 ? (
              <button type="button" onClick={() => setStep(2)} className="onboarding__button onboarding__button--primary onboarding__button--full">Get started</button>
            ) : (
              <>
                <button type="button" onClick={() => setStep(Math.max(1, step - 1))} className="onboarding__button onboarding__button--quiet">Back</button>
                {step < TOTAL_STEPS ? (
                  <button type="button" onClick={() => setStep(step + 1)} disabled={continueDisabled} className="onboarding__button onboarding__button--primary">Continue</button>
                ) : (
                  <button type="button" onClick={handleFinish} disabled={saving} className="onboarding__button onboarding__button--primary">{saving ? "Saving..." : "Finish setup"}</button>
                )}
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
