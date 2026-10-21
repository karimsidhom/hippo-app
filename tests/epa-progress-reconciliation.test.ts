import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), owner: vi.fn(), access: vi.fn(), transaction: vi.fn(), find: vi.fn(), revision: vi.fn(), decision: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ requireAuth: m.auth }));
vi.mock('@/lib/program-auth', () => ({ isProgramOwner: m.owner, getProgramResidentProgressAccess: m.access }));
vi.mock('@/lib/db', () => ({ db: { $transaction: m.transaction, epaProgressSnapshot: { findUnique: m.find } } }));
import { POST } from '@/app/api/programs/[id]/epa-reconciliation/route';
import { progressContentHash } from '@/lib/epa/progress-hash';

const actor = { id: 'program-owner', email: 'owner@example.test' };
const payload = { source: { filename: 'source.json', review_date: '2026-09-29' }, records: [],
  all_parent_epas: [{ code: 'C1', title: 'Example', completion_status: 'complete', actual_completed_count: null }] };
const context = { params: Promise.resolve({ id: 'program-a' }) };
function request(overrides: Record<string, unknown> = {}) {
  return new Request('https://example.test/api/programs/program-a/epa-reconciliation', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ residentId: 'resident-a', specialty: 'urology', contentHash: progressContentHash(payload), decision: 'approved', note: 'Reviewed source.', ...overrides }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: actor, error: null }); m.owner.mockResolvedValue(true); m.access.mockResolvedValue({ program: { id: 'program-a' } });
  m.find.mockResolvedValue({ payload, sourceReviewDate: new Date('2026-09-29T00:00:00Z') });
  m.decision.mockImplementation(async ({ data }) => ({ ...data, reviewedAt: new Date('2026-10-21T12:00:00Z') }));
  m.transaction.mockImplementation(async callback => callback({ epaProgressSnapshot: { findUnique: m.find }, epaProgressRevision: { upsert: m.revision }, programEpaReconciliation: { create: m.decision } }));
});

describe('progress source hashing', () => {
  it('is stable across object key ordering at every depth', () => {
    expect(progressContentHash({ z: [{ b: 2, a: 1 }], a: { y: null, x: 0 } })).toBe(progressContentHash({ a: { x: 0, y: null }, z: [{ a: 1, b: 2 }] }));
    expect(progressContentHash(payload)).toMatch(/^[a-f0-9]{64}$/);
  });
  it('changes when an unknown count becomes zero or array/source contents change', () => {
    expect(progressContentHash({ count: null })).not.toBe(progressContentHash({ count: 0 }));
    expect(progressContentHash(['A', 'B'])).not.toBe(progressContentHash(['B', 'A']));
    expect(progressContentHash(payload)).not.toBe(progressContentHash({ ...payload, source: { ...payload.source, filename: 'replacement.json' } }));
  });
});

describe('program reconciliation decisions', () => {
  it('authenticates before looking up membership or private source', async () => {
    m.auth.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await POST(request(), context)).status).toBe(401);
    expect(m.owner).not.toHaveBeenCalled(); expect(m.find).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('does not let a coordinator/non-owner approve or access the source', async () => {
    m.owner.mockResolvedValue(false);
    expect((await POST(request(), context)).status).toBe(403);
    expect(m.owner).toHaveBeenCalledWith(actor.id, 'program-a');
    expect(m.access).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('blocks a program owner from reviewing a resident outside that program', async () => {
    m.access.mockResolvedValue(null);
    expect((await POST(request({ residentId: 'resident-b' }), context)).status).toBe(403);
    expect(m.access).toHaveBeenCalledWith(actor.id, 'program-a', 'resident-b');
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it('returns conflict when the reviewed source changed, without creating a revision or decision', async () => {
    const response = await POST(request({ contentHash: 'a'.repeat(64) }), context);
    expect(response.status).toBe(409); expect(m.revision).not.toHaveBeenCalled(); expect(m.decision).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toContain('private, no-store');
  });
  it('preserves the exact version and appends an actor-scoped decision in one serializable transaction', async () => {
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(m.find).toHaveBeenCalledWith({ where: { userId_specialtySlug: { userId: 'resident-a', specialtySlug: 'urology' } } });
    expect(m.revision).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_specialtySlug_contentHash: {
      userId: 'resident-a', specialtySlug: 'urology', contentHash: progressContentHash(payload),
    } }, update: {} }));
    expect(m.decision).toHaveBeenCalledWith({ data: { programId: 'program-a', residentId: 'resident-a', specialtySlug: 'urology', contentHash: progressContentHash(payload),
      decision: 'approved', note: 'Reviewed source.', reviewedById: actor.id } });
    expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(await response.json()).toMatchObject({ decision: 'approved', contentHash: progressContentHash(payload) });
  });
  it('rejects forged reviewer fields and returns a private generic failure', async () => {
    expect((await POST(request({ reviewedById: 'another-user' }), context)).status).toBe(400);
    m.transaction.mockRejectedValue(new Error('private source postgres://secret'));
    const response = await POST(request(), context);
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toMatch(/postgres|secret|private source/);
  });
});
