import type { MetadataRoute } from "next";
import { getPublishedInsights } from "@/lib/growth/insights";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-07-13T12:00:00.000Z");
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://hippomedicine.com", lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: "https://hippomedicine.com/surgical-case-log", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://hippomedicine.com/epa-tracking", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://hippomedicine.com/residency-program-dashboard", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://hippomedicine.com/accreditation-reporting", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://hippomedicine.com/pilot", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://hippomedicine.com/insights", lastModified: updated, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://hippomedicine.com/pricing", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://hippomedicine.com/program-demo", lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://hippomedicine.com/legal/institutional-agreement", lastModified: updated, changeFrequency: "monthly", priority: 0.5 },
    { url: "https://hippomedicine.com/legal/privacy", lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://hippomedicine.com/legal/terms", lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
  ];
  const articles: MetadataRoute.Sitemap = getPublishedInsights().map((insight) => ({
    url: `https://hippomedicine.com/insights/${insight.slug}`,
    lastModified: new Date(insight.publishedAt),
    changeFrequency: "yearly",
    priority: 0.65,
  }));
  return [...staticPages, ...articles];
}
