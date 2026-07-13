import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingShell, marketingStyles as styles } from "@/components/marketing/MarketingShell";
import { getPublishedInsight } from "@/lib/growth/insights";
import { GrowthLink } from "@/components/marketing/GrowthLink";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = getPublishedInsight(slug);
  if (!insight) return { title: "Insight not found", robots: { index: false } };
  return { title: insight.title, description: insight.description, alternates: { canonical: `/insights/${slug}` }, robots: { index: true, follow: true }, openGraph: { title: insight.title, description: insight.description, type: "article", publishedTime: insight.publishedAt } };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = getPublishedInsight(slug);
  if (!insight) notFound();
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: insight.title, description: insight.description, datePublished: insight.publishedAt, author: { "@type": "Organization", name: "Hippo Medicine" }, publisher: { "@type": "Organization", name: "Hippo Medicine", url: "https://hippomedicine.com" }, mainEntityOfPage: `https://hippomedicine.com/insights/${insight.slug}` };
  return <MarketingShell><main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} /><article className={styles.innerNarrow}>
    <header className={styles.articleTop}><p className={styles.breadcrumbs}><a href="/insights">Insights</a> / {insight.audience}</p><h1>{insight.title}</h1><p className={styles.dek}>{insight.description}</p><p className={styles.articleMeta}>{new Date(insight.publishedAt).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} · {insight.readMinutes} min read</p></header>
    <div className={styles.articleBody}>{insight.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}</div>
    <section style={{ borderTop: "1px solid #d3dcd7", marginTop: 54, paddingTop: 34 }}><h2 style={{ marginTop: 0 }}>See the workflow in Hippo</h2><p style={{ color: "#4e6259", lineHeight: 1.7 }}>Residents can start free. Program leaders can explore the live command center or request a measured 30-day pilot.</p><div className={styles.actions}><GrowthLink placement="insight-resident" href="/signup?utm_source=insights&utm_medium=organic&utm_campaign=resident_tools" className={styles.actionPrimary} style={{ background: "#10211b", color: "#fff", borderColor: "#10211b" }}>Start free</GrowthLink><GrowthLink placement="insight-pilot" href="/pilot?utm_source=insights&utm_medium=organic&utm_campaign=program_pilot" className={styles.actionSecondary} style={{ color: "#10211b", borderColor: "#aebdb5" }}>Request a pilot</GrowthLink></div></section>
  </article></main></MarketingShell>;
}
