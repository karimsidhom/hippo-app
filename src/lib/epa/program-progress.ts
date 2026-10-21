import { db } from '@/lib/db';
import { historicalEpaSnapshotSchema } from './historical-progress';
import { summarizeHistoricalProgress } from './progress-summary';
import { progressContentHash } from './progress-hash';

/** Caller must authorize these program-member IDs before invoking this service. */
export async function loadProgramHistoricalProgress(programId: string, residentIds: string[], asOf = new Date()) {
  if (!residentIds.length) return new Map();
  const snapshots = await db.epaProgressSnapshot.findMany({ where: { userId: { in: residentIds }, updatedAt: { lte: asOf } } });
  const [revisions, reviews] = await Promise.all([
    db.epaProgressRevision.findMany({
      where: { userId: { in: residentIds }, createdAt: { lte: asOf },
        // Current views do not need every historical payload from each resident.
        ...(snapshots.length ? { NOT: snapshots.map(row => ({ userId: row.userId, specialtySlug: row.specialtySlug })) } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
    db.programEpaReconciliation.findMany({
      where: { programId, residentId: { in: residentIds }, reviewedAt: { lte: asOf } },
      orderBy: { reviewedAt: 'desc' },
    }),
  ]);
  // A current snapshot wins even if it reverted to an older content hash.
  // For earlier captures, use only a revision already recorded by that date.
  const versions = new Map(snapshots.map(row => [`${row.userId}:${row.specialtySlug}`, { ...row, capturedAt: row.updatedAt, sourceVersionBasis: 'current' as 'current' | 'recorded_revision' }]));
  for (const row of revisions) {
    const key = `${row.userId}:${row.specialtySlug}`;
    if (versions.has(key)) continue;
    const parsed = historicalEpaSnapshotSchema.safeParse(row.payload);
    versions.set(key, { ...row, sourceFilename: parsed.success ? parsed.data.source.filename : '', importedAt: row.createdAt,
      updatedAt: row.createdAt, capturedAt: row.createdAt, sourceVersionBasis: 'recorded_revision', schemaVersion: 1, provenance: 'user_imported_summary' });
  }
  return new Map([...versions.values()].map((row) => {
    const parsed = historicalEpaSnapshotSchema.safeParse(row.payload);
    const contentHash = progressContentHash(row.payload);
    const review = reviews.find((r) => r.residentId === row.userId && r.specialtySlug === row.specialtySlug && r.contentHash === contentHash);
    const summary = parsed.success ? summarizeHistoricalProgress(parsed.data, row.specialtySlug) : null;
    if (summary && row.sourceVersionBasis === 'recorded_revision') summary.limitations.push('This capture uses the latest source revision recorded by its date. Re-import activation history may be unavailable; formal committee captures preserve their frozen source and summary.');
    return [`${row.userId}:${row.specialtySlug}`, {
      summary,
      specialtySlug: row.specialtySlug,
      sourceFilename: row.sourceFilename,
      reviewDate: row.sourceReviewDate.toISOString().slice(0, 10),
      importedAt: row.importedAt.toISOString(),
      contentHash,
      sourceVersionBasis: row.sourceVersionBasis,
      reconciliationStatus: review?.decision ?? 'self_reported',
      reviewedAt: review?.reviewedAt.toISOString() ?? null,
      frameworkVersion: summary?.frameworkVersion ?? null,
    }] as const;
  }));
}

export async function currentProgramTargets(programId: string, asOf = new Date()) {
  const versions = await db.programProcedureTarget.findMany({
    where: { programId, effectiveAt: { lte: asOf }, agreedAt: { lte: asOf } },
    orderBy: [{ version: 'desc' }],
  });
  return versions.filter((row, index) => versions.findIndex((other) => other.procedureDefinitionId === row.procedureDefinitionId) === index);
}
