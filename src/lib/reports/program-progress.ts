import { db } from '@/lib/db';
import { currentProgramTargets, loadProgramHistoricalProgress } from '@/lib/epa/program-progress';
import { normalizeProgressSpecialty } from '@/lib/epa/progress-summary';

/** All resident/fellow members, including those without observations. */
export async function programResidents(programId: string) {
  return db.profile.findMany({
    where: { roleType: { in: ['RESIDENT', 'FELLOW'] }, user: { programMemberships: { some: { programId } } } },
    select: { userId: true, specialty: true, trainingYearLabel: true, user: { select: { name: true, email: true } } },
    orderBy: { userId: 'asc' },
  });
}

export async function reportProgramProgress(programId: string, asOf = new Date()) {
  const residents = await programResidents(programId);
  const ids = residents.map((r) => r.userId);
  const [history, observations] = await Promise.all([
    loadProgramHistoricalProgress(programId, ids, asOf),
    db.epaObservation.findMany({ where: { userId: { in: ids }, createdAt: { lte: asOf } }, select: { userId: true, status: true, achievement: true } }),
  ]);
  return residents.map((resident) => {
    const specialty = normalizeProgressSpecialty(resident.specialty ?? '');
    const imported = history.get(`${resident.userId}:${specialty}`);
    const native = observations.filter((o) => o.userId === resident.userId);
    const summary = imported?.summary;
    return {
      residentId: resident.userId, residentName: resident.user.name ?? resident.user.email,
      residentEmail: resident.user.email, trainingYear: resident.trainingYearLabel ?? '',
      capturedAt: asOf.toISOString(), specialty,
      categoriesCompleted: summary?.categories.completed ?? null,
      categoriesRemaining: summary?.categories.remaining ?? null,
      categoriesTotal: summary?.categories.total ?? null,
      individualMinimumCredited: summary?.individual.creditedMinimum ?? null,
      individualRequiredMinimum: summary?.individual.requiredMinimum ?? null,
      individualRemainingMaximum: summary?.individual.remainingMaximum ?? null,
      actualHistoricalSubmissions: summary?.individual.actualCompleted ?? null,
      reconciliationStatus: imported?.reconciliationStatus ?? 'no_import',
      sourceReviewDate: imported?.reviewDate ?? '', sourceFilename: imported?.sourceFilename ?? '',
      sourceHash: imported?.contentHash ?? '', frameworkVersion: imported?.frameworkVersion ?? '',
      reviewedAt: imported?.reviewedAt ?? '',
      signedObservations: native.filter((o) => o.status === 'SIGNED').length,
      signedAchieved: native.filter((o) => o.status === 'SIGNED' && o.achievement === 'ACHIEVED').length,
      pendingObservations: native.filter((o) => ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW'].includes(o.status)).length,
      countingNote: 'Imported minimum credits and native observations are separate; overlapping history is not added. Blank counts are unknown. Remaining is an upper bound toward baseline minimums; case/assessor requirements can need extra observations.',
    };
  });
}

export async function reportProgramTargets(programId: string, asOf = new Date()) {
  const [residents, targets] = await Promise.all([programResidents(programId), currentProgramTargets(programId, asOf)]);
  const procedures = await db.procedureDefinition.findMany({ where: { id: { in: targets.map((t) => t.procedureDefinitionId) } }, select: { id: true, name: true } });
  const counts = await db.caseLog.groupBy({
    by: ['userId', 'procedureDefinitionId'],
    where: { userId: { in: residents.map((r) => r.userId) }, procedureDefinitionId: { in: targets.map((t) => t.procedureDefinitionId) }, caseDate: { lte: asOf } },
    _count: { _all: true },
  });
  return residents.flatMap((resident) => targets.map((target) => {
    const completed = counts.find((c) => c.userId === resident.userId && c.procedureDefinitionId === target.procedureDefinitionId)?._count._all ?? 0;
    return {
      residentName: resident.user.name ?? resident.user.email, residentEmail: resident.user.email,
      procedure: procedures.find((p) => p.id === target.procedureDefinitionId)?.name ?? target.procedureDefinitionId,
      target: target.target, recordedCases: completed, remaining: Math.max(0, target.target - completed),
      version: target.version, targetId: target.id, agreedAt: target.agreedAt.toISOString(),
      effectiveAt: target.effectiveAt.toISOString(), capturedAt: asOf.toISOString(),
      countingNote: 'All roles; canonical procedure matches only. Unmapped or historical cases are excluded until reconciled.',
    };
  }));
}
