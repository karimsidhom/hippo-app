import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/cases", "/clinic", "/settings", "/programs", "/business-growth", "/share-hippo", "/institutional-agreement/"] },
    sitemap: "https://hippomedicine.com/sitemap.xml",
  };
}
