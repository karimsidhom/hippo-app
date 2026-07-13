import { getPublishedInsights } from "@/lib/growth/insights";

function xml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET() {
  const items = getPublishedInsights().map((insight) => `<item><title>${xml(insight.title)}</title><link>https://hippomedicine.com/insights/${xml(insight.slug)}</link><guid isPermaLink="true">https://hippomedicine.com/insights/${xml(insight.slug)}</guid><description>${xml(insight.description)}</description><pubDate>${new Date(insight.publishedAt).toUTCString()}</pubDate><category>${xml(insight.audience)}</category></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Hippo Residency Training Insights</title><link>https://hippomedicine.com/insights</link><description>Practical guidance for residents and residency program leaders.</description><language>en-ca</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
