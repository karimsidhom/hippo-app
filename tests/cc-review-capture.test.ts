import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), ensure: vi.fn(), owner: vi.fn(), access: vi.fn(), scope: vi.fn(), history: vi.fn(), targets: vi.fn(), count: vi.fn(), groups: vi.fn(), observations: vi.fn(), create: vi.fn(), list: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ requireAuth: m.auth, ensureDbUser: m.ensure }));
vi.mock('@/lib/program-auth', () => ({ isProgramOwner: m.owner, getProgramResidentProgressAccess: m.access, getProgramProgressScope: m.scope }));
vi.mock('@/lib/epa/program-progress', () => ({ loadProgramHistoricalProgress: m.history, currentProgramTargets: m.targets }));
vi.mock('@/lib/db', () => ({ db: { caseLog: { count: m.count, groupBy: m.groups }, epaObservation: { groupBy: m.groups, findMany: m.observations }, cCReview: { create: m.create, findMany: m.list } } }));
import { GET, POST } from '@/app/api/cc-reviews/route';
const input = () => ({ programId: 'program-a', residentId: 'resident-a', meetingDate: '2026-11-01', cycleLabel: 'Autumn review' });
const req = (body = input()) => new NextRequest('https://example.test/api/cc-reviews?programId=program-a', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: { id: 'owner' }, error: null }); m.owner.mockResolvedValue(true); m.access.mockResolvedValue({ role: 'OWNER' });
  m.scope.mockResolvedValue({ residentUserIds: ['resident-a'] });
  m.count.mockResolvedValue(2); m.groups.mockResolvedValue([{ status: 'SIGNED', _count: { _all: 1 } }, { status: 'PENDING_REVIEW', _count: { _all: 1 } }]); m.observations.mockResolvedValue([]);
  m.history.mockResolvedValue(new Map([['resident-a:urology', {
    summary: { categories: { completed: 18, remaining: 21, total: 39 }, individual: { creditedMinimum: 187, requiredMinimum: 266, actualCompleted: null } },
    sourceFilename: 'historical.doc', reviewDate: '2026-09-29', contentHash: 'version-hash', reconciliationStatus: 'approved', reviewedAt: '2026-10-21T00:00:00.000Z', frameworkVersion: 'urology-v2',
  }]]));
  m.targets.mockResolvedValue([{ id: 'target-version-2', procedureDefinitionId: 'pcnl', target: 12, version: 2, effectiveAt: new Date('2026-10-01'), agreedAt: new Date('2026-10-01'), createdAt: new Date('2026-10-01') }]);
  m.create.mockImplementation(async ({ data }) => ({ id: 'review-a', ...data })); m.list.mockResolvedValue([]);
});

describe('CC evidence capture', () => {
  it('does not capture an arbitrary resident outside the selected programme', async () => {
    m.access.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(403);
    expect(m.history).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
  });
  it('freezes source version, reconciliation and agreed target version separately from signed observations', async () => {
    const response = await POST(req()); expect(response.status).toBe(200);
    const captured = m.create.mock.calls[0][0].data.snapshot;
    expect(captured).toMatchObject({ epaTotal: 2, epaSigned: 1, epaCompletionPct: 50 });
    expect(captured.historicalProgress[0]).toMatchObject({ specialty: 'urology', contentHash: 'version-hash', reconciliationStatus: 'approved', frameworkVersion: 'urology-v2', summary: { individual: { actualCompleted: null, creditedMinimum: 187 } } });
    expect(captured.agreedProcedureTargets[0]).toMatchObject({ id: 'target-version-2', version: 2, target: 12, effectiveAt: '2026-10-01T00:00:00.000Z', recordedCases: 0, remaining: 12 });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(m.history.mock.calls[0][2].toISOString()).toBe(captured.capturedAt);
    expect(m.targets.mock.calls[0][1].toISOString()).toBe(captured.capturedAt);
  });
  it('lists only reviews for the active programme roster', async () => {
    const response = await GET(new NextRequest('https://example.test/api/cc-reviews?programId=program-a'));
    expect(response.status).toBe(200);
    expect(m.list.mock.calls[0][0].where).toEqual({ programId: 'program-a', residentId: { in: ['resident-a'] } });
    m.scope.mockResolvedValue(null);
    expect((await GET(new NextRequest('https://example.test/api/cc-reviews?programId=program-a'))).status).toBe(403);
  });
});
