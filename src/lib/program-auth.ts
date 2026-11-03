// ---------------------------------------------------------------------------
// Program authorization helpers
//
// CBD programmes have multiple roles. Staff and program directors have
// full access to their program (Karim's call, 2026-11-03): every staff
// role below reads everything the director reads, including every
// resident and the 1:1 meeting records. Two acts stay with the director's
// seat, because they change the program rather than read it: managing the
// roster and roles, and finalising a CC decision (which the chair shares).
//
//   PD / OWNER     — full access; manages roster + invites; finalises CC
//   CHAIR          — full access; finalises CC reviews
//   CC_MEMBER      — full access; writes notes + decisions on CC reviews
//   FACULTY        — full access. Standard EPA sign-off.
//   DEPT_HEAD      — full access across programmes they belong to
//   COORDINATOR    — manages invites + scheduling; sees the roster, never
//                    case content or 1:1 records
//
// Legacy values:
//   OWNER  — kept as the PD-equivalent.
//   MEMBER — what an accepted invite creates, residents included, until a
//            director assigns a role. Sees only residents assigned to it.
// ---------------------------------------------------------------------------
import type { ProgramMemberRole } from '@prisma/client';
import { db } from './db';

/**
 * Returns the user's membership row for the given program, or null if the user
 * is not a member.
 */
export async function getMembership(userId: string, programId: string) {
  return db.programMember.findUnique({
    where: { programId_userId: { programId, userId } },
  });
}

// ─── Role buckets ────────────────────────────────────────────────────
// We frame access checks in terms of capabilities, not raw role
// strings, so individual route handlers don't grow brittle role
// pattern-matches.
//
//   roleCanManageProgram  — invite, edit roster, write rotations etc.
//   roleCanReadAllResidents — see every resident on the PD dashboard
//   roleCanFinaliseCC     — chair-equivalent; finalises CC review
//   roleSeesPhi           — has access to case content (excludes
//                           COORDINATOR)
//
// Map each new role to its capabilities here.

const PD_LIKE: ProgramMemberRole[] = ['OWNER', 'PD'];
// Every role a director gives a staff physician. MEMBER is not one: it is
// what an invite creates before anyone has decided who the person is.
const STAFF: ProgramMemberRole[] = ['OWNER', 'PD', 'CHAIR', 'CC_MEMBER', 'FACULTY', 'DEPT_HEAD'];
const READ_ALL: ProgramMemberRole[] = [
  ...STAFF,
  'COORDINATOR', // sees the roster, just not the PHI
];
const FINALISES_CC: ProgramMemberRole[] = ['OWNER', 'PD', 'CHAIR'];
const PHI_BLIND: ProgramMemberRole[] = ['COORDINATOR'];
// PD 1:1 meeting records were the director's alone until Karim opened
// them to all staff (2026-11-03). The coordinator holds roster access but
// still never sees a 1:1 record.
const READS_PD_MEETINGS: ProgramMemberRole[] = STAFF;

/** For Prisma `role: { in: PROGRAM_STAFF_ROLES }` filters. */
export const PROGRAM_STAFF_ROLES: readonly ProgramMemberRole[] = STAFF;

/** Profile roles that may open the staff surfaces at all. What they then
 *  see is decided by program membership, never by this self-chosen role. */
export const STAFF_PROFILE_ROLES: readonly string[] = ['PROGRAM_DIRECTOR', 'ATTENDING', 'STAFF'];

export function roleIsProgramStaff(role: ProgramMemberRole): boolean {
  return STAFF.includes(role);
}
export function roleCanManageProgram(role: ProgramMemberRole): boolean {
  return PD_LIKE.includes(role);
}
export function roleCanReadAllResidents(role: ProgramMemberRole): boolean {
  return READ_ALL.includes(role);
}
export function roleCanFinaliseCC(role: ProgramMemberRole): boolean {
  return FINALISES_CC.includes(role);
}
export function roleCanReadPdMeetings(role: ProgramMemberRole): boolean {
  return READS_PD_MEETINGS.includes(role);
}
export function roleSeesPhi(role: ProgramMemberRole): boolean {
  return !PHI_BLIND.includes(role);
}

/**
 * True if the user has OWNER or PD role on the program — the only
 * roles that can manage the roster, send invites, edit rotations etc.
 */
export async function isProgramOwner(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await getMembership(userId, programId);
  return m ? roleCanManageProgram(m.role) : false;
}

/**
 * True if the user holds a staff role on the program: full read access,
 * reports and 1:1 records included.
 */
export async function isProgramStaff(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await getMembership(userId, programId);
  return m ? roleIsProgramStaff(m.role) : false;
}

/**
 * True if the user is any member (any role).
 */
export async function isProgramMember(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await getMembership(userId, programId);
  return !!m;
}

/**
 * True iff the user is a Program Director (the only profile-role that
 * can create programs). Attendings/staff cannot create programs but
 * can be invited and assigned roles.
 */
export async function isProgramDirector(userId: string): Promise<boolean> {
  const profile = await db.profile.findUnique({ where: { userId } });
  return profile?.roleType === 'PROGRAM_DIRECTOR';
}

// ─── Resident-roster scoping ───────────────────────────────────────────
// Staff and the coordinator see the whole program. A MEMBER with no role
// assigned yet only sees residents it has an active FacultyAssignment to.
// Returns the userIds of every resident the caller is allowed to see.

export interface ResidentRosterScope {
  /** The list of resident userIds the caller is allowed to see. */
  residentUserIds: string[];
  /** True when the caller has cohort-wide read access (no filter applied). */
  unbounded: boolean;
  /** Caller's role on this program, for downstream use. */
  role: ProgramMemberRole;
}

/**
 * Compute the resident roster a given user is allowed to see in a
 * given program. Staff roles and the coordinator see everyone; a MEMBER
 * with no role yet sees only its directly-assigned residents.
 */
export async function getResidentRosterScope(
  userId: string,
  programId: string,
  opts: { onlyActive?: boolean } = {},
): Promise<ResidentRosterScope | null> {
  const member = await getMembership(userId, programId);
  if (!member) return null;

  if (roleCanReadAllResidents(member.role)) {
    return {
      residentUserIds: [],
      unbounded: true,
      role: member.role,
    };
  }

  // MEMBER scope: only residents this member has an assignment to.
  const now = new Date();
  const assignments = await db.facultyAssignment.findMany({
    where: {
      programId,
      facultyId: member.id,
      ...(opts.onlyActive
        ? {
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
          }
        : {}),
    },
    include: {
      resident: { select: { userId: true } },
    },
  });

  const residentUserIds = Array.from(
    new Set(assignments.map((a) => a.resident.userId)),
  );

  return {
    residentUserIds,
    unbounded: false,
    role: member.role,
  };
}

// ─── Who a staff member actually directs ──────────────────────────────
// The PD surfaces used to answer this with `Profile.institution` string
// equality, which is self-declared free text: any account could set its
// own roleType to PROGRAM_DIRECTOR and its institution to a real one and
// read that institution's whole roster. Membership of a Program is the
// only trustworthy answer, because a ProgramMember row can only be
// created by the resident accepting an invite or a director approving a
// request they opened.

export interface DirectedRoster {
  /** Programs where the caller has cohort-wide read. */
  unboundedProgramIds: string[];
  /** Every other user the caller may look at, across all their programs. */
  residentUserIds: string[];
  /** True when the caller belongs to no program at all. */
  noMemberships: boolean;
}

/**
 * The set of users a staff member is allowed to see, derived purely from
 * program membership. Staff roles and the coordinator get everyone in
 * those programs; a MEMBER with no role yet gets only its actively-assigned
 * residents. Belonging to no program returns an empty set, never an
 * institution-wide fallback.
 */
export async function getDirectedResidents(
  userId: string,
): Promise<DirectedRoster> {
  const memberships = await db.programMember.findMany({
    where: { userId },
    select: { id: true, role: true, programId: true },
  });

  if (memberships.length === 0) {
    return { unboundedProgramIds: [], residentUserIds: [], noMemberships: true };
  }

  const unboundedProgramIds = memberships
    .filter((m) => roleCanReadAllResidents(m.role))
    .map((m) => m.programId);

  const ids = new Set<string>();

  if (unboundedProgramIds.length > 0) {
    const rows = await db.programMember.findMany({
      where: {
        programId: { in: unboundedProgramIds },
        userId: { not: userId },
      },
      select: { userId: true },
    });
    for (const r of rows) ids.add(r.userId);
  }

  // MEMBER with no role yet: only its active assignments.
  const boundedMemberIds = memberships
    .filter((m) => !roleCanReadAllResidents(m.role))
    .map((m) => m.id);

  if (boundedMemberIds.length > 0) {
    const now = new Date();
    const assignments = await db.facultyAssignment.findMany({
      where: {
        facultyId: { in: boundedMemberIds },
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: { resident: { select: { userId: true } } },
    });
    for (const a of assignments) ids.add(a.resident.userId);
  }

  return {
    unboundedProgramIds,
    residentUserIds: Array.from(ids),
    noMemberships: false,
  };
}

/** True iff `residentUserId` is someone `staffUserId` directs. */
export async function directsResident(
  staffUserId: string,
  residentUserId: string,
): Promise<boolean> {
  if (staffUserId === residentUserId) return false;
  const scope = await getDirectedResidents(staffUserId);
  return scope.residentUserIds.includes(residentUserId);
}
