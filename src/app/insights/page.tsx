import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { MarketingShell, marketingStyles as styles } from "@/components/marketing/MarketingShell";
import { getPublishedInsights } from "@/lib/growth/insights";

export const metadata: Metadata = {
  title: "Residency training operations insights",
  description: "Practical guidance on surgical case logging, EPA completion, competence committees, accreditation evidence, and residency-program adoption.",
  alternates: { canonical: "/insights", types: { "application/rss+xml": "https://hippomedicine.com/insights/feed.xml" } },
  robots: { index: true, follow: true },
};

export default function InsightsPage() {
  const published = getPublishedInsights();
  return <MarketingShell><main>
    <section className={styles.hero}><div className={styles.heroInner}><div><p className={styles.eyebrow}>Hippo field notes</p><h1>Residency training operations, made practical.</h1><p className={styles.heroCopy}>Short, useful frameworks for residents, program directors, coordinators, faculty, and competence committees.</p></div><aside className={styles.heroAside}><strong>Published weekly</strong><p>Evergreen operational guidance, automatically added to the Hippo feed and sitemap when its publication date arrives.</p></aside></div></section>
    <section className={styles.band}><div className={styles.inner}>
      <div className={styles.articleList}>{published.map((insight) => <a className={styles.articleRow} href={`/insights/${insight.slug}`} key={insight.slug}><span className={styles.articleMeta}>{insight.audience}<br />{insight.readMinutes} min read</span><div><h2>{insight.title}</h2><p>{insight.description}</p></div><ArrowRight size={20} /></a>)}</div>
    </div></section>
  </main></MarketingShell>;
}
