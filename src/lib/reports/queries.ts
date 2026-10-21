// ---------------------------------------------------------------------------
// Accreditation report queries.
//
// Eight canned reports the Royal College accreditation reviewer asks
// for at every site visit. Each function returns rows ready to feed
// into buildCsv() — typed, narrow, no PHI, no patient identifiers.
//
// All queries are program-scoped: the caller passes a programId and
// every row is constrained to members of that program. This is the
// hard-gate that lets us safely run reports for one programme even
// when the underlying database holds many.
// ---------------------------------------------------------------------------

import { db } from "@/lib/db";
import { programResidents } from './program-progress';
import { getSpecialtyEpaData } from '@/lib/epa/data';
import { historicalEpaSnapshotSchema } from '@/lib/epa/historical-progress';
import { normalizeProgressSpecialty } from '@/lib/epa/progress-summary';

const SILENT_DAYS = 14;

// ─── Helpers ────────────────────────────────────────────────────────

async function programMemberUserIds(programId: string): Promise<string[]> {
  const members = await programResidents(programId);
  return members.map((m) => m.userId);
}

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

// ─── 1. EPA observation matrix ──────────────────────────────────────
//
// One row per (resident × EPA). Columns: total observations, signed,
// sign-off percentage. These are native observations, not category completion.

export interface EpaMatrixRow {
  residentName: string;
  residentEmail: string;
  trainingYear: string;
  epaId: string;
  epaTitle: string;
  totalObservations: number;
  signedObservations: number;
  achievedObservations: number;
  percentSigned: number;
}

export async function reportEpaMatrix(programId: string): Promise<EpaMatrixRow[]> {
  const residents = await programResidents(programId);
  const userIds = residents.map(resident => resident.userId);
  if (userIds.length === 0) return [];

  const [observations, snapshots, profiles] = await Promise.all([
    db.epaObservation.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, epaId: true, epaTitle: true, status: true, achievement: true },
    }),
    db.epaProgressSnapshot.findMany({
      where: { userId: { in: userIds } }, select: { userId: true, specialtySlug: true, payload: true },
    }),
    db.profile.findMany({ where: { userId: { in: userIds } }, select: { userId: true, trainingCountry: true } }),
  ]);

  type Bucket = {
    residentName: string;
    residentEmail: string;
    trainingYear: string;
    epaId: string;
    epaTitle: string;
    total: number;
    signed: number;
    achieved: number;
  };

  const map = new Map<string, Bucket>();
  const roster = new Map(residents.map(resident => [resident.userId, resident]));
  for (const resident of residents) {
    const specialty = normalizeProgressSpecialty(resident.specialty ?? '');
    const country = profiles.find(profile => profile.userId === resident.userId)?.trainingCountry ?? 'CA';
    const catalog = getSpecialtyEpaData(specialty, country);
    const inventory = new Map(catalog?.epas.map(epa => [epa.id, epa.title]) ?? []);
    const source = snapshots.find(snapshot => snapshot.userId === resident.userId && snapshot.specialtySlug === specialty);
    const parsed = source ? historicalEpaSnapshotSchema.safeParse(source.payload) : null;
    if (parsed?.success) {
      for (const parent of parsed.data.all_parent_epas) inventory.set(parent.code, parent.title);
      for (const record of parsed.data.records) {
        if (record.code === 'C5B-C13B') continue;
        const parent = record.code.replace(/^((?:TD|F|C|TTP)\d+)[AB]$/, '$1');
        if (!inventory.has(parent)) inventory.set(parent, record.title);
      }
    }
    // Keep even a zero-observation resident whose framework is unavailable.
    if (!inventory.size) inventory.set('', 'EPA framework unavailable');
    for (const [epaId, epaTitle] of inventory) {
      map.set(`${resident.userId}::${epaId}`, {
        residentName: resident.user.name ?? resident.user.email, residentEmail: resident.user.email,
        trainingYear: resident.trainingYearLabel ?? '', epaId, epaTitle, total: 0, signed: 0, achieved: 0,
      });
    }
  }
  for (const o of observations) {
    const resident = roster.get(o.userId);
    if (!resident) continue;
    const key = `${o.userId}::${o.epaId}`;
    let row = map.get(key);
    if (!row) {
      row = {
        residentName: resident.user.name ?? resident.user.email,
        residentEmail: resident.user.email,
        trainingYear: resident.trainingYearLabel ?? "",
        epaId: o.epaId,
        epaTitle: o.epaTitle,
        total: 0,
        signed: 0,
        achieved: 0,
      };
      map.set(key, row);
    }
    row.total += 1;
    if (o.status === "SIGNED") row.signed += 1;
    if (o.status === "SIGNED" && o.achievement === "ACHIEVED") row.achieved += 1;
  }

  return [...map.values()]
    .sort(
      (a, b) =>
        a.residentName.localeCompare(b.residentName) ||
        a.epaId.localeCompare(b.epaId),
    )
    .map((b) => ({
      residentName: b.residentName,
      residentEmail: b.residentEmail,
      trainingYear: b.trainingYear,
      epaId: b.epaId,
      epaTitle: b.epaTitle,
      totalObservations: b.total,
      signedObservations: b.signed,
      achievedObservations: b.achieved,
      percentSigned: safeDiv(b.signed, b.total),
    }));
}

// ─── 2. Observation sign-off by stage ──────────────────────────────
//
// One row per resident showing sign-off percentage among recorded native
// observations (TD, F, C, TTP). This is not a category-completion percentage.

export interface CohortRow {
  residentName: string;
  residentEmail: string;
  trainingYear: string;
  totalEpas: number;
  signedEpas: number;
  percentSigned: number;
  td: number;
  f: number;
  c: number;
  ttp: number;
}

const stageOf = (epaId: string): "TD" | "F" | "C" | "TTP" | "OTHER" => {
  if (/^TD/.test(epaId) || /^TTD/.test(epaId)) return "TD";
  if (/^F/.test(epaId) || /^FOD/.test(epaId)) return "F";
  if (/^TTP/.test(epaId)) return "TTP";
  if (/^C/.test(epaId) || /^COD/.test(epaId) || /^EPA/.test(epaId)) return "C";
  return "OTHER";
};

export async function reportCohortHeatmap(programId: string): Promise<CohortRow[]> {
  const residents = await programResidents(programId);
  const userIds = residents.map(resident => resident.userId);
  if (userIds.length === 0) return [];

  const observations = await db.epaObservation.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      epaId: true,
      status: true,
    },
  });

  type Bucket = CohortRow & {
    totals: Record<"TD" | "F" | "C" | "TTP", number>;
    signed: Record<"TD" | "F" | "C" | "TTP", number>;
  };
  const map = new Map<string, Bucket>();
  for (const resident of residents) {
    map.set(resident.userId, {
      residentName: resident.user.name ?? resident.user.email, residentEmail: resident.user.email,
      trainingYear: resident.trainingYearLabel ?? '', totalEpas: 0, signedEpas: 0, percentSigned: 0,
      td: 0, f: 0, c: 0, ttp: 0, totals: { TD: 0, F: 0, C: 0, TTP: 0 }, signed: { TD: 0, F: 0, C: 0, TTP: 0 },
    });
  }
  for (const o of observations) {
    const key = o.userId;
    const row = map.get(key);
    if (!row) continue;
    row.totalEpas += 1;
    if (o.status === "SIGNED") row.signedEpas += 1;
    const stage = stageOf(o.epaId);
    if (stage !== "OTHER") {
      row.totals[stage] += 1;
      if (o.status === "SIGNED") row.signed[stage] += 1;
    }
  }

  return [...map.values()]
    .sort((a, b) => a.residentName.localeCompare(b.residentName))
    .map((r) => ({
      residentName: r.residentName,
      residentEmail: r.residentEmail,
      trainingYear: r.trainingYear,
      totalEpas: r.totalEpas,
      signedEpas: r.signedEpas,
      percentSigned: safeDiv(r.signedEpas, r.totalEpas),
      td: safeDiv(r.signed.TD, r.totals.TD),
      f: safeDiv(r.signed.F, r.totals.F),
      c: safeDiv(r.signed.C, r.totals.C),
      ttp: safeDiv(r.signed.TTP, r.totals.TTP),
    }));
}

// ─── 3. Sign-off latency ───────────────────────────────────────────
//
// Days from EPA observation creation to status=SIGNED, per resident
// + per attending. Reviewers ask: how long does an attending sit on
// an EPA before signing? Report median + p90 for each attending.

export interface LatencyRow {
  attendingName: string;
  attendingEmail: string;
  observations: number;
  medianDays: number;
  p90Days: number;
  longestDays: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export async function reportSignoffLatency(programId: string): Promise<LatencyRow[]> {
  const userIds = await programMemberUserIds(programId);
  if (userIds.length === 0) return [];

  const observations = await db.epaObservation.findMany({
    where: {
      userId: { in: userIds },
      status: "SIGNED",
      signedAt: { not: null },
    },
    select: {
      createdAt: true,
      signedAt: true,
      assessorName: true,
      assessorEmail: true,
    },
  });

  // Group by assessor name (fall back to email if name missing).
  type Bucket = { name: string; email: string; days: number[] };
  const map = new Map<string, Bucket>();
  for (const o of observations) {
    const key = (o.assessorName?.trim() || o.assessorEmail || "Unknown").toLowerCase();
    let bucket = map.get(key);
    if (!bucket) {
      bucket = {
        name: o.assessorName?.trim() || o.assessorEmail || "Unknown",
        email: o.assessorEmail ?? "",
        days: [],
      };
      map.set(key, bucket);
    }
    if (o.signedAt) {
      const ms = o.signedAt.getTime() - o.createdAt.getTime();
      bucket.days.push(Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000))));
    }
  }

  return [...map.values()]
    .map((b) => {
      const sorted = [...b.days].sort((x, y) => x - y);
      const median = percentile(sorted, 50);
      const p90 = percentile(sorted, 90);
      const longest = sorted[sorted.length - 1] ?? 0;
      return {
        attendingName: b.name,
        attendingEmail: b.email,
        observations: b.days.length,
        medianDays: median,
        p90Days: p90,
        longestDays: longest,
      };
    })
    .sort((a, b) => b.observations - a.observations);
}

// ─── 4. Case volume by procedure ───────────────────────────────────
//
// One row per (resident × procedure) with role + autonomy mix.

export interface CaseVolumeRow {
  residentName: string;
  trainingYear: string;
  procedureName: string;
  total: number;
  asPrimary: number;
  asAssistant: number;
  asObserver: number;
  asTeacher: number;
}

export async function reportCaseVolume(programId: string): Promise<CaseVolumeRow[]> {
  const userIds = await programMemberUserIds(programId);
  if (userIds.length === 0) return [];

  const cases = await db.caseLog.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      procedureName: true,
      autonomyLevel: true,
      user: {
        select: {
          name: true,
          email: true,
          profile: { select: { trainingYearLabel: true } },
        },
      },
    },
  });

  type Bucket = CaseVolumeRow;
  const map = new Map<string, Bucket>();
  for (const c of cases) {
    const key = `${c.userId}::${c.procedureName}`;
    let row = map.get(key);
    if (!row) {
      row = {
        residentName: c.user.name ?? c.user.email,
        trainingYear: c.user.profile?.trainingYearLabel ?? "",
        procedureName: c.procedureName,
        total: 0,
        asPrimary: 0,
        asAssistant: 0,
        asObserver: 0,
        asTeacher: 0,
      };
      map.set(key, row);
    }
    row.total += 1;
    switch (c.autonomyLevel) {
      case "INDEPENDENT":
      case "SUPERVISOR_PRESENT":
        row.asPrimary += 1;
        break;
      case "ASSISTANT":
        row.asAssistant += 1;
        break;
      case "OBSERVER":
        row.asObserver += 1;
        break;
      case "TEACHING":
        row.asTeacher += 1;
        break;
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      a.residentName.localeCompare(b.residentName) ||
      b.total - a.total ||
      a.procedureName.localeCompare(b.procedureName),
  );
}

// ─── 5. Resident silent-days ───────────────────────────────────────
//
// Per resident: days since last logged case, days since last logged
// EPA. Surface anyone silent ≥ 14 days first.

export interface SilentRow {
  residentName: string;
  residentEmail: string;
  trainingYear: string;
  daysSinceLastCase: number | null;
  daysSinceLastObservation: number | null;
  silent: boolean;
}

export async function reportSilentDays(programId: string): Promise<SilentRow[]> {
  const userIds = await programMemberUserIds(programId);
  if (userIds.length === 0) return [];

  const [users, latestCases, latestObs] = await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: { trainingYearLabel: true, roleType: true },
        },
      },
    }),
    db.caseLog.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { caseDate: true },
    }),
    db.epaObservation.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { observationDate: true },
    }),
  ]);

  const caseMap = new Map<string, Date | null>(
    latestCases.map((r) => [r.userId, r._max.caseDate]),
  );
  const obsMap = new Map<string, Date | null>(
    latestObs.map((r) => [r.userId, r._max.observationDate]),
  );

  const today = Date.now();
  return users
    .filter((u) => u.profile?.roleType === "RESIDENT" || u.profile?.roleType === "FELLOW")
    .map((u) => {
      const lastCase = caseMap.get(u.id);
      const lastObs = obsMap.get(u.id);
      const daysCase = lastCase
        ? Math.round((today - lastCase.getTime()) / (24 * 60 * 60 * 1000))
        : null;
      const daysObs = lastObs
        ? Math.round((today - lastObs.getTime()) / (24 * 60 * 60 * 1000))
        : null;
      const silent =
        daysCase === null || daysCase >= SILENT_DAYS;
      return {
        residentName: u.name ?? u.email,
        residentEmail: u.email,
        trainingYear: u.profile?.trainingYearLabel ?? "",
        daysSinceLastCase: daysCase,
        daysSinceLastObservation: daysObs,
        silent,
      };
    })
    .sort((a, b) => {
      // Silent residents first, then by days descending
      if (a.silent !== b.silent) return a.silent ? -1 : 1;
      const da = a.daysSinceLastCase ?? Number.MAX_SAFE_INTEGER;
      const db_ = b.daysSinceLastCase ?? Number.MAX_SAFE_INTEGER;
      return db_ - da;
    });
}

// ─── 6. CC decisions log ───────────────────────────────────────────
//
// Every CC review's decision + rationale + chair, with timestamps.
// 25-year retention requirement — this is the audit trail.

export interface CcDecisionRow {
  residentName: string;
  residentEmail: string;
  cycleLabel: string;
  meetingDate: Date;
  decision: string;
  decisionRationale: string;
  chairSummary: string;
  dissent: string;
  finalisedBy: string;
  finalisedAt: Date | null;
  status: string;
}

export async function reportCcDecisions(programId: string): Promise<CcDecisionRow[]> {
  const reviews = await db.cCReview.findMany({
    where: { programId },
    orderBy: { meetingDate: "desc" },
    include: {
      resident: { select: { name: true, email: true } },
      finalisedBy: { select: { name: true, email: true } },
    },
  });

  return reviews.map((r) => ({
    residentName: r.resident.name ?? r.resident.email,
    residentEmail: r.resident.email,
    cycleLabel: r.cycleLabel ?? "",
    meetingDate: r.meetingDate,
    decision: r.decision ?? "",
    decisionRationale: r.decisionRationale ?? "",
    chairSummary: r.chairSummary ?? "",
    dissent: r.dissent ?? "",
    finalisedBy: r.finalisedBy?.name ?? r.finalisedBy?.email ?? "",
    finalisedAt: r.finalisedAt,
    status: r.status,
  }));
}

// ─── 7. Faculty observation count ──────────────────────────────────
//
// Attendings ranked by total EPAs signed, with breakdown by
// achievement and average entrustment.

export interface FacultyObsRow {
  attendingName: string;
  attendingEmail: string;
  totalSigned: number;
  achieved: number;
  notAchieved: number;
  avgEntrustment: number;
  uniqueResidents: number;
  uniqueEpas: number;
}

export async function reportFacultyObservations(
  programId: string,
): Promise<FacultyObsRow[]> {
  const userIds = await programMemberUserIds(programId);
  if (userIds.length === 0) return [];

  const observations = await db.epaObservation.findMany({
    where: {
      userId: { in: userIds },
      status: "SIGNED",
    },
    select: {
      assessorName: true,
      assessorEmail: true,
      achievement: true,
      entrustmentScore: true,
      userId: true,
      epaId: true,
    },
  });

  type Bucket = {
    name: string;
    email: string;
    total: number;
    achieved: number;
    notAchieved: number;
    scores: number[];
    residents: Set<string>;
    epas: Set<string>;
  };
  const map = new Map<string, Bucket>();
  for (const o of observations) {
    const key = (o.assessorName?.trim() || o.assessorEmail || "Unknown").toLowerCase();
    let b = map.get(key);
    if (!b) {
      b = {
        name: o.assessorName?.trim() || o.assessorEmail || "Unknown",
        email: o.assessorEmail ?? "",
        total: 0,
        achieved: 0,
        notAchieved: 0,
        scores: [],
        residents: new Set(),
        epas: new Set(),
      };
      map.set(key, b);
    }
    b.total += 1;
    if (o.achievement === "ACHIEVED") b.achieved += 1;
    else b.notAchieved += 1;
    if (typeof o.entrustmentScore === "number") b.scores.push(o.entrustmentScore);
    b.residents.add(o.userId);
    b.epas.add(o.epaId);
  }

  return [...map.values()]
    .map((b) => ({
      attendingName: b.name,
      attendingEmail: b.email,
      totalSigned: b.total,
      achieved: b.achieved,
      notAchieved: b.notAchieved,
      avgEntrustment:
        b.scores.length > 0
          ? Math.round(
              (b.scores.reduce((s, x) => s + x, 0) / b.scores.length) * 10,
            ) / 10
          : 0,
      uniqueResidents: b.residents.size,
      uniqueEpas: b.epas.size,
    }))
    .sort((a, b) => b.totalSigned - a.totalSigned);
}

// ─── 8. Programme demographics ─────────────────────────────────────
//
// Cohort case mix: by surgical approach + autonomy + complication
// outcome. One row per resident.

export interface DemographicsRow {
  residentName: string;
  trainingYear: string;
  totalCases: number;
  open: number;
  laparoscopic: number;
  robotic: number;
  endoscopic: number;
  asPrimary: number;
  asAssistant: number;
  asObserver: number;
  withComplication: number;
}

export async function reportDemographics(programId: string): Promise<DemographicsRow[]> {
  const userIds = await programMemberUserIds(programId);
  if (userIds.length === 0) return [];

  const cases = await db.caseLog.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      surgicalApproach: true,
      autonomyLevel: true,
      complicationCategory: true,
      user: {
        select: {
          name: true,
          email: true,
          profile: { select: { trainingYearLabel: true } },
        },
      },
    },
  });

  type Bucket = DemographicsRow;
  const map = new Map<string, Bucket>();
  for (const c of cases) {
    let row = map.get(c.userId);
    if (!row) {
      row = {
        residentName: c.user.name ?? c.user.email,
        trainingYear: c.user.profile?.trainingYearLabel ?? "",
        totalCases: 0,
        open: 0,
        laparoscopic: 0,
        robotic: 0,
        endoscopic: 0,
        asPrimary: 0,
        asAssistant: 0,
        asObserver: 0,
        withComplication: 0,
      };
      map.set(c.userId, row);
    }
    row.totalCases += 1;
    switch (c.surgicalApproach) {
      case "OPEN":         row.open += 1; break;
      case "LAPAROSCOPIC": row.laparoscopic += 1; break;
      case "ROBOTIC":      row.robotic += 1; break;
      case "ENDOSCOPIC":   row.endoscopic += 1; break;
    }
    switch (c.autonomyLevel) {
      case "INDEPENDENT":
      case "SUPERVISOR_PRESENT":
        row.asPrimary += 1; break;
      case "ASSISTANT":
        row.asAssistant += 1; break;
      case "OBSERVER":
        row.asObserver += 1; break;
    }
    if (c.complicationCategory && c.complicationCategory !== "NONE") {
      row.withComplication += 1;
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      a.trainingYear.localeCompare(b.trainingYear) ||
      a.residentName.localeCompare(b.residentName),
  );
}

// ─── Report registry — used by the API dispatcher ──────────────────

export interface ReportSpec {
  id: string;
  title: string;
  description: string;
  filename: (programName: string) => string;
}

export const REPORTS: ReportSpec[] = [
  { id: 'reconciled-progress', title: 'Historical EPA progress', description: 'Category and individual minimum credits, source versions, review status and separate signed observations. Includes residents with no observations.', filename: (p) => `${p} - Historical EPA progress.csv` },
  { id: 'procedure-targets', title: 'Agreed procedure targets', description: 'Canonical procedure volumes against the effective agreed target version, including zero counts.', filename: (p) => `${p} - Agreed procedure targets.csv` },
  {
    id: "epa-matrix",
    title: "EPA observation matrix",
    description: "Native observations by resident and EPA, including zero rows. Signed achievement and sign-off percentages are separate from category completion.",
    filename: (p) => `${p} - EPA observation matrix.csv`,
  },
  {
    id: "cohort-heatmap",
    title: "Observation sign-off by stage",
    description: "Sign-off percentage among recorded observations by resident and stage; includes residents with no observations. This is not category completion.",
    filename: (p) => `${p} - Observation sign-off by stage.csv`,
  },
  {
    id: "signoff-latency",
    title: "Sign-off latency",
    description: "Days from request to sign-off, median and p90, per attending.",
    filename: (p) => `${p} - Sign-off latency.csv`,
  },
  {
    id: "case-volume",
    title: "Case volume by procedure",
    description: "Per-resident procedure counts split by autonomy role.",
    filename: (p) => `${p} - Case volume by procedure.csv`,
  },
  {
    id: "silent-days",
    title: "Silent residents",
    description: "Days since last logged case + EPA per resident; silent ≥ 14 d first.",
    filename: (p) => `${p} - Silent residents.csv`,
  },
  {
    id: "cc-decisions",
    title: "CC decisions log",
    description: "Every CC review's decision, rationale, dissent, and chair.",
    filename: (p) => `${p} - CC decisions log.csv`,
  },
  {
    id: "faculty-observations",
    title: "Faculty observations",
    description: "Attendings ranked by total EPAs signed; achievement + average O-Score.",
    filename: (p) => `${p} - Faculty observations.csv`,
  },
  {
    id: "demographics",
    title: "Programme demographics",
    description: "Per-resident case mix by approach, autonomy role, and complication rate.",
    filename: (p) => `${p} - Programme demographics.csv`,
  },
];
