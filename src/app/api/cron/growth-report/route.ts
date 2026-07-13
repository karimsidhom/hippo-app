import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildDigestEmail } from "@/lib/email/digest-shell";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [views, clicks, signups, leads, topPages, sources, referrals] = await Promise.all([
    db.growthEvent.count({ where: { name: "page_view", createdAt: { gte: since } } }),
    db.growthEvent.count({ where: { name: "cta_click", createdAt: { gte: since } } }),
    db.growthEvent.count({ where: { name: "signup", createdAt: { gte: since } } }),
    db.growthLead.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.growthEvent.groupBy({ by: ["path"], where: { name: "page_view", createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 5 }),
    db.growthEvent.groupBy({ by: ["source"], where: { name: "page_view", createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 5 }),
    db.growthEvent.count({ where: { name: "signup", source: "resident_referral", createdAt: { gte: since } } }),
  ]);

  const digest = buildDigestEmail({
    eyebrow: "Organic growth weekly",
    subjectLead: `${leads.length} pilot request${leads.length === 1 ? "" : "s"}, ${signups} attributed signup${signups === 1 ? "" : "s"}`,
    greeting: "Hippo business update,",
    sections: [
      { heading: "Acquisition", bullets: [`${views} public page views`, `${clicks} calls to action clicked`, `${signups} attributed resident signups`, `${referrals} signups from resident referrals`], cta: { label: "Open growth command center", href: "/business-growth" } },
      { heading: `Pilot demand (${leads.length})`, bullets: leads.length ? leads.map((lead) => `${lead.name} — ${lead.institution} · ${lead.role}`) : ["No pilot requests this week"] },
      { heading: "Top public pages", bullets: topPages.length ? topPages.map((item) => `${item.path} — ${item._count._all} views`) : ["No public page views recorded"] },
      { heading: "Discovery sources", bullets: sources.length ? sources.map((item) => `${item.source || "Unattributed"} — ${item._count._all} views`) : ["No sources recorded"] },
    ],
    primaryCta: { label: "Open growth command center", href: "/business-growth" },
    unsubscribeUrl: "/business-growth",
    unsubscribeReason: "you are the Hippo business owner",
  });

  const ok = await sendEmail({ to: process.env.HIPPO_GROWTH_EMAIL || "legal@hippomedicine.com", subject: digest.subject, html: digest.html, text: digest.text });
  return NextResponse.json({ sent: ok, views, clicks, signups, leads: leads.length, referrals });
}

export async function GET(request: NextRequest) { return POST(request); }
