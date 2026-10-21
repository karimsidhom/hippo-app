import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), membership: vi.fn(), program: vi.fn(), options: vi.fn(), procedure: vi.fn(), versions: vi.fn(), previous: vi.fn(), create: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ requireAuth: m.auth }));
vi.mock('@/lib/program-auth', () => ({ getMembership: m.membership, roleCanManageProgram: (role: string) => ['OWNER', 'PD'].includes(role) }));
vi.mock('@/lib/db', () => ({ db: {
  program: { findUnique: m.program }, procedureDefinition: { findMany: m.options, findFirst: m.procedure },
  programProcedureTarget: { findMany: m.versions }, $transaction: m.transaction,
} }));
import { GET, PUT } from '@/app/api/programs/[id]/targets/route';
const ctx = () => ({ params: Promise.resolve({ id: 'program-a' }) });
const body = () => ({ procedureDefinitionId: 'canonical-pcnl', target: 12, effectiveAt: '2026-11-01', agreed: true });
const req = (data?: unknown) => new Request('https://example.test/api/programs/program-a/targets', { method: data === undefined ? 'GET' : 'PUT', ...(data === undefined ? {} : { body: JSON.stringify(data), headers: { 'content-type': 'application/json' } }) });
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: { id: 'pd-user' }, error: null });
  m.membership.mockResolvedValue({ role: 'PD' });
  m.program.mockResolvedValue({ specialty: 'Urology' });
  m.procedure.mockResolvedValue({ id: 'canonical-pcnl', name: 'Percutaneous nephrolithotomy' });
  m.options.mockResolvedValue([{ id: 'canonical-pcnl', name: 'Percutaneous nephrolithotomy', category: 'Endourology' }]);
  m.versions.mockResolvedValue([]);
  m.previous.mockResolvedValue({ version: 2 });
  m.create.mockImplementation(async ({ data }) => ({ id: 'target-v3', ...data }));
  m.transaction.mockImplementation(async callback => callback({ programProcedureTarget: { findFirst: m.previous, create: m.create } }));
});
describe('agreed programme procedure targets', () => {
  it('requires authentication before reading targets', async () => {
    m.auth.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await GET(req(), ctx())).status).toBe(401);
    expect(m.membership).not.toHaveBeenCalled();
  });
  it('denies nonmembers and prevents faculty from agreeing targets', async () => {
    m.membership.mockResolvedValue(null);
    expect((await GET(req(), ctx())).status).toBe(403);
    m.membership.mockResolvedValue({ role: 'FACULTY' });
    expect((await PUT(req(body()), ctx())).status).toBe(403);
    expect(m.versions).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
  });
  it.each([
    { ...body(), agreed: false }, { ...body(), target: 0 }, { ...body(), target: 1.5 },
    { ...body(), effectiveAt: '2026-02-30' }, { ...body(), userId: 'forged' },
  ])('rejects invalid or unagreed targets without writing: %j', async input => {
    expect((await PUT(req(input), ctx())).status).toBe(400);
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it('only accepts active canonical procedures from the programme specialty', async () => {
    m.procedure.mockResolvedValue(null);
    expect((await PUT(req(body()), ctx())).status).toBe(400);
    expect(m.procedure.mock.calls[0][0].where).toMatchObject({ id: 'canonical-pcnl', isActive: true });
    expect(m.procedure.mock.calls[0][0].where.specialty.OR[0].slug.equals).toBe('urology');
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it('appends a version attributed to the authenticated director', async () => {
    const response = await PUT(req(body()), ctx());
    expect(response.status).toBe(201);
    expect((await response.json()).target).toMatchObject({ id: 'target-v3', version: 3, target: 12, procedureName: 'Percutaneous nephrolithotomy' });
    expect(m.create.mock.calls[0][0].data).toMatchObject({ programId: 'program-a', procedureDefinitionId: 'canonical-pcnl', agreedById: 'pd-user', version: 3 });
    expect(m.transaction.mock.calls[0][1]).toEqual({ isolationLevel: 'Serializable' });
  });
  it('retries a concurrent version conflict before saving', async () => {
    m.transaction.mockRejectedValueOnce({ code: 'P2034' });
    expect((await PUT(req(body()), ctx())).status).toBe(201);
    expect(m.transaction).toHaveBeenCalledTimes(2);
  });
  it('returns the latest agreed revision and canonical options, with read-only faculty access', async () => {
    m.membership.mockResolvedValue({ role: 'FACULTY' });
    const dates = { effectiveAt: new Date('2026-11-01'), agreedAt: new Date('2026-10-21') };
    m.versions.mockResolvedValue([
      { id: 'v2', procedureDefinitionId: 'canonical-pcnl', version: 2, target: 12, ...dates },
      { id: 'v1', procedureDefinitionId: 'canonical-pcnl', version: 1, target: 10, ...dates },
    ]);
    const response = await GET(req(), ctx()); const data = await response.json();
    expect(data.targets).toHaveLength(1); expect(data.targets[0]).toMatchObject({ id: 'v2', target: 12 });
    expect(data.canManage).toBe(false); expect(data.options[0].id).toBe('canonical-pcnl');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
