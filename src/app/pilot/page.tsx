import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { MarketingShell, marketingStyles as styles } from "@/components/marketing/MarketingShell";
import { PilotLeadForm } from "@/components/marketing/PilotLeadForm";

export const metadata: Metadata = {
  title: "Request a 30-day residency program pilot",
  description: "Run a guided 30-day Hippo pilot with realistic onboarding, weekly program-director summaries, accreditation reports, and an executive outcome report.",
  alternates: { canonical: "/pilot" },
  robots: { index: true, follow: true },
};

export default function PilotPage() {
  return <MarketingShell><main>
    <section className={styles.hero}><div className={styles.heroInner}>
      <div><p className={styles.eyebrow}>30-day institutional pilot</p><h1>See whether Hippo improves your program before you buy it.</h1><p className={styles.heroCopy}>Start with an agreed cohort and baseline. Hippo guides onboarding, reports weekly adoption and training signals, and produces a decision-ready executive report at the end.</p></div>
      <aside className={styles.heroAside}><strong>No resident fee</strong><p>The institutional pilot evaluates program-level value while residents continue to use their personal training tools free.</p></aside>
    </div></section>
    <section className={styles.band}><div className={styles.inner}>
      <div className={styles.sectionHead}><h2>A measurable pilot, not an open-ended trial.</h2><div><p>Before launch, the program defines its cohort, workflow, reporting needs, and success measures.</p><div style={{ display: "grid", gap: 12, marginTop: 22 }}>{["Guided roster, role, and framework setup", "Realistic demo data before the first live entries", "Automated weekly program-director summaries", "Accreditation-format exports and pilot report", "Agreement, procurement, and live billing workflow"].map((item) => <span key={item} style={{ display: "flex", gap: 10, alignItems: "center", color: "#3f554b" }}><CheckCircle2 size={18} color="#087a55" />{item}</span>)}</div></div></div>
      <PilotLeadForm />
    </div></section>
  </main></MarketingShell>;
}
