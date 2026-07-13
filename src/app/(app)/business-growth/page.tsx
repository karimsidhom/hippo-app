import { redirect } from "next/navigation";
import { ArrowUpRight, Eye, Link2, MailCheck, UserPlus } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { isBusinessOwner } from "@/lib/growth/owner";

function delta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "New" : "No change";
  const value = Math.round(((current - previous) / previous) * 100);
  return `${value >= 0 ? "+" : ""}${value}% vs prior week`;
}

export default async function BusinessGrowthPage() {
  const auth = await requireAuth();
  if (auth.error || !(await isBusinessOwner(auth.user.id, auth.user.email))) redirect("/dashboard");

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const priorStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const [views, priorViews, leads, priorLeads, signups, priorSignups, clicks, recentLeads, sources, referralTotals, contentViews] = await Promise.all([
    db.growthEvent.count({ where: { name: "page_view", createdAt: { gte: weekStart } } }),
    db.growthEvent.count({ where: { name: "page_view", createdAt: { gte: priorStart, lt: weekStart } } }),
    db.growthLead.count({ where: { createdAt: { gte: weekStart } } }),
    db.growthLead.count({ where: { createdAt: { gte: priorStart, lt: weekStart } } }),
    db.growthEvent.count({ where: { name: "signup", createdAt: { gte: weekStart } } }),
    db.growthEvent.count({ where: { name: "signup", createdAt: { gte: priorStart, lt: weekStart } } }),
    db.growthEvent.count({ where: { name: "cta_click", createdAt: { gte: weekStart } } }),
    db.growthLead.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    db.growthEvent.groupBy({ by: ["source"], where: { name: "page_view", createdAt: { gte: weekStart } }, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 8 }),
    db.growthReferral.aggregate({ _sum: { clicks: true, signups: true }, _count: { _all: true } }),
    db.growthEvent.groupBy({ by: ["path"], where: { name: "page_view", createdAt: { gte: weekStart } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 8 }),
  ]);

  const metrics = [
    { label: "Page views", value: views, detail: delta(views, priorViews), icon: Eye },
    { label: "CTA clicks", value: clicks, detail: views ? `${Math.round((clicks / views) * 100)}% of views` : "No views yet", icon: ArrowUpRight },
    { label: "Resident signups", value: signups, detail: delta(signups, priorSignups), icon: UserPlus },
    { label: "Pilot requests", value: leads, detail: delta(leads, priorLeads), icon: MailCheck },
  ];

  return <main style={{ maxWidth: 1120, margin: "0 auto", padding: "42px 20px 90px" }}>
    <header style={{ borderBottom: "1px solid var(--border-mid)", paddingBottom: 28 }}><p style={{ margin: 0, color: "var(--primary)", fontSize: 11, fontWeight: 750, textTransform: "uppercase" }}>Hippo Business</p><h1 style={{ margin: "10px 0 8px", fontSize: 34, color: "var(--text)", letterSpacing: 0 }}>Organic Growth Command Center</h1><p style={{ margin: 0, color: "var(--text-2)", lineHeight: 1.6 }}>First-party discovery, conversion, resident sharing, and pilot demand for the last seven days.</p></header>

    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", borderLeft: "1px solid var(--border-mid)", marginTop: 28 }}>
      {metrics.map(({ label, value, detail, icon: Icon }) => <article key={label} style={{ padding: 22, borderTop: "1px solid var(--border-mid)", borderRight: "1px solid var(--border-mid)", borderBottom: "1px solid var(--border-mid)" }}><Icon size={18} color="var(--primary)" /><strong style={{ display: "block", marginTop: 22, color: "var(--text)", fontSize: 34 }}>{value}</strong><span style={{ display: "block", color: "var(--text-2)", fontSize: 13 }}>{label}</span><small style={{ display: "block", color: "var(--text-3)", marginTop: 7 }}>{detail}</small></article>)}
    </section>

    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 34, marginTop: 44 }}>
      <div><h2 style={{ color: "var(--text)", fontSize: 18, margin: "0 0 14px" }}>Top pages</h2><div style={{ borderTop: "1px solid var(--border-mid)" }}>{contentViews.map((item) => <div key={item.path} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}><span style={{ color: "var(--text-2)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{item.path}</span><strong style={{ color: "var(--text)", fontSize: 13 }}>{item._count._all}</strong></div>)}</div></div>
      <div><h2 style={{ color: "var(--text)", fontSize: 18, margin: "0 0 14px" }}>Discovery sources</h2><div style={{ borderTop: "1px solid var(--border-mid)" }}>{sources.map((item) => <div key={item.source || "direct"} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}><span style={{ color: "var(--text-2)", fontSize: 13 }}>{item.source || "Unattributed"}</span><strong style={{ color: "var(--text)", fontSize: 13 }}>{item._count._all}</strong></div>)}</div></div>
      <div><h2 style={{ color: "var(--text)", fontSize: 18, margin: "0 0 14px" }}>Resident referral loop</h2><div style={{ borderTop: "1px solid var(--border-mid)", paddingTop: 20 }}><Link2 size={20} color="var(--primary)" /><strong style={{ display: "block", color: "var(--text)", fontSize: 30, marginTop: 18 }}>{referralTotals._sum.signups || 0}</strong><p style={{ color: "var(--text-2)", margin: "4px 0" }}>signups from {referralTotals._sum.clicks || 0} shared-link visits</p><small style={{ color: "var(--text-3)" }}>{referralTotals._count._all} residents have created a referral link</small></div></div>
    </section>

    <section style={{ marginTop: 48 }}><h2 style={{ color: "var(--text)", fontSize: 18, margin: "0 0 14px" }}>Recent pilot requests</h2><div style={{ overflowX: "auto", borderTop: "1px solid var(--border-mid)" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}><thead><tr>{["Contact", "Institution", "Role", "Program", "Source", "Received"].map((heading) => <th key={heading} style={{ textAlign: "left", color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", padding: "12px 10px", borderBottom: "1px solid var(--border-mid)" }}>{heading}</th>)}</tr></thead><tbody>{recentLeads.map((lead) => <tr key={lead.id}><td style={{ padding: 10, borderBottom: "1px solid var(--border)", color: "var(--text)" }}><a href={`mailto:${lead.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{lead.name}</a></td><td style={{ padding: 10, borderBottom: "1px solid var(--border)", color: "var(--text-2)" }}>{lead.institution}</td><td style={{ padding: 10, borderBottom: "1px solid var(--border)", color: "var(--text-2)" }}>{lead.role}</td><td style={{ padding: 10, borderBottom: "1px solid var(--border)", color: "var(--text-2)" }}>{lead.programName || "—"}</td><td style={{ padding: 10, borderBottom: "1px solid var(--border)", color: "var(--text-2)" }}>{lead.source || "direct"}</td><td style={{ padding: 10, borderBottom: "1px solid var(--border)", color: "var(--text-3)" }}>{lead.createdAt.toLocaleDateString("en-CA")}</td></tr>)}</tbody></table>{recentLeads.length === 0 && <p style={{ color: "var(--text-3)", padding: "20px 10px" }}>No pilot requests yet.</p>}</div></section>
  </main>;
}
