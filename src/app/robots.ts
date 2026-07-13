import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/pricing", "/program-demo", "/legal/"], disallow: ["/api/", "/dashboard", "/cases", "/clinic", "/settings", "/programs"] },
    sitemap: "https://hippomedicine.com/sitemap.xml",
  };
}
