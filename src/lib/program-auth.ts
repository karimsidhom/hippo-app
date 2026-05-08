// ---------------------------------------------------------------------------
// Program authorization helpers
//
// CBD programmes have multiple roles with very different blast radii:
//
//   PD / OWNER     — full read+write, finalises CC reviews, manages
//                    roster + invites
//   CHAIR          — read-only program-wide; can finalise CC reviews
//   CC_MEMBER      — read-only program-wide; writes notes + decisions
//                    on CC reviews they're invited to
//   FACULTY        — sees ONLY the residents they have an active
//                    FacultyAssignment to. Standard EPA sign-off.
//   COORDINATOR    — manages invites + scheduling; never sees PHI
//   DEPT_HEAD      — read across programmes they belong to (rolled up)
//
// Legacy values:
//   OWNER  — kept as the PD-equivalent.
//   MEMBER — pre-Stage-2 vanilla member; treated as FACULTY by the
//            access predicates below until the institution upgrades it.
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
const READ_ALL: ProgramMemberRole[] = [
  'OWNER',
  'PD',
  'CHAIR',
  'CC_MEMBER',
  'DEPT_HEAD',
  'COORDINATOR', // sees the roster, just not the PHI
];
const FINALISES_CC: ProgramMemberRole[] = ['OWNER', 'PD', 'CHAIR'];
const PHI_BLIND: ProgramMemberRole[] = ['COORDINATOR'];

export function roleCanManageProgram(role: ProgramMemberRole): boolean {
  return PD_LIKE.includes(role);
}
export function roleCanReadAllResidents(role: ProgramMemberRole): boolean {
  return READ_ALL.includes(role);
}
export function roleCanFinaliseCC(role: ProgramMemberRole): boolean {
  return FINALISES_CC.includes(role);
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

// ─── Resident-roster scoping for FACULTY-role members ──────────────────
// FACULTY (or legacy MEMBER) only sees residents they have an active
// FacultyAssignment to. Returns the userIds of every resident the
// caller is allowed to see in this program.

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
 * given program. PD / CHAIR / CC_MEMBER / DEPT_HEAD / COORDINATOR see
 * everyone; FACULTY (and legacy MEMBER until upgraded) see only their
 * directly-assigned residents.
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

  // FACULTY scope — only residents this faculty has an assignment to.
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
