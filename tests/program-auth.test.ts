import { describe, expect, it } from "vitest";
import {
  roleCanFinaliseCC,
  roleCanManageProgram,
  roleCanReadAllResidents,
  roleCanReadPdMeetings,
  roleSeesPhi,
} from "@/lib/program-auth";
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

describe("roleCanReadPdMeetings", () => {
  it("admits only the director roles", () => {
    expect(ALL.filter(roleCanReadPdMeetings)).toEqual(["OWNER", "PD"]);
  });

  it("excludes every role that can read the roster but is not the director", () => {
    // Roster access must not imply access to someone's 1:1 record.
    for (const role of ["CHAIR", "CC_MEMBER", "DEPT_HEAD", "COORDINATOR"] as const) {
      expect(roleCanReadAllResidents(role)).toBe(true);
      expect(roleCanReadPdMeetings(role)).toBe(false);
    }
  });

  it("is never wider than roleCanReadAllResidents", () => {
    for (const role of ALL) {
      if (roleCanReadPdMeetings(role)) {
        expect(roleCanReadAllResidents(role)).toBe(true);
      }
    }
  });
});

describe("the RESIDENT role is inert", () => {
  it("grants no program-wide capability", () => {
    expect(roleCanManageProgram("RESIDENT")).toBe(false);
    expect(roleCanReadAllResidents("RESIDENT")).toBe(false);
    expect(roleCanFinaliseCC("RESIDENT")).toBe(false);
    expect(roleCanReadPdMeetings("RESIDENT")).toBe(false);
  });

  it("still sees case content, because a resident sees their own", () => {
    expect(roleSeesPhi("RESIDENT")).toBe(true);
  });
});
