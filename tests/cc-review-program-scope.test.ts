import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), review: vi.fn(), update: vi.fn(), membership: vi.fn(), members: vi.fn(), assignments: vi.fn(), program: vi.fn(), createNote: vi.fn(), note: vi.fn(), deleteNote: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ requireAuth: m.auth }));
vi.mock('@/lib/db', () => ({ db: {
  cCReview: { findUnique: m.review, update: m.update },
  programMember: { findUnique: m.membership, findMany: m.members },
  facultyAssignment: { findMany: m.assignments }, program: { findUnique: m.program },
  cCReviewNote: { create: m.createNote, findUnique: m.note, delete: m.deleteNote },
} }));
import { GET, PATCH } from '@/app/api/cc-reviews/[id]/route';
import { POST, DELETE } from '@/app/api/cc-reviews/[id]/notes/route';
const review = () => ({ id: 'review-a', programId: 'program-a', residentId: 'resident-a', status: 'IN_PROGRESS' });
const ctx = () => ({ params: Promise.resolve({ id: 'review-a' }) });
function req(method = 'GET', body?: unknown) {
  return new NextRequest('https://example.test/api/cc-reviews/review-a?noteId=note-a', { method, ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: { id: 'viewer' }, error: null });
  m.review.mockImplementation(async ({ select }) => select ? review() : { ...review(), snapshot: { historicalProgress: [{ sourceFilename: 'private-source.doc' }] }, notes: [] });
  m.membership.mockImplementation(async ({ where }) => where.programId_userId.programId === 'program-a' ? { id: 'viewer-member', role: 'OWNER' } : null);
  m.members.mockResolvedValue([{ userId: 'resident-a' }]);
  m.program.mockResolvedValue({ id: 'program-a', name: 'Programme A', specialty: 'urology', institution: 'Same institution' });
  m.assignments.mockResolvedValue([]);
  m.update.mockImplementation(async ({ data }) => ({ ...review(), ...data }));
  m.createNote.mockResolvedValue({ id: 'note-a', authorId: 'viewer' });
  m.note.mockResolvedValue({ id: 'note-a', reviewId: 'review-a', authorId: 'viewer' });
});

describe('CC review detail and notes respect programme access', () => {
  it.each([['GET', GET, undefined], ['PATCH', PATCH, { chairSummary: 'text' }], ['POST', POST, { body: 'text' }], ['DELETE', DELETE, undefined]] as const)('authenticates %s before reading a review', async (method, handler, body) => {
    m.auth.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await handler(req(method, body), ctx())).status).toBe(401);
    expect(m.review).not.toHaveBeenCalled();
  });
  it('rejects cross-program reads even when institution labels match', async () => {
    m.review.mockResolvedValue({ ...review(), programId: 'program-b' });
    expect((await GET(req(), ctx())).status).toBe(403);
    expect(m.review).toHaveBeenCalledTimes(1);
    expect(m.members).not.toHaveBeenCalled();
  });
  it('does not disclose frozen historical summaries to coordinators', async () => {
    m.membership.mockResolvedValue({ id: 'coordinator', role: 'COORDINATOR' });
    const response = await GET(req(), ctx());
    expect(response.status).toBe(403); expect(JSON.stringify(await response.json())).not.toContain('private-source');
    expect(m.review).toHaveBeenCalledTimes(1);
  });
  it('allows only assigned active faculty to read a resident review', async () => {
    m.membership.mockResolvedValue({ id: 'faculty', role: 'FACULTY' });
    m.members.mockImplementation(async ({ where }) => where.userId?.in.includes('resident-a') ? [{ userId: 'resident-a' }] : []);
    expect((await GET(req(), ctx())).status).toBe(403);
    m.assignments.mockResolvedValue([{ resident: { userId: 'resident-a' } }]);
    const response = await GET(req(), ctx());
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toContain('private, no-store');
    expect(m.assignments.mock.calls[0][0].where.AND).toHaveLength(2);
    expect((await POST(req('POST', { body: 'Faculty note' }), ctx())).status).toBe(403);
  });
  it('preserves a resident’s own read while denying peer access and all writes', async () => {
    m.auth.mockResolvedValue({ user: { id: 'resident-a' }, error: null });
    expect((await GET(req(), ctx())).status).toBe(200);
    expect((await PATCH(req('PATCH', { chairSummary: 'mine' }), ctx())).status).toBe(403);
    expect((await POST(req('POST', { body: 'mine' }), ctx())).status).toBe(403);
    m.membership.mockResolvedValue(null);
    expect((await GET(req(), ctx())).status).toBe(403);
  });
  it('keeps finalisation OWNER-only and permits scoped committee text edits', async () => {
    m.membership.mockResolvedValue({ id: 'committee', role: 'CC_MEMBER' });
    expect((await PATCH(req('PATCH', { status: 'FINALISED' }), ctx())).status).toBe(403);
    expect((await PATCH(req('PATCH', { chairSummary: 'Reviewed progress' }), ctx())).status).toBe(200);
    m.membership.mockResolvedValue({ id: 'owner', role: 'OWNER' });
    expect((await PATCH(req('PATCH', { status: 'FINALISED' }), ctx())).status).toBe(200);
    expect(m.update.mock.calls.at(-1)?.[0].data).toMatchObject({ status: 'FINALISED', finalisedById: 'viewer' });
  });
  it('rejects attempts to replace a frozen snapshot and prevents finalized note deletion', async () => {
    expect((await PATCH(req('PATCH', { snapshot: { forged: true } }), ctx())).status).toBe(400);
    expect(m.update).not.toHaveBeenCalled();
    m.review.mockResolvedValue({ ...review(), status: 'FINALISED' });
    expect((await DELETE(req('DELETE'), ctx())).status).toBe(409);
    expect((await POST(req('POST', { body: 'late edit' }), ctx())).status).toBe(409);
    expect(m.deleteNote).not.toHaveBeenCalled(); expect(m.createNote).not.toHaveBeenCalled();
  });
  it('requires current scoped committee access and original authorship to delete a note', async () => {
    m.note.mockResolvedValue({ id: 'note-a', reviewId: 'review-a', authorId: 'another-member' });
    expect((await DELETE(req('DELETE'), ctx())).status).toBe(403);
    m.note.mockResolvedValue({ id: 'note-a', reviewId: 'different-review', authorId: 'viewer' });
    expect((await DELETE(req('DELETE'), ctx())).status).toBe(404);
    m.note.mockResolvedValue({ id: 'note-a', reviewId: 'review-a', authorId: 'viewer' });
    expect((await DELETE(req('DELETE'), ctx())).status).toBe(200);
    expect(m.deleteNote).toHaveBeenCalledWith({ where: { id: 'note-a' } });
  });
});
