import { describe, expect, it } from "vitest";
import {
  canCreateJoinRequest,
  decideJoinAction,
  type JoinRequestLike,
} from "@/lib/program-join/state";

const asked: JoinRequestLike = { status: "PENDING", invitedById: null };
const invited: JoinRequestLike = { status: "PENDING", invitedById: "pd-1" };

describe("decideJoinAction, resident asked to join", () => {
  it("lets the director approve", () => {
    expect(decideJoinAction(asked, "director", "approve")).toEqual({
      ok: true,
      nextStatus: "APPROVED",
    });
  });

  it("lets the director decline", () => {
    expect(decideJoinAction(asked, "director", "decline")).toEqual({
      ok: true,
      nextStatus: "DECLINED",
    });
  });

  it("lets the subject withdraw their own request", () => {
    expect(decideJoinAction(asked, "subject", "withdraw")).toEqual({
      ok: true,
      nextStatus: "WITHDRAWN",
    });
  });

  it("refuses to let the subject accept their own request", () => {
    const d = decideJoinAction(asked, "subject", "accept");
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/not an invitation/i);
  });

  it("refuses to let the subject approve themselves", () => {
    expect(decideJoinAction(asked, "subject", "approve").ok).toBe(false);
  });
});

describe("decideJoinAction, director invited the resident", () => {
  it("lets the subject accept", () => {
    expect(decideJoinAction(invited, "subject", "accept")).toEqual({
      ok: true,
      nextStatus: "APPROVED",
    });
  });

  it("lets the subject decline", () => {
    expect(decideJoinAction(invited, "subject", "decline")).toEqual({
      ok: true,
      nextStatus: "DECLINED",
    });
  });

  it("lets the director withdraw the invitation", () => {
    expect(decideJoinAction(invited, "director", "withdraw")).toEqual({
      ok: true,
      nextStatus: "WITHDRAWN",
    });
  });

  it("refuses to let the director approve their own invitation", () => {
    const d = decideJoinAction(invited, "director", "approve");
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/resident/i);
  });
});

describe("decideJoinAction, already settled", () => {
  for (const status of ["APPROVED", "DECLINED", "WITHDRAWN"] as const) {
    it(`refuses every action on a ${status} request`, () => {
      const req: JoinRequestLike = { status, invitedById: null };
      for (const action of ["approve", "decline", "withdraw", "accept"] as const) {
        expect(decideJoinAction(req, "director", action).ok).toBe(false);
        expect(decideJoinAction(req, "subject", action).ok).toBe(false);
      }
    });
  }
});

describe("canCreateJoinRequest", () => {
  it("allows a first request", () => {
    expect(canCreateJoinRequest(null)).toEqual({ ok: true, nextStatus: "PENDING" });
  });

  it("allows a retry after a decline", () => {
    expect(
      canCreateJoinRequest({ status: "DECLINED", invitedById: null }),
    ).toEqual({ ok: true, nextStatus: "PENDING" });
  });

  it("allows a retry after a withdrawal", () => {
    expect(
      canCreateJoinRequest({ status: "WITHDRAWN", invitedById: null }),
    ).toEqual({ ok: true, nextStatus: "PENDING" });
  });

  it("refuses a duplicate while one is pending", () => {
    const d = canCreateJoinRequest(asked);
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/already/i);
  });

  it("refuses when the user is already approved", () => {
    const d = canCreateJoinRequest({ status: "APPROVED", invitedById: null });
    expect(d.ok).toBe(false);
    expect(d.reason).toMatch(/already/i);
  });
});
