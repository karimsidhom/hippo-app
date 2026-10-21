import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ membership: vi.fn(), members: vi.fn(), program: vi.fn(), assignments: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  programMember: { findUnique: m.membership, findMany: m.members },
  program: { findUnique: m.program }, facultyAssignment: { findMany: m.assignments },
} }));
import { getProgramProgressScope, getProgramResidentProgressAccess } from '@/lib/program-auth';

beforeEach(() => {
  vi.resetAllMocks();
  m.membership.mockResolvedValue({ id: 'faculty-member', role: 'PD' });
  m.program.mockResolvedValue({ id: 'program-a', name: 'Urology', specialty: 'urology', institution: 'Shared institution' });
  m.members.mockResolvedValue([{ userId: 'resident-a' }]);
});

describe('programme resident progress scope', () => {
  it('does not grant access from institution or profile role without membership', async () => {
    m.membership.mockResolvedValue(null);
    expect(await getProgramProgressScope('viewer', 'program-a')).toBeNull();
    expect(m.members).not.toHaveBeenCalled(); expect(m.program).not.toHaveBeenCalled();
  });
  it('withholds identifiable progress from coordinators', async () => {
    m.membership.mockResolvedValue({ id: 'coordinator', role: 'COORDINATOR' });
    expect(await getProgramProgressScope('viewer', 'program-a')).toBeNull();
    expect(m.members).not.toHaveBeenCalled();
  });
  it('intersects a PD roster with actual resident/fellow programme membership', async () => {
    const scope = await getProgramProgressScope('viewer', 'program-a');
    expect(scope?.residentUserIds).toEqual(['resident-a']);
    expect(m.members).toHaveBeenCalledWith({ where: {
      programId: 'program-a', user: { profile: { is: { roleType: { in: ['RESIDENT', 'FELLOW'] } } } },
    }, select: { userId: true } });
    expect(m.assignments).not.toHaveBeenCalled();
  });
  it('requires active assignments and same-program membership for faculty', async () => {
    m.membership.mockResolvedValue({ id: 'faculty-member', role: 'FACULTY' });
    m.assignments.mockResolvedValue([{ resident: { userId: 'resident-a' } }]);
    expect((await getProgramProgressScope('viewer', 'program-a'))?.residentUserIds).toEqual(['resident-a']);
    expect(m.assignments.mock.calls[0][0].where).toMatchObject({ programId: 'program-a', facultyId: 'faculty-member' });
    expect(m.assignments.mock.calls[0][0].where.AND).toHaveLength(2);
    expect(m.members.mock.calls[0][0].where.userId).toEqual({ in: ['resident-a'] });
  });
  it('does not expose an unassigned resident through the detail helper', async () => {
    expect(await getProgramResidentProgressAccess('viewer', 'program-a', 'resident-outside')).toBeNull();
    expect(await getProgramResidentProgressAccess('viewer', 'program-a', 'resident-a')).not.toBeNull();
  });
});
