import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ profiles: vi.fn(), observations: vi.fn(), snapshots: vi.fn(), history: vi.fn(), targets: vi.fn(), procedures: vi.fn(), cases: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  profile: { findMany: m.profiles }, epaObservation: { findMany: m.observations }, epaProgressSnapshot: { findMany: m.snapshots },
  procedureDefinition: { findMany: m.procedures }, caseLog: { groupBy: m.cases },
} }));
vi.mock('@/lib/epa/program-progress', () => ({ loadProgramHistoricalProgress: m.history, currentProgramTargets: m.targets }));
import { reportProgramProgress, reportProgramTargets } from '@/lib/reports/program-progress';
import { reportEpaMatrix, reportCohortHeatmap, REPORTS } from '@/lib/reports/queries';

const residents = [
  { userId: 'r1', specialty: 'Urology', trainingYearLabel: 'PGY 3', user: { name: 'First Resident', email: 'first@example.test' } },
  { userId: 'r2', specialty: 'Orthopedic Surgery', trainingYearLabel: 'PGY 2', user: { name: 'Second Resident', email: 'second@example.test' } },
];
const asOf = new Date('2026-10-21T12:00:00Z');
beforeEach(() => {
  vi.resetAllMocks();
  m.profiles.mockImplementation(async args => args.select.trainingCountry ? residents.map(r => ({ userId: r.userId, trainingCountry: 'CA' })) : residents);
  m.observations.mockResolvedValue([]); m.snapshots.mockResolvedValue([]); m.history.mockResolvedValue(new Map());
  m.targets.mockResolvedValue([]); m.procedures.mockResolvedValue([]); m.cases.mockResolvedValue([]);
});

describe('program historical and canonical target reports', () => {
  it('includes every resident/fellow and preserves unavailable historical values as null', async () => {
    const rows = await reportProgramProgress('program-a', asOf);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ residentId: 'r2', categoriesCompleted: null, individualMinimumCredited: null,
      actualHistoricalSubmissions: null, reconciliationStatus: 'no_import', signedObservations: 0 });
    expect(m.profiles).toHaveBeenCalledWith(expect.objectContaining({ where: {
      roleType: { in: ['RESIDENT', 'FELLOW'] }, user: { programMemberships: { some: { programId: 'program-a' } } },
    } }));
    expect(m.history).toHaveBeenCalledWith('program-a', ['r1', 'r2'], asOf);
  });

  it('keeps native signed observations separate and finds display-name specialties by canonical slug', async () => {
    m.history.mockResolvedValue(new Map([['r2:orthopedic', {
      summary: { categories: { completed: 2, remaining: 1, total: 3 }, individual: { creditedMinimum: 7, requiredMinimum: 10, remainingMaximum: 3, actualCompleted: null } },
      reconciliationStatus: 'approved', reviewDate: '2026-09-29', sourceFilename: 'source.json', contentHash: 'version-hash', frameworkVersion: 'verified-v1', reviewedAt: '2026-10-20T12:00:00Z',
    }]]));
    m.observations.mockResolvedValue([
      { userId: 'r2', status: 'SIGNED', achievement: 'ACHIEVED' },
      { userId: 'r2', status: 'SIGNED', achievement: 'NOT_ACHIEVED' },
      { userId: 'r2', status: 'DRAFT', achievement: 'ACHIEVED' },
    ]);
    const rows = await reportProgramProgress('program-a', asOf);
    expect(rows[1]).toMatchObject({ specialty: 'orthopedic', individualMinimumCredited: 7, signedObservations: 2, signedAchieved: 1,
      pendingObservations: 1, sourceHash: 'version-hash', frameworkVersion: 'verified-v1', reconciliationStatus: 'approved' });
    expect(m.observations).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: { in: ['r1', 'r2'] }, createdAt: { lte: asOf } } }));
    expect(rows[1].individualMinimumCredited).not.toBe(9);
  });

  it('reports all resident-target pairs including zero canonical cases and exact agreed version', async () => {
    m.targets.mockResolvedValue([
      { id: 'agreed-v2', procedureDefinitionId: 'canonical-a', target: 10, version: 2, agreedAt: asOf, effectiveAt: asOf },
      { id: 'agreed-zero', procedureDefinitionId: 'canonical-b', target: 0, version: 3, agreedAt: asOf, effectiveAt: asOf },
    ]);
    m.procedures.mockResolvedValue([{ id: 'canonical-a', name: 'Canonical procedure' }, { id: 'canonical-b', name: 'Other procedure' }]);
    m.cases.mockResolvedValue([
      { userId: 'r1', procedureDefinitionId: 'canonical-a', _count: { _all: 4 } },
      { userId: 'r1', procedureDefinitionId: null, _count: { _all: 200 } },
      { userId: 'r1', procedureDefinitionId: 'legacy-label', _count: { _all: 99 } },
    ]);
    const rows = await reportProgramTargets('program-a', asOf);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ target: 10, recordedCases: 4, remaining: 6, version: 2, targetId: 'agreed-v2' });
    expect(rows[2]).toMatchObject({ target: 10, recordedCases: 0, remaining: 10 });
    expect(rows[3]).toMatchObject({ target: 0, recordedCases: 0, remaining: 0, version: 3 });
    expect(m.cases).toHaveBeenCalledWith(expect.objectContaining({ where: {
      userId: { in: ['r1', 'r2'] }, procedureDefinitionId: { in: ['canonical-a', 'canonical-b'] }, caseDate: { lte: asOf },
    } }));
  });
});

describe('native observation reports', () => {
  it('seeds framework EPA rows for residents with zero observations and counts achieved only after signing', async () => {
    m.observations.mockResolvedValue([
      { userId: 'r1', epaId: 'C1', epaTitle: 'Consultation', status: 'DRAFT', achievement: 'ACHIEVED' },
      { userId: 'r1', epaId: 'C1', epaTitle: 'Consultation', status: 'SIGNED', achievement: 'ACHIEVED' },
      { userId: 'r1', epaId: 'C1', epaTitle: 'Consultation', status: 'SIGNED', achievement: 'NOT_ACHIEVED' },
    ]);
    const rows = await reportEpaMatrix('program-a');
    expect(rows.filter(r => r.residentEmail === residents[0].user.email)).toHaveLength(39);
    expect(rows.some(r => r.residentEmail === residents[1].user.email && r.totalObservations === 0)).toBe(true);
    expect(rows.find(r => r.residentEmail === residents[0].user.email && r.epaId === 'C1')).toMatchObject({ totalObservations: 3, signedObservations: 2, achievedObservations: 1, percentSigned: 67 });
    expect(rows.find(r => r.residentEmail === residents[0].user.email && r.epaId === 'F4')).toMatchObject({ totalObservations: 0, signedObservations: 0, achievedObservations: 0, percentSigned: 0 });
  });

  it('uses imported parent inventory when no local catalog is available', async () => {
    m.profiles.mockImplementation(async args => args.select.trainingCountry ? [{ userId: 'r1', trainingCountry: 'CA' }] : [{ ...residents[0], specialty: 'Other' }]);
    m.snapshots.mockResolvedValue([{ userId: 'r1', specialtySlug: 'other', payload: {
      source: { filename: 'inventory.json', review_date: '2026-09-29' }, records: [],
      all_parent_epas: [{ code: 'LOCAL1', title: 'Local category', completion_status: 'complete', actual_completed_count: null }],
    } }]);
    expect(await reportEpaMatrix('program-a')).toMatchObject([{ epaId: 'LOCAL1', epaTitle: 'Local category', totalObservations: 0 }]);
  });

  it('includes residents with no observations in the per-stage sign-off report', async () => {
    m.observations.mockResolvedValue([
      { userId: 'r1', epaId: 'C1', status: 'SIGNED' },
      { userId: 'r1', epaId: 'C2', status: 'PENDING_REVIEW' },
      { userId: 'r1', epaId: 'F4', status: 'DRAFT' },
    ]);
    const rows = await reportCohortHeatmap('program-a');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ totalEpas: 3, signedEpas: 1, percentSigned: 33, c: 50, f: 0 });
    expect(rows[1]).toMatchObject({ totalEpas: 0, signedEpas: 0, percentSigned: 0, td: 0, f: 0, c: 0, ttp: 0 });
    expect(REPORTS.find(report => report.id === 'epa-matrix')?.title).toBe('EPA observation matrix');
    expect(REPORTS.find(report => report.id === 'cohort-heatmap')?.title).toBe('Observation sign-off by stage');
  });
});
