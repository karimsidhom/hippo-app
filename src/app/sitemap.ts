import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();
  return [
    { url: "https://hippomedicine.com", lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: "https://hippomedicine.com/pricing", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://hippomedicine.com/program-demo", lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: "https://hippomedicine.com/legal/privacy", lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://hippomedicine.com/legal/terms", lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
  ];
}
