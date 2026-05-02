"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   /welcome — feature tour
   The page residents see right after onboarding (and that anyone can revisit
   from Settings). Sectioned overview of every Hippo capability, written for
   a busy resident who needs to know what's here in 90 seconds.
   ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Mic2,
  GraduationCap,
  Receipt,
  TrendingUp,
  Trophy,
  Users,
  Bell,
  Sparkles,
  Shield,
  FileSpreadsheet,
  Smartphone,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { HippoMark } from "@/components/HippoMark";

const TEAL = "#0EA5E9";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Where in the app to actually use this. */
  cta?: { href: string; label: string };
}

const FEATURES: Feature[] = [
  {
    icon: ClipboardList,
    title: "Case logging",
    description:
      "One screen per case: procedure, autonomy level, attending, EBL, complications, your role, your reflection. " +
      "Stays on your phone, syncs to the cloud, and feeds every other feature in the app.",
    cta: { href: "/cases", label: "Log a case" },
  },
  {
    icon: Mic2,
    title: "Dictation engine",
    description:
      "Generates a complete operative note for every procedure across 10 specialties — textbook-grade, " +
      "with eponymous anatomy, named instruments, suture sizes, decision rationale, and explicit postop plans. " +
      "Polished by Claude Opus 4.6 against your learned style profile.",
    cta: { href: "/cases", label: "See an example" },
  },
  {
    icon: GraduationCap,
    title: "EPA observations",
    description:
      "Send any logged case to your attending for an EPA observation in two taps. They sign off from a single " +
      "batch screen on their phone. Royal College + ACGME mappings included.",
    cta: { href: "/epa", label: "Open EPAs" },
  },
  {
    icon: Receipt,
    title: "Billing / documentation support",
    description:
      "Optional, gated behind a province selector + on/off toggle. When on, every dictation appends a " +
      "billing-code section keyed to your province's fee schedule. Manitoba is fully verified; other " +
      "provinces ship as scaffolds until verified data lands.",
    cta: { href: "/settings/dictation", label: "Pick a province" },
  },
  {
    icon: TrendingUp,
    title: "Analytics & learning curves",
    description:
      "Per-procedure case counts, autonomy progression over time, complication rates, and time-to-competency " +
      "curves vs your specialty benchmark. The numbers update in real-time as you log.",
    cta: { href: "/analytics", label: "View analytics" },
  },
  {
    icon: Trophy,
    title: "Milestones & personal records",
    description:
      "Auto-fired badges when you hit case-volume milestones. Personal records track your fastest " +
      "lap-chole, smallest-EBL TURP, longest case streak. Optional, can be hidden in settings.",
    cta: { href: "/milestones", label: "See milestones" },
  },
  {
    icon: Users,
    title: "Social & leaderboards",
    description:
      "Opt-in friends + program leaderboards. Share milestones to a private feed, compare anonymized " +
      "case volume with peers in your specialty, send case-of-the-day pearls. Off by default.",
    cta: { href: "/feed", label: "Open feed" },
  },
  {
    icon: Bell,
    title: "Push notifications",
    description:
      "When your attending signs off an EPA, when a friend hits a milestone, when a teaching pearl drops in " +
      "your specialty. Per-channel toggles in settings. Works on iOS Safari 16.4+ and all desktop browsers.",
    cta: { href: "/settings/notifications", label: "Notification settings" },
  },
  {
    icon: Sparkles,
    title: "Dictation style profile",
    description:
      "Hippo learns from your edits. Approve a phrase once, it shows up in future drafts. Reject one, it " +
      "never returns. Adjust brevity, tone, header style, bullet preference. Sync across your phone + laptop.",
    cta: { href: "/settings/dictation", label: "Tune your style" },
  },
  {
    icon: FileSpreadsheet,
    title: "Import your existing log",
    description:
      "Got an Excel sheet from a past rotation? Upload it. Hippo auto-maps your columns, flags possible " +
      "patient identifiers, dedupes against your current cases, and merges. Extra columns get saved to " +
      "imported metadata so nothing is lost.",
    cta: { href: "/settings/data/import", label: "Import a log" },
  },
  {
    icon: Smartphone,
    title: "Install on your phone",
    description:
      "Hippo runs as a Progressive Web App — full-screen, home-screen icon, offline-tolerant. No app store, " +
      "no install file, just a one-tap add-to-home from Safari or Chrome.",
    cta: { href: "/install", label: "Install instructions" },
  },
  {
    icon: Shield,
    title: "Privacy first",
    description:
      "PHIA-aware by design. No patient identifiers ever stored — Hippo intentionally does not have a " +
      "name, MRN, or DOB field. Every case is private by default. Sharing to friends or community feeds " +
      "is explicit, opt-in, and reversible.",
    cta: { href: "/settings", label: "Privacy controls" },
  },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060d13",
        padding: "48px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* ── Hero ── */}
        <header
          style={{
            textAlign: "center",
            marginBottom: 56,
            animation: "oe-fadeInUp 0.6s cubic-bezier(.16,1,.3,1) both",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <HippoMark size={56} />
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#E2E8F0",
                letterSpacing: "-0.8px",
              }}
            >
              Hippo
            </span>
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#E2E8F0",
              margin: "8px 0 14px",
              letterSpacing: "-0.4px",
              lineHeight: 1.25,
            }}
          >
            Everything Hippo can do for your training.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(226,232,240,0.55)",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.55,
            }}
          >
            A 90-second tour of every feature. Skip whenever you want — you can come back to this
            page from <strong style={{ color: "#E2E8F0" }}>Settings</strong> any time.
          </p>
          <div
            style={{
              display: "inline-block",
              width: 60,
              height: 1,
              marginTop: 28,
              background: `linear-gradient(90deg, transparent, ${TEAL}33, transparent)`,
            }}
          />
        </header>

        {/* ── Feature grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>

        {/* ── Footer CTA ── */}
        <div
          style={{
            marginTop: 56,
            padding: 28,
            background: "rgba(14,165,233,0.04)",
            border: "1px solid rgba(14,165,233,0.18)",
            borderRadius: 20,
            textAlign: "center",
            animation: "oe-fadeInUp 0.6s cubic-bezier(.16,1,.3,1) 0.5s both",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#E2E8F0",
              margin: "0 0 8px",
            }}
          >
            Ready to log your first case?
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(226,232,240,0.55)",
              margin: "0 0 18px",
              maxWidth: 420,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.5,
            }}
          >
            Hippo is most useful when you log cases on the day they happen — even a 30-second
            rough draft beats a perfect note next week.
          </p>
          <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => router.push("/cases?new=1")}
              style={{
                padding: "12px 22px",
                background: `linear-gradient(135deg, ${TEAL}, #0284C7)`,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Log my first case
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "12px 22px",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(226,232,240,0.75)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Just take me to the dashboard
            </button>
          </div>
        </div>

        {/* ── Footer link back to settings ── */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "rgba(226,232,240,0.3)",
            marginTop: 32,
          }}
        >
          You can revisit this page anytime from{" "}
          <Link href="/settings" style={{ color: TEAL, textDecoration: "none" }}>
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(14,165,233,0.015)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: 22,
        transition: "border-color 0.2s, transform 0.2s",
        animation: `oe-fadeInUp 0.6s cubic-bezier(.16,1,.3,1) ${0.05 * (index + 1)}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
      }}
    >
      {/* Icon + title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(14,165,233,0.10)",
            border: "1px solid rgba(14,165,233,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={TEAL} />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: "#E2E8F0",
            letterSpacing: "-0.2px",
          }}
        >
          {feature.title}
        </h3>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.55,
          color: "rgba(226,232,240,0.62)",
        }}
      >
        {feature.description}
      </p>

      {feature.cta && (
        <div style={{ marginTop: 14 }}>
          <Link
            href={feature.cta.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
              color: TEAL,
              textDecoration: "none",
              opacity: 0.85,
            }}
          >
            {feature.cta.label}
            <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}
