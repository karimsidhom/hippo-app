import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ snapshots: vi.fn(), revisions: vi.fn(), reviews: vi.fn(), targets: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  epaProgressSnapshot: { findMany: m.snapshots }, epaProgressRevision: { findMany: m.revisions },
  programEpaReconciliation: { findMany: m.reviews }, programProcedureTarget: { findMany: m.targets },
} }));
import { loadProgramHistoricalProgress, currentProgramTargets } from '@/lib/epa/program-progress';
import { progressContentHash } from '@/lib/epa/progress-hash';

function payload(filename: string) { return { source: { filename, review_date: '2026-09-29' }, interpretation: { unlisted_epa_status: 'complete', unlisted_criterion_status: 'complete' }, records: [],
  all_parent_epas: [{ code: 'C1', title: 'Example category', completion_status: 'complete', actual_completed_count: null }] }; }
const earlier = new Date('2026-10-01T00:00:00Z'), asOf = new Date('2026-10-20T00:00:00Z');
function current(source = payload('current.json')) {
  return { id: 'snapshot', userId: 'resident-a', specialtySlug: 'urology', payload: source, sourceFilename: source.source.filename,
    sourceReviewDate: new Date('2026-09-29T00:00:00Z'), importedAt: earlier, updatedAt: asOf, schemaVersion: 1, provenance: 'user_imported_summary' };
}
beforeEach(() => { vi.resetAllMocks(); m.snapshots.mockResolvedValue([]); m.revisions.mockResolvedValue([]); m.reviews.mockResolvedValue([]); m.targets.mockResolvedValue([]); });

describe('versioned program progress', () => {
  it('never reads future current payloads into an earlier report and reconstructs a prior recorded source', async () => {
    const source = payload('earlier.json');
    m.revisions.mockResolvedValue([{ id: 'revision', userId: 'resident-a', specialtySlug: 'urology', payload: source,
      contentHash: progressContentHash(source), sourceReviewDate: new Date('2026-09-29T00:00:00Z'), createdAt: earlier }]);
    const rows = await loadProgramHistoricalProgress('program-a', ['resident-a'], asOf);
    expect(rows.get('resident-a:urology')).toMatchObject({ sourceFilename: 'earlier.json', sourceVersionBasis: 'recorded_revision', reconciliationStatus: 'self_reported' });
    expect(m.snapshots).toHaveBeenCalledWith({ where: { userId: { in: ['resident-a'] }, updatedAt: { lte: asOf } } });
    expect(m.revisions).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: { in: ['resident-a'] }, createdAt: { lte: asOf } } }));
    expect(rows.get('resident-a:urology')?.summary?.limitations.join(' ')).toContain('activation history may be unavailable');
  });
  it('prefers the active current snapshot over a later-first-seen revision when a source was reverted', async () => {
    m.snapshots.mockResolvedValue([current(payload('reverted.json'))]);
    m.revisions.mockResolvedValue([{ ...current(payload('other-source.json')), createdAt: new Date('2026-10-10T00:00:00Z'), contentHash: 'other' }]);
    expect((await loadProgramHistoricalProgress('program-a', ['resident-a'], asOf)).get('resident-a:urology')).toMatchObject({ sourceFilename: 'reverted.json', sourceVersionBasis: 'current' });
  });
  it('uses only the latest matching source/specialty decision within the requested program and time', async () => {
    const row = current(); m.snapshots.mockResolvedValue([row]);
    m.reviews.mockResolvedValue([
      { residentId: 'resident-a', specialtySlug: 'urology', contentHash: 'changed-source', decision: 'approved', reviewedAt: asOf },
      { residentId: 'resident-a', specialtySlug: 'other', contentHash: progressContentHash(row.payload), decision: 'approved', reviewedAt: asOf },
      { residentId: 'resident-a', specialtySlug: 'urology', contentHash: progressContentHash(row.payload), decision: 'needs_review', reviewedAt: asOf },
      { residentId: 'resident-a', specialtySlug: 'urology', contentHash: progressContentHash(row.payload), decision: 'approved', reviewedAt: earlier },
    ]);
    const history = await loadProgramHistoricalProgress('program-a', ['resident-a'], asOf);
    expect(history.get('resident-a:urology')?.reconciliationStatus).toBe('needs_review');
    expect(m.reviews).toHaveBeenCalledWith(expect.objectContaining({ where: { programId: 'program-a', residentId: { in: ['resident-a'] }, reviewedAt: { lte: asOf } } }));
  });
  it('returns no import when no source had yet been recorded rather than borrowing a future version', async () => {
    expect((await loadProgramHistoricalProgress('program-a', ['resident-a'], asOf)).size).toBe(0);
  });
  it('does not read history without an authorized resident scope', async () => {
    expect((await loadProgramHistoricalProgress('program-a', [], asOf)).size).toBe(0);
    expect(m.snapshots).not.toHaveBeenCalled(); expect(m.reviews).not.toHaveBeenCalled();
  });
  it('keeps the latest effective agreed version per canonical procedure, including explicit zero', async () => {
    m.targets.mockResolvedValue([
      { id: 'a-v2', procedureDefinitionId: 'canonical-a', version: 2, target: 0 },
      { id: 'a-v1', procedureDefinitionId: 'canonical-a', version: 1, target: 10 },
      { id: 'b-v1', procedureDefinitionId: 'canonical-b', version: 1, target: 3 },
    ]);
    expect((await currentProgramTargets('program-a', asOf)).map(t => [t.id, t.target])).toEqual([['a-v2', 0], ['b-v1', 3]]);
    expect(m.targets).toHaveBeenCalledWith({ where: { programId: 'program-a', effectiveAt: { lte: asOf }, agreedAt: { lte: asOf } }, orderBy: [{ version: 'desc' }] });
  });
});
