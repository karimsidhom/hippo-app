import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, ClipboardCheck, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Free surgical case log for residents",
  description: "Log cases, track EPAs, export your portfolio, and understand your operative growth. Hippo is free for residents and fellows.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

const residentFeatures = [
  "Unlimited case logging across every specialty",
  "EPA requests, milestones, and learning curves",
  "Interview-ready PDF and spreadsheet exports",
  "Private by default, with no advertising",
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hippo",
    applicationCategory: "MedicalApplication",
    operatingSystem: "Web",
    url: "https://hippomedicine.com",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: "A free surgical case log and competency tracker for residents and fellows.",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#07110f", color: "#f3f7f5" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <style>{`@media (max-width: 560px) { .secondary-nav-link { display: none; } .marketing-nav-actions { gap: 8px !important; } }`}</style>
      <nav aria-label="Main navigation" style={{ maxWidth: 1120, margin: "0 auto", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none", fontSize: 20, fontWeight: 800 }}>Hippo</Link>
        <div className="marketing-nav-actions" style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 14 }}>
          <Link className="secondary-nav-link" href="/pricing" style={{ color: "#b7c8c2", textDecoration: "none" }}>For programs</Link>
          <Link className="secondary-nav-link" href="/login" style={{ color: "#f3f7f5", textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ color: "#06251c", background: "#77e2ba", padding: "10px 14px", borderRadius: 6, fontWeight: 800, textDecoration: "none" }}>Create free account</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(64px, 10vw, 132px) 24px 72px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 64, alignItems: "center" }}>
        <div>
          <p style={{ color: "#77e2ba", fontWeight: 800, textTransform: "uppercase", fontSize: 12 }}>Built for surgical training</p>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 78px)", lineHeight: 0.98, letterSpacing: 0, margin: "18px 0 24px", maxWidth: 780 }}>Your surgical growth, finally visible.</h1>
          <p style={{ color: "#b7c8c2", fontSize: 20, lineHeight: 1.6, maxWidth: 650 }}>Hippo turns daily case logging into a clear record of your operative experience, competency, and progress. Free for residents and fellows, always.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 34 }}>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#06251c", background: "#77e2ba", padding: "14px 18px", borderRadius: 6, fontWeight: 800, textDecoration: "none" }}>Start logging free <ArrowRight size={18} /></Link>
            <Link href="/program-demo" style={{ color: "#f3f7f5", border: "1px solid #2a443b", padding: "14px 18px", borderRadius: 6, fontWeight: 700, textDecoration: "none" }}>View program demo</Link>
          </div>
        </div>
        <div style={{ border: "1px solid #29443a", background: "#0c1b17", borderRadius: 8, padding: "clamp(24px, 5vw, 42px)" }}>
          <p style={{ margin: 0, color: "#77e2ba", fontWeight: 800 }}>Resident plan</p>
          <p style={{ fontSize: 52, margin: "10px 0 24px", fontWeight: 800 }}>$0 <span style={{ fontSize: 15, color: "#8ea49c", fontWeight: 500 }}>/ forever</span></p>
          <div style={{ display: "grid", gap: 17 }}>
            {residentFeatures.map((feature) => <div key={feature} style={{ display: "flex", gap: 12, color: "#d5e0dc" }}><Check size={19} color="#77e2ba" aria-hidden />{feature}</div>)}
          </div>
        </div>
      </section>

      <section style={{ borderTop: "1px solid #1d312a", borderBottom: "1px solid #1d312a", background: "#0a1613" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          {[[ClipboardCheck, "Log in seconds", "Capture the case, role, procedure, and learning point while it is fresh."], [BarChart3, "See real progress", "Understand volume, autonomy, and gaps without building another spreadsheet."], [Users, "Connect training", "Request EPA feedback and share only what your training team needs."], [ShieldCheck, "Protect the record", "Private by default and designed for Canadian healthcare privacy expectations."]].map(([Icon, title, copy]) => { const FeatureIcon = Icon as typeof ClipboardCheck; return <article key={String(title)}><FeatureIcon size={25} color="#77e2ba" /><h2 style={{ fontSize: 18, margin: "16px 0 8px" }}>{String(title)}</h2><p style={{ color: "#9db0a9", lineHeight: 1.6, margin: 0 }}>{String(copy)}</p></article>; })}
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "86px 24px", textAlign: "center" }}>
        <p style={{ color: "#77e2ba", fontWeight: 800 }}>Programs pay. Residents do not.</p>
        <h2 style={{ fontSize: "clamp(30px, 5vw, 48px)", margin: "14px 0 18px" }}>Give your program a live view of training quality.</h2>
        <p style={{ color: "#9db0a9", lineHeight: 1.7, fontSize: 18 }}>Program subscriptions fund the free resident product and add cohort oversight, accreditation-ready reporting, faculty workflows, onboarding, and priority support.</p>
        <Link href="/program-demo" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24, color: "#77e2ba", fontWeight: 800, textDecoration: "none" }}>Explore the command center <ArrowRight size={18} /></Link>
      </section>
    </main>
  );
}
