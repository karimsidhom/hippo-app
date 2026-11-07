export interface ProgramListItem {
  id: string;
  name: string;
  institution: string | null;
  specialty: string | null;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  myRole: ProgramRole;
  memberCount: number;
  eventCount: number;
}

// Granular program roles (Stage-2 entrada-takeover sprint).
// OWNER and MEMBER stay valid for backward compatibility — OWNER acts
// as the PD-equivalent and MEMBER as FACULTY-equivalent until the
// institution upgrades the row.
export type ProgramRole =
  | "OWNER"
  | "PD"
  | "CHAIR"
  | "CC_MEMBER"
  | "FACULTY"
  | "COORDINATOR"
  | "DEPT_HEAD"
  | "MEMBER"
  | "RESIDENT";

export const ROLE_LABELS: Record<ProgramRole, string> = {
  OWNER:       "Owner / PD",
  PD:          "Program Director",
  CHAIR:       "Department Chair",
  CC_MEMBER:   "CC member",
  FACULTY:     "Faculty / supervisor",
  COORDINATOR: "Coordinator (no PHI)",
  DEPT_HEAD:   "Department head",
  MEMBER:      "Member",
  RESIDENT:    "Resident",
};

const PD_LIKE_ROLES: ProgramRole[] = ["OWNER", "PD"];
export const isPdLike = (r: ProgramRole) => PD_LIKE_ROLES.includes(r);
// Resident first: the role menu shows the member's current role, and with
// no Resident option a resident's row read "Program Director", one stray
// tap from a promotion.
export const ROLE_OPTIONS: ProgramRole[] = [
  "RESIDENT",
  "PD",
  "CHAIR",
  "CC_MEMBER",
  "FACULTY",
  "COORDINATOR",
  "DEPT_HEAD",
];

export interface ProgramDetail {
  program: {
    id: string;
    name: string;
    institution: string | null;
    specialty: string | null;
    description: string | null;
    createdById: string;
    createdAt: string;
    updatedAt: string;
  };
  myRole: ProgramRole;
  members: Array<{
    id: string;
    userId: string;
    role: ProgramRole;
    joinedAt: string;
    name: string | null;
    email: string;
    image: string | null;
    roleType: string | null;
    trainingYearLabel: string | null;
  }>;
  invites: Array<{
    id: string;
    email: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    revokedAt: string | null;
  }>;
}

