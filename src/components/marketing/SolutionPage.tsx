import { ArrowRight, Check } from "lucide-react";
import { MarketingShell, marketingStyles as styles } from "./MarketingShell";
import { GrowthLink } from "./GrowthLink";
import type { Solution } from "@/lib/growth/solutions";

export function SolutionPage({ solution }: { solution: Solution }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: solution.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hippo",
    applicationCategory: "MedicalApplication",
    operatingSystem: "Web",
    url: `https://hippomedicine.com/${solution.slug}`,
    description: solution.description,
    offers: { "@type": "Offer", price: solution.residentCta ? "0" : undefined, priceCurrency: "CAD" },
  };

  return <MarketingShell>
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <section className={styles.hero}><div className={styles.heroInner}>
        <div>
          <p className={styles.eyebrow}>{solution.eyebrow}</p>
          <h1>{solution.title}</h1>
          <p className={styles.heroCopy}>{solution.heroCopy}</p>
          <div className={styles.actions}>
            <GrowthLink placement={`${solution.slug}-primary`} href={solution.residentCta ? "/signup?utm_source=seo&utm_medium=organic&utm_campaign=resident_tools" : `/pilot?utm_source=seo&utm_medium=organic&utm_campaign=${solution.slug}`} className={styles.actionPrimary}>
              {solution.residentCta ? "Create free account" : "Request a 30-day pilot"} <ArrowRight size={17} />
            </GrowthLink>
            <GrowthLink placement={`${solution.slug}-demo`} href="/program-demo" className={styles.actionSecondary}>View the live demo</GrowthLink>
          </div>
        </div>
        <aside className={styles.heroAside}><strong>{solution.asideMetric}</strong><p>{solution.asideCopy}</p></aside>
      </div></section>

      <section className={styles.band}><div className={styles.inner}>
        <div className={styles.sectionHead}><h2>Designed around the work, not another reporting burden.</h2><p>Hippo turns routine resident and faculty activity into useful personal feedback, program oversight, and formal evidence. The resident experience remains free and free of third-party advertising.</p></div>
        <div className={styles.featureGrid}>{solution.features.map(({ title, copy, icon: Icon }) => <article className={styles.feature} key={title}><Icon size={24} /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div></section>

      <section className={styles.band}><div className={styles.inner}>
        <div className={styles.sectionHead}><h2>What the pilot includes</h2><p>A structured 30-day evaluation gives the program a working cohort, weekly program-director summaries, measurable success criteria, and a decision-ready closeout.</p></div>
        <div className={styles.proofStrip} style={{ borderColor: "#cfd8d3" }}>
          {["Guided onboarding", "Realistic starting data", "Weekly action brief", "Executive outcome report"].map((item) => <div key={item} style={{ borderColor: "#cfd8d3" }}><Check size={18} color="#087a55" /><strong style={{ color: "#10211b", marginTop: 12 }}>{item}</strong></div>)}
        </div>
      </div></section>

      <section className={styles.band}><div className={styles.inner}>
        <div className={styles.sectionHead}><h2>Questions programs ask</h2><p>Clear expectations make institutional adoption easier for residents, faculty, leadership, privacy teams, and procurement.</p></div>
        <div className={styles.faq}>{solution.faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}</div>
      </div></section>

      <section className={styles.ctaBand}><div className={styles.inner}><div><h2>{solution.residentCta ? "Own your training record." : "See the workflow with your program."}</h2><p>{solution.residentCta ? "Start logging today. No trial clock and no resident subscription." : "Define the cohort, success measures, and procurement path in one guided pilot."}</p></div><GrowthLink placement={`${solution.slug}-bottom`} href={solution.residentCta ? "/signup" : "/pilot"} className={styles.actionPrimary}>{solution.residentCta ? "Start free" : "Request a pilot"} <ArrowRight size={17} /></GrowthLink></div></section>
    </main>
  </MarketingShell>;
}
