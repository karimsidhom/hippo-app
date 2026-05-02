// Hippo Clinic — Dashboard.
//
// Server component: greeting, today's clinic list, draft notes, pending
// follow-ups, unsigned notes, and quick-action tiles.

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FilePlus, Mic, FileSignature, ClipboardList,
  AlertTriangle, ChevronRight, CalendarClock,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { StatusPill } from "@/components/clinic/StatusPill";
import { NOTE_TYPE_LABELS } from "@/lib/clinic/templates";
import type { ClinicNoteStatus } from "@/lib/clinic/types";

export const dynamic = "force-dynamic";

export default async function ClinicDashboardPage() {
  const auth = await requireAuth();
  if (auth.error) redirect("/login");
  await ensureDbUser(auth.user);
  const userId = auth.user.id;

  const [profile, encounters, drafts, unsigned, dueFollowUps, recentSummary] = await Promise.all([
    db.profile.findUnique({ where: { userId }, include: { user: true } }),
    db.clinicEncounter.findMany({
      where: {
        clinicianId: userId,
        encounterDate: {
          gte: startOfToday(),
          lte: endOfToday(),
        },
      },
      orderBy: { encounterDate: "asc" },
      include: { patient: { select: { id: true, givenName: true, familyName: true } } },
      take: 30,
    }),
    db.clinicEncounter.findMany({
      where: {
        clinicianId: userId,
        status: { in: ["DRAFT", "RECORDING", "TRANSCRIBING", "GENERATING", "FAILED"] },
      },
      orderBy: { updatedAt: "desc" },
      include: { patient: { select: { id: true, givenName: true, familyName: true } } },
      take: 8,
    }),
    db.clinicEncounter.findMany({
      where: { clinicianId: userId, status: "NEEDS_REVIEW" },
      orderBy: { updatedAt: "desc" },
      include: { patient: { select: { id: true, givenName: true, familyName: true } } },
      take: 8,
    }),
    db.clinicFollowUpTask.findMany({
      where: { ownerUserId: userId, status: { in: ["DUE_SOON", "OVERDUE", "WAITING_RESULTS"] } },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      include: {
        encounter: { select: { id: true, patient: { select: { givenName: true, familyName: true } } } },
      },
      take: 6,
    }),
    db.clinicEncounter.count({
      where: { clinicianId: userId, status: "FINALIZED" },
    }),
  ]);

  const greetingName = (profile?.user?.name || auth.user.email.split("@")[0] || "").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ paddingTop: 6, animation: "fadeIn .35s ease forwards" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 18 }}>
        <div className="section-title">Hippo Clinic</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "2px 0 4px", letterSpacing: "-0.4px" }}>
          {greeting}{greetingName ? `, ${greetingName}` : ""}.
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
          {encounters.length === 0
            ? "No clinic encounters scheduled today. Start a new note when ready."
            : `${encounters.length} encounter${encounters.length === 1 ? "" : "s"} on today's list.`}
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 22 }}>
        <QuickAction href="/clinic/new?mode=AMBIENT"   icon={<Mic size={16} />}            label="New ambient note" />
        <QuickAction href="/clinic/new?mode=DICTATION" icon={<FileSignature size={16} />}  label="New dictation" />
        <QuickAction href="/clinic/new?mode=TYPED"     icon={<FilePlus size={16} />}       label="Type a note" />
        <QuickAction href="/clinic/follow-ups"         icon={<CalendarClock size={16} />}  label="Follow-ups" />
      </div>

      {/* Today's clinic */}
      <Section title="Today's clinic" rightLink={encounters.length > 0 ? { href: "/clinic/encounters", label: "All" } : undefined}>
        {encounters.length === 0 ? (
          <Empty message="No encounters today." />
        ) : (
          encounters.map((e) => (
            <Row
              key={e.id}
              href={`/clinic/encounters/${e.id}`}
              title={e.patient ? `${e.patient.givenName} ${e.patient.familyName}` : "Unassigned patient"}
              subtitle={`${NOTE_TYPE_LABELS[e.noteType] || e.noteType}${e.visitReason ? ` · ${e.visitReason}` : ""}`}
              status={e.status as ClinicNoteStatus}
              when={formatTime(e.encounterDate)}
            />
          ))
        )}
      </Section>

      {/* Drafts */}
      <Section title="Draft notes">
        {drafts.length === 0 ? (
          <Empty message="No drafts." />
        ) : (
          drafts.map((e) => (
            <Row
              key={e.id}
              href={`/clinic/encounters/${e.id}`}
              title={e.patient ? `${e.patient.givenName} ${e.patient.familyName}` : "Unassigned"}
              subtitle={NOTE_TYPE_LABELS[e.noteType] || e.noteType}
              status={e.status as ClinicNoteStatus}
              when={formatRelative(e.updatedAt)}
              warn={e.status === "FAILED"}
            />
          ))
        )}
      </Section>

      {/* Unsigned */}
      <Section title="Unsigned — needs review">
        {unsigned.length === 0 ? (
          <Empty message="Nothing waiting on a signature." />
        ) : (
          unsigned.map((e) => (
            <Row
              key={e.id}
              href={`/clinic/encounters/${e.id}`}
              title={e.patient ? `${e.patient.givenName} ${e.patient.familyName}` : "Unassigned"}
              subtitle={NOTE_TYPE_LABELS[e.noteType] || e.noteType}
              status={"NEEDS_REVIEW"}
              when={formatRelative(e.updatedAt)}
            />
          ))
        )}
      </Section>

      {/* Follow-ups */}
      <Section title="Follow-ups due" rightLink={dueFollowUps.length > 0 ? { href: "/clinic/follow-ups", label: "All" } : undefined}>
        {dueFollowUps.length === 0 ? (
          <Empty message="No outstanding follow-ups." />
        ) : (
          dueFollowUps.map((t) => (
            <Row
              key={t.id}
              href={`/clinic/encounters/${t.encounter.id}`}
              title={t.title}
              subtitle={`${t.kind}${t.encounter.patient ? ` · ${t.encounter.patient.givenName} ${t.encounter.patient.familyName}` : ""}`}
              when={t.dueAt ? formatRelative(t.dueAt) : t.intervalLabel ?? ""}
              warn={t.status === "OVERDUE"}
            />
          ))
        )}
      </Section>

      <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", letterSpacing: ".04em" }}>
        {recentSummary} finalized note{recentSummary === 1 ? "" : "s"} on file.
      </div>
    </div>
  );
}

function startOfToday() {
  const d = new Date(); d.setHours(0,0,0,0); return d;
}
function endOfToday() {
  const d = new Date(); d.setHours(23,59,59,999); return d;
}
function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function formatRelative(d: Date) {
  const ms = Date.now() - d.getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="press"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 14,
        background: "var(--glass)",
        border: "1px solid var(--border-mid)",
        borderRadius: "var(--r)",
        textDecoration: "none",
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span style={{
        width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 6,
        background: "var(--primary-dim)",
        border: "1px solid var(--border-glow)",
        color: "var(--primary-hi)",
      }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={14} color="var(--text-3)" />
    </Link>
  );
}

function Section({
  title, rightLink, children,
}: {
  title: string;
  rightLink?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>{title}</div>
        {rightLink && (
          <Link href={rightLink.href} style={{ fontSize: 11, color: "var(--primary-hi)", textDecoration: "none" }}>
            {rightLink.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({
  href, title, subtitle, when, status, warn,
}: {
  href: string;
  title: string;
  subtitle?: string;
  when?: string;
  status?: ClinicNoteStatus;
  warn?: boolean;
}) {
  return (
    <Link href={href} className="case-card" style={{ textDecoration: "none" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="case-proc" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {warn && <AlertTriangle size={12} color="var(--warning)" />}
          {title}
        </div>
        {subtitle && (
          <div className="case-meta">
            <span style={{ color: "var(--text-3)" }}>{subtitle}</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        {when && <div className="case-date">{when}</div>}
        {status && <StatusPill status={status} />}
      </div>
    </Link>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div style={{ padding: 16, fontSize: 12, color: "var(--text-3)", textAlign: "center", border: "1px dashed var(--border-mid)", borderRadius: "var(--rs)" }}>
      <ClipboardList size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
      {message}
    </div>
  );
}
