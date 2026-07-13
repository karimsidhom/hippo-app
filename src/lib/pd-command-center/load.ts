import "server-only";

import { db } from "@/lib/db";
import type { ProgramCommandCenterData, SignalLevel } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const PILOT_DAYS = 30;

function stageOf(epaId: string): "TD" | "F" | "C" | "TTP" | "OTHER" {
  const value = epaId.toUpperCase();
  if (/^(TD|TTD)/.test(value)) return "TD";
  if (/^(F|FOD)/.test(value)) return "F";
  if (/^TTP/.test(value)) return "TTP";
  if (/^(C|COD|EPA)/.test(value)) return "C";
  return "OTHER";
}

function percent(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 10) / 10;
}

export async function loadProgramCommandCenter(userId: string, requestedProgramId?: string | null): Promise<ProgramCommandCenterData | null> {
  const memberships = await db.programMember.findMany({
    where: { userId, role: { in: ["OWNER", "PD"] } },
    orderBy: { joinedAt: "asc" },
    select: { programId: true, program: { select: { id: true, name: true } } },
  });
  if (!memberships.length) return null;

  const allowedIds = new Set(memberships.map((membership) => membership.programId));
  const programId = requestedProgramId && allowedIds.has(requestedProgramId)
    ? requestedProgramId
    : memberships[0].programId;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);

  const program = await db.program.findUnique({
    where: { id: programId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { roleType: true, trainingYearLabel: true, pgyYear: true } },
            },
          },
        },
      },
      invites: { where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } }, select: { id: true } },
      rotations: { select: { id: true } },
      ccReviews: { where: { status: "IN_PROGRESS" }, select: { id: true } },
      formTemplates: { where: { active: true }, select: { id: true } },
    },
  });
  if (!program) return null;

  const residents = program.members.filter((member) => {
    const role = member.user.profile?.roleType;
    return role === "RESIDENT" || role === "FELLOW";
  });
  const residentIds = residents.map((member) => member.userId);
  const facultyCount = program.members.filter((member) => ["FACULTY", "CHAIR", "CC_MEMBER", "DEPT_HEAD"].includes(member.role)).length;

  const [casesSince60, totalCasesByResident, lastCases, observations] = await Promise.all([
    db.caseLog.findMany({
      where: { userId: { in: residentIds }, caseDate: { gte: sixtyDaysAgo } },
      select: { userId: true, caseDate: true },
    }),
    db.caseLog.groupBy({ by: ["userId"], where: { userId: { in: residentIds } }, _count: { _all: true } }),
    db.caseLog.groupBy({ by: ["userId"], where: { userId: { in: residentIds } }, _max: { caseDate: true } }),
    db.epaObservation.findMany({
      where: { userId: { in: residentIds } },
      select: {
        id: true,
        userId: true,
        epaId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        signedAt: true,
        safetyConcern: true,
        professionalismConcern: true,
      },
    }),
  ]);

  const totalCases = new Map(totalCasesByResident.map((row) => [row.userId, row._count._all]));
  const lastCase = new Map(lastCases.map((row) => [row.userId, row._max.caseDate]));
  const cases30ByResident = new Map<string, number>();
  let cases30 = 0;
  let prior30 = 0;
  for (const entry of casesSince60) {
    if (entry.caseDate >= thirtyDaysAgo) {
      cases30 += 1;
      cases30ByResident.set(entry.userId, (cases30ByResident.get(entry.userId) ?? 0) + 1);
    } else {
      prior30 += 1;
    }
  }

  const observationsByResident = new Map<string, typeof observations>();
  for (const observation of observations) {
    const rows = observationsByResident.get(observation.userId) ?? [];
    rows.push(observation);
    observationsByResident.set(observation.userId, rows);
  }

  const pendingStatuses = new Set(["DRAFT", "SUBMITTED", "PENDING_REVIEW"]);
  const pendingSignoffs = observations.filter((observation) => pendingStatuses.has(observation.status)).length;
  const signed = observations.filter((observation) => observation.status === "SIGNED");
  const signoffDays = signed
    .filter((observation) => observation.signedAt)
    .map((observation) => Math.max(0, (observation.signedAt!.getTime() - observation.createdAt.getTime()) / DAY));

  const activeResidentIds = new Set<string>();
  for (const entry of casesSince60) if (entry.caseDate >= fourteenDaysAgo) activeResidentIds.add(entry.userId);
  for (const observation of observations) if (observation.updatedAt >= fourteenDaysAgo) activeResidentIds.add(observation.userId);

  const stageLabels = { TD: "Transition to discipline", F: "Foundations", C: "Core", TTP: "Transition to practice" } as const;
  const stageBuckets = new Map<"TD" | "F" | "C" | "TTP", { total: number; signed: number }>([
    ["TD", { total: 0, signed: 0 }], ["F", { total: 0, signed: 0 }], ["C", { total: 0, signed: 0 }], ["TTP", { total: 0, signed: 0 }],
  ]);
  for (const observation of observations) {
    const stage = stageOf(observation.epaId);
    if (stage === "OTHER") continue;
    const bucket = stageBuckets.get(stage)!;
    bucket.total += 1;
    if (observation.status === "SIGNED") bucket.signed += 1;
  }

  const signalOrder: Record<SignalLevel, number> = { critical: 0, watch: 1, good: 2 };
  const residentRows = residents.map((member) => {
    const residentObservations = observationsByResident.get(member.userId) ?? [];
    const residentSigned = residentObservations.filter((observation) => observation.status === "SIGNED").length;
    const pending = residentObservations.filter((observation) => pendingStatuses.has(observation.status)).length;
    const recentCase = lastCase.get(member.userId) ?? null;
    const lastObservation = residentObservations.reduce<Date | null>((latest, observation) => !latest || observation.updatedAt > latest ? observation.updatedAt : latest, null);
    const lastActivity = [recentCase, lastObservation].filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const silent = !lastActivity || lastActivity < fourteenDaysAgo;
    const concern = residentObservations.some((observation) => observation.safetyConcern || observation.professionalismConcern);
    const signal: SignalLevel = concern || (silent && pending > 0) ? "critical" : silent || pending > 0 ? "watch" : "good";
    return {
      userId: member.userId,
      name: member.user.name ?? member.user.email,
      trainingYear: member.user.profile?.trainingYearLabel ?? (member.user.profile?.pgyYear ? `PGY-${member.user.profile.pgyYear}` : "Unspecified"),
      cases30: cases30ByResident.get(member.userId) ?? 0,
      totalCases: totalCases.get(member.userId) ?? 0,
      epaSigned: residentSigned,
      epaTotal: residentObservations.length,
      pending,
      lastActivityAt: lastActivity?.toISOString() ?? null,
      signal,
    };
  }).sort((a, b) => signalOrder[a.signal] - signalOrder[b.signal] || a.name.localeCompare(b.name));

  const alerts: ProgramCommandCenterData["alerts"] = [];
  for (const resident of residentRows.filter((row) => row.signal !== "good").slice(0, 6)) {
    const silentDays = resident.lastActivityAt ? Math.floor((now.getTime() - new Date(resident.lastActivityAt).getTime()) / DAY) : null;
    alerts.push({
      id: `resident-${resident.userId}`,
      level: resident.signal,
      residentId: resident.userId,
      title: resident.name,
      detail: [silentDays === null ? "No activity yet" : silentDays >= 14 ? `${silentDays} days since activity` : null, resident.pending ? `${resident.pending} EPA${resident.pending === 1 ? "" : "s"} awaiting action` : null].filter(Boolean).join(" · "),
      href: `/pd-dashboard/${resident.userId}`,
    });
  }
  if (program.ccReviews.length) alerts.push({ id: "cc-open", level: "watch", title: `${program.ccReviews.length} competence committee review${program.ccReviews.length === 1 ? "" : "s"} open`, detail: "Prepare or finalise decisions before the next meeting.", href: "/cc-reviews" });
  if (program.invites.length) alerts.push({ id: "invites", level: "watch", title: `${program.invites.length} invitation${program.invites.length === 1 ? "" : "s"} pending`, detail: "Follow up with people who have not joined the program.", href: "/programs" });

  const trend = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(now.getTime() - (7 - index) * 7 * DAY);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 7 * DAY);
    return {
      label: start.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      cases: casesSince60.filter((entry) => entry.caseDate >= start && entry.caseDate < end).length,
    };
  });

  const setup = [
    { id: "profile", label: "Program profile", complete: Boolean(program.institution && program.specialty), href: "/programs" },
    { id: "residents", label: "Resident roster", complete: residents.length > 0, href: "/programs" },
    { id: "faculty", label: "Faculty roles", complete: facultyCount > 0, href: "/programs" },
    { id: "rotations", label: "Rotation schedule", complete: program.rotations.length > 0, href: "/rotations" },
    { id: "forms", label: "Assessment forms", complete: program.formTemplates.length > 0, href: "/forms" },
    { id: "activity", label: "First training activity", complete: cases30 + observations.length > 0, href: "/pd-dashboard" },
  ];

  const adoptionPercent = percent(activeResidentIds.size, residents.length);
  const actionCount = residentRows.filter((resident) => resident.signal !== "good").length;
  const weeklyHeadline = actionCount
    ? `${actionCount} resident${actionCount === 1 ? " needs" : "s need"} a program check-in`
    : residents.length ? "The cohort is active with no urgent signals" : "Finish setup to start measuring the pilot";
  const weeklyBullets = [
    `${activeResidentIds.size} of ${residents.length} residents active in the last 14 days`,
    `${cases30} cases logged in the last 30 days`,
    pendingSignoffs ? `${pendingSignoffs} EPA${pendingSignoffs === 1 ? "" : "s"} awaiting completion` : "No EPA sign-off backlog",
  ];

  return {
    programs: memberships.map((membership) => membership.program),
    program: {
      id: program.id,
      name: program.name,
      institution: program.institution ?? "Institution not set",
      specialty: program.specialty ?? "Specialty not set",
      pilotDay: Math.min(PILOT_DAYS, Math.max(1, Math.floor((now.getTime() - program.createdAt.getTime()) / DAY) + 1)),
      pilotLengthDays: PILOT_DAYS,
      memberCount: program.members.length,
      residentCount: residents.length,
      facultyCount,
    },
    metrics: {
      cases30,
      caseDeltaPercent: prior30 ? Math.round(((cases30 - prior30) / prior30) * 100) : cases30 ? 100 : 0,
      epaCompletionPercent: percent(signed.length, observations.length),
      pendingSignoffs,
      activeResidents: activeResidentIds.size,
      adoptionPercent,
      medianSignoffDays: median(signoffDays),
    },
    trend,
    stages: [...stageBuckets.entries()].map(([id, bucket]) => ({ id, label: stageLabels[id], signed: bucket.signed, total: bucket.total, percent: percent(bucket.signed, bucket.total) })),
    alerts,
    residents: residentRows,
    setup,
    weeklyBrief: {
      headline: weeklyHeadline,
      summary: `${program.name} is on day ${Math.min(PILOT_DAYS, Math.max(1, Math.floor((now.getTime() - program.createdAt.getTime()) / DAY) + 1))} of its ${PILOT_DAYS}-day pilot.`,
      bullets: weeklyBullets,
    },
    generatedAt: now.toISOString(),
  };
}
