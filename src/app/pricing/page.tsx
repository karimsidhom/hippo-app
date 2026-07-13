import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Hippo is free for residents and fellows. Residency programs pay for cohort administration, accreditation reporting, and support.",
  alternates: { canonical: "/pricing" },
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return <main style={{ minHeight: "100vh", background: "#f4f6f3", color: "#10211b", padding: "24px" }}>
    <nav style={{ maxWidth: 1060, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link href="/" style={{ color: "inherit", fontWeight: 800, fontSize: 20, textDecoration: "none" }}>Hippo</Link><Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link></nav>
    <section style={{ maxWidth: 1060, margin: "0 auto", padding: "76px 0" }}>
      <p style={{ color: "#087a55", fontWeight: 800, textTransform: "uppercase", fontSize: 12 }}>Simple by design</p>
      <h1 style={{ fontSize: "clamp(38px, 7vw, 68px)", lineHeight: 1, letterSpacing: 0, maxWidth: 820, margin: "16px 0" }}>Free for residents. Valuable to programs.</h1>
      <p style={{ fontSize: 19, color: "#53645e", maxWidth: 720, lineHeight: 1.6 }}>Personal training tools stay free. Institutions subscribe only when Hippo saves their program leadership time and improves oversight.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 18, marginTop: 54 }}>
        <Plan name="Resident & Fellow" price="Free forever" copy="Everything an individual trainee needs to build and own a complete training record." features={["Unlimited cases and specialties", "EPA and milestone tracking", "PDF and spreadsheet exports", "Analytics and benchmarks", "No advertising"]} cta="Create free account" href="/signup" />
        <Plan name="Residency Program" price="30-day pilot" copy="Operational tools for program directors, coordinators, and faculty." features={["Program director command center", "Accreditation-ready reports", "Faculty assignment workflows", "Guided implementation", "Weekly pilot brief and outcome report"]} cta="Request a program pilot" href="/pilot" dark />
      </div>
      <p style={{ color: "#64736d", marginTop: 24, lineHeight: 1.6 }}>No patient information is sold. No resident advertising. A program subscription never controls a resident’s access to their personal logbook.</p>
    </section>
  </main>;
}

function Plan({ name, price, copy, features, cta, href, dark = false }: { name: string; price: string; copy: string; features: string[]; cta: string; href: string; dark?: boolean }) {
  return <article style={{ border: dark ? "1px solid #10211b" : "1px solid #ccd5d0", background: dark ? "#10211b" : "#fff", color: dark ? "#f5f7f5" : "#10211b", borderRadius: 8, padding: 30 }}><p style={{ margin: 0, color: dark ? "#77e2ba" : "#087a55", fontWeight: 800 }}>{name}</p><h2 style={{ fontSize: 32, margin: "10px 0" }}>{price}</h2><p style={{ minHeight: 54, color: dark ? "#b8c8c2" : "#5c6d66", lineHeight: 1.5 }}>{copy}</p><div style={{ display: "grid", gap: 12, margin: "26px 0" }}>{features.map((feature) => <span key={feature} style={{ display: "flex", gap: 10 }}><Check size={18} color="#24a879" />{feature}</span>)}</div><Link href={href} style={{ display: "block", textAlign: "center", padding: 13, borderRadius: 6, background: dark ? "#77e2ba" : "#10211b", color: dark ? "#10211b" : "white", fontWeight: 800, textDecoration: "none" }}>{cta}</Link></article>;
}
