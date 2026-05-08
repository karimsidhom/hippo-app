// ---------------------------------------------------------------------------
// Rotation helpers — used by both the API routes and the rotation UI.
//
// "Rotations" are program-defined services (Endourology, Trauma, Research,
// etc). A "RotationAssignment" is one resident on a single rotation across
// a date range. CaseLog + EpaObservation rows can be back-linked to the
// assignment that was active on their date so the CC dashboard can answer
// "what did Karim do during his Endourology block?".
//
// We deliberately keep the linkage logic OUT of the database (no triggers)
// so that:
//   1. Imports (case-log import) don't fight the trigger when historical
//      assignments are bulk-loaded after the cases.
//   2. Programs can edit a rotation's date range without orphaning every
//      case the trigger had assigned. Re-attribution is just a single
//      query that looks up the latest assignment per case.
// ---------------------------------------------------------------------------

import { db } from "@/lib/db";
import type { Rotation, RotationAssignment } from "@prisma/client";

export interface ActiveRotation {
  assignment: RotationAssignment;
  rotation: Rotation;
}

/**
 * Find the rotation assignment that covers `date` for a given user. Returns
 * the latest assignment (by start date) if multiple overlap — which can
 * happen during call coverage where a resident is technically on two
 * blocks simultaneously.
 */
export async function findAssignmentForDate(
  userId: string,
  date: Date,
): Promise<ActiveRotation | null> {
  const assignment = await db.rotationAssignment.findFirst({
    where: {
      userId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    include: { rotation: true },
    orderBy: { startDate: "desc" },
  });
  if (!assignment) return null;
  return { assignment, rotation: assignment.rotation };
}

/**
 * Re-attribute every CaseLog and EpaObservation for a user to the
 * appropriate RotationAssignment based on the case/observation date.
 * Idempotent — safe to run after creating, editing, or deleting any
 * assignment. Returns counts so the caller can flash a toast.
 */
export async function reattributeAssignments(userId: string): Promise<{
  casesUpdated: number;
  observationsUpdated: number;
}> {
  const assignments = await db.rotationAssignment.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
  });

  // Build an interval lookup we can scan in JS rather than executing N
  // queries per case. The set is typically small (≤ 13 blocks/year × N
  // years of training).
  const intervals = assignments.map((a) => ({
    id: a.id,
    start: a.startDate.getTime(),
    end: a.endDate.getTime(),
  }));

  const findFor = (date: Date): string | null => {
    const t = date.getTime();
    let best: { id: string; start: number } | null = null;
    for (const i of intervals) {
      if (t >= i.start && t <= i.end) {
        if (!best || i.start > best.start) best = i;
      }
    }
    return best?.id ?? null;
  };

  const cases = await db.caseLog.findMany({
    where: { userId },
    select: { id: true, caseDate: true, rotationAssignmentId: true },
  });
  const observations = await db.epaObservation.findMany({
    where: { userId },
    select: { id: true, observationDate: true, rotationAssignmentId: true },
  });

  let casesUpdated = 0;
  for (const c of cases) {
    const target = findFor(c.caseDate);
    if (target !== c.rotationAssignmentId) {
      await db.caseLog.update({
        where: { id: c.id },
        data: { rotationAssignmentId: target },
      });
      casesUpdated++;
    }
  }

  let observationsUpdated = 0;
  for (const o of observations) {
    const target = findFor(o.observationDate);
    if (target !== o.rotationAssignmentId) {
      await db.epaObservation.update({
        where: { id: o.id },
        data: { rotationAssignmentId: target },
      });
      observationsUpdated++;
    }
  }

  return { casesUpdated, observationsUpdated };
}

/**
 * Lightweight summary used by the rotation dashboard: per assignment,
 * how many cases were logged and how many EPA observations were captured.
 */
export interface AssignmentSummary {
  assignment: RotationAssignment;
  rotation: Rotation;
  caseCount: number;
  observationCount: number;
}

export async function summariseAssignments(
  userId: string,
): Promise<AssignmentSummary[]> {
  const assignments = await db.rotationAssignment.findMany({
    where: { userId },
    include: { rotation: true },
    orderBy: { startDate: "desc" },
  });

  const ids = assignments.map((a) => a.id);
  const [caseCounts, obsCounts] = await Promise.all([
    db.caseLog.groupBy({
      by: ["rotationAssignmentId"],
      where: { userId, rotationAssignmentId: { in: ids } },
      _count: { _all: true },
    }),
    db.epaObservation.groupBy({
      by: ["rotationAssignmentId"],
      where: { userId, rotationAssignmentId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const caseMap = new Map<string, number>();
  for (const r of caseCounts) {
    if (r.rotationAssignmentId) caseMap.set(r.rotationAssignmentId, r._count._all);
  }
  const obsMap = new Map<string, number>();
  for (const r of obsCounts) {
    if (r.rotationAssignmentId) obsMap.set(r.rotationAssignmentId, r._count._all);
  }

  return assignments.map((a) => ({
    assignment: a,
    rotation: a.rotation,
    caseCount: caseMap.get(a.id) ?? 0,
    observationCount: obsMap.get(a.id) ?? 0,
  }));
}
