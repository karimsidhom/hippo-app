// Hippo Clinic — Settings.
//
// Province, billing toggle, audio retention, consent default. Server
// component that renders the form; the client form below handles writes.

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { ClinicSettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ClinicSettingsPage() {
  const auth = await requireAuth();
  if (auth.error) redirect("/login");
  await ensureDbUser(auth.user);

  const profile = await db.profile.findUnique({ where: { userId: auth.user.id } });

  return (
    <div style={{ paddingTop: 4 }}>
      <div className="section-title">Settings</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "2px 0 14px", letterSpacing: "-0.3px" }}>
        Hippo Clinic preferences
      </h1>

      <ClinicSettingsForm
        initial={{
          billingEnabled: profile?.billingEnabled ?? false,
          billingRegion: profile?.billingRegion ?? null,
          roleType: profile?.roleType ?? "RESIDENT",
        }}
      />

      <div className="st-card" style={{ marginTop: 18, fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
        <strong style={{ color: "var(--text)" }}>Privacy.</strong> Audio and transcripts are stored
        per-clinician under row-level security in your Supabase project. AI features only run when
        the AI vendor gate is enabled (see <code>AI_VENDOR_APPROVED</code>). Patient data is never
        shared into Hippo's social features.
      </div>
    </div>
  );
}
