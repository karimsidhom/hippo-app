import { describe, expect, it } from "vitest";
import {
  PROGRAM_STAFF_ROLES,
  roleCanFinaliseCC,
  roleCanManageProgram,
  roleCanReadAllResidents,
  roleCanReadPdMeetings,
  roleIsProgramStaff,
  roleSeesPhi,
} from "@/lib/program-auth";
import { isProgramStaff } from "@/components/programs/types";
import type { ProgramMemberRole } from "@prisma/client";

const ALL: ProgramMemberRole[] = [
  "OWNER",
  "MEMBER",
  "PD",
  "CHAIR",
  "CC_MEMBER",
  "FACULTY",
  "COORDINATOR",
  "DEPT_HEAD",
  "RESIDENT",
];

const STAFF = ["OWNER", "PD", "CHAIR", "CC_MEMBER", "FACULTY", "DEPT_HEAD"];

describe("program staff (staff and directors have full access)", () => {
  it("is every role a director assigns to a staff physician", () => {
    expect(ALL.filter(roleIsProgramStaff)).toEqual(STAFF);
    expect([...PROGRAM_STAFF_ROLES].sort()).toEqual([...STAFF].sort());
  });

  it("reads every resident in the program, faculty included", () => {
    for (const role of STAFF as ProgramMemberRole[]) {
      expect(roleCanReadAllResidents(role)).toBe(true);
    }
  });

  it("reads the 1:1 meeting records, not only the director", () => {
    expect(ALL.filter(roleCanReadPdMeetings)).toEqual(STAFF);
  });

  it("matches the client-side check the screens use", () => {
    for (const role of ALL) {
      expect(isProgramStaff(role)).toBe(roleIsProgramStaff(role));
    }
  });

  it("leaves the roster and CC finalisation with the director's seat", () => {
    expect(ALL.filter(roleCanManageProgram)).toEqual(["OWNER", "PD"]);
    expect(ALL.filter(roleCanFinaliseCC)).toEqual(["OWNER", "PD", "CHAIR"]);
  });
});

describe("roles that are not staff", () => {
  it("keeps an unassigned MEMBER to the residents assigned to them", () => {
    // An accepted invite lands as MEMBER, residents included, until a
    // director sets a role, so MEMBER must never read the whole cohort.
    expect(roleIsProgramStaff("MEMBER")).toBe(false);
    expect(roleCanReadAllResidents("MEMBER")).toBe(false);
    expect(roleCanReadPdMeetings("MEMBER")).toBe(false);
  });

  it("gives the coordinator the roster but no case content or 1:1 records", () => {
    expect(roleCanReadAllResidents("COORDINATOR")).toBe(true);
    expect(roleSeesPhi("COORDINATOR")).toBe(false);
    expect(roleCanReadPdMeetings("COORDINATOR")).toBe(false);
  });

  it("never lets 1:1 access run wider than roster access", () => {
    for (const role of ALL) {
      if (roleCanReadPdMeetings(role)) {
        expect(roleCanReadAllResidents(role)).toBe(true);
      }
    }
  });
});

describe("the RESIDENT role is inert", () => {
  it("grants no program-wide capability", () => {
    expect(roleIsProgramStaff("RESIDENT")).toBe(false);
    expect(roleCanManageProgram("RESIDENT")).toBe(false);
    expect(roleCanReadAllResidents("RESIDENT")).toBe(false);
    expect(roleCanFinaliseCC("RESIDENT")).toBe(false);
    expect(roleCanReadPdMeetings("RESIDENT")).toBe(false);
  });

  it("still sees case content, because a resident sees their own", () => {
    expect(roleSeesPhi("RESIDENT")).toBe(true);
  });
});
