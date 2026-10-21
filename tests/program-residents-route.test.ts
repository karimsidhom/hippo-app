import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ auth: vi.fn(), scope: vi.fn(), profiles: vi.fn(), history: vi.fn(), caseCount: vi.fn(), lastCase: vi.fn(), epaCount: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ requireAuth: m.auth }));
vi.mock('@/lib/program-auth', () => ({ getProgramProgressScope: m.scope }));
vi.mock('@/lib/epa/program-progress', () => ({ loadProgramHistoricalProgress: m.history }));
vi.mock('@/lib/db', () => ({ db: { profile: { findMany: m.profiles }, caseLog: { count: m.caseCount, findFirst: m.lastCase }, epaObservation: { count: m.epaCount } } }));
import { GET } from '@/app/api/pd/residents/route';
const req = (query = 'programId=program-a') => new Request(`https://example.test/api/pd/residents?${query}`);
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: { id: 'viewer' }, error: null });
  m.scope.mockResolvedValue({ program: { id: 'program-a', name: 'Urology programme', institution: 'Shared institution', specialty: 'urology' }, role: 'PD', residentUserIds: ['resident-a'] });
  m.profiles.mockResolvedValue([{ userId: 'resident-a', specialty: 'Urology', roleType: 'RESIDENT', pgyYear: 4, trainingYearLabel: 'PGY4', user: { name: 'Resident', email: 'resident@example.test', image: null } }]);
  m.history.mockResolvedValue(new Map()); m.caseCount.mockResolvedValue(0); m.epaCount.mockResolvedValue(0); m.lastCase.mockResolvedValue(null);
});
describe('programme-scoped resident roster', () => {
  it('requires an explicit programme instead of using institution-wide defaults', async () => {
    expect((await GET(req(''))).status).toBe(400);
    expect(m.scope).not.toHaveBeenCalled(); expect(m.profiles).not.toHaveBeenCalled();
  });
  it('fails closed before resident queries when access is denied', async () => {
    m.scope.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(403);
    expect(m.profiles).not.toHaveBeenCalled(); expect(m.history).not.toHaveBeenCalled();
  });
  it('retains historical-only residents, with separate native counts and provenance', async () => {
    const historical = { summary: { categories: { completed: 18, remaining: 21, total: 39 } }, sourceFilename: 'progress.doc', reviewDate: '2026-09-29', importedAt: '2026-10-21T00:00:00.000Z', reconciliationStatus: 'self_reported' };
    m.history.mockResolvedValue(new Map([['resident-a:urology', historical]]));
    const response = await GET(req()); const data = await response.json();
    expect(data).toMatchObject({ programId: 'program-a', programName: 'Urology programme' });
    expect(data.residents).toHaveLength(1); expect(data.residents[0]).toMatchObject({ epaTotal: 0, epaSigned: 0, historicalProgress: historical });
    expect(m.profiles.mock.calls[0][0].where).toEqual({ userId: { in: ['resident-a'] }, roleType: { in: ['RESIDENT', 'FELLOW'] } });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('exposes a missing import as null and hides storage failure details', async () => {
    expect((await (await GET(req())).json()).residents[0].historicalProgress).toBeNull();
    m.history.mockRejectedValue(new Error('private source and database credentials'));
    const response = await GET(req()); expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('credentials');
  });
});
