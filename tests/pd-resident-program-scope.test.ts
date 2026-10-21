import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const m = vi.hoisted(() => ({
  auth: vi.fn(), membership: vi.fn(), members: vi.fn(), program: vi.fn(), assignments: vi.fn(), profile: vi.fn(),
  caseCount: vi.fn(), lastCase: vi.fn(), cases: vi.fn(), observationCount: vi.fn(), observations: vi.fn(), pearls: vi.fn(), endorsements: vi.fn(), load: vi.fn(),
}));
vi.mock("@/lib/api-auth", () => ({ requireAuth: m.auth }));
vi.mock("@/lib/epa/program-progress", () => ({ loadProgramHistoricalProgress: m.load }));
vi.mock("@/lib/db", () => ({ db: {
  programMember: { findUnique: m.membership, findMany: m.members }, program: { findUnique: m.program }, facultyAssignment: { findMany: m.assignments }, profile: { findUnique: m.profile },
  caseLog: { count: m.caseCount, findFirst: m.lastCase, findMany: m.cases }, epaObservation: { count: m.observationCount, findMany: m.observations }, pearl: { findMany: m.pearls }, pearlEndorsement: { count: m.endorsements },
} }));

import { GET as summary } from "@/app/api/pd/residents/[userId]/summary/route";
import { GET as observations } from "@/app/api/pd/residents/[userId]/epa/route";

const handlers = [["summary", summary], ["observations", observations]] as const;
const context = () => ({ params: Promise.resolve({ userId: "resident" }) });
function request(programId: string | null = "program-a") {
  return new NextRequest(`https://example.test/api/pd/residents/resident/summary${programId === null ? "" : `?programId=${programId}`}`);
}

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: { id: "viewer" }, error: null });
  m.membership.mockImplementation(async ({ where }) => where.programId_userId.programId === "program-a" ? { id: "viewer-membership", role: "PD" } : null);
  m.program.mockResolvedValue({ id: "program-a", name: "Training program", institution: "Same institution", specialty: "Urology" });
  m.members.mockImplementation(async ({ where }) => where.userId && !where.userId.in.includes("resident") ? [] : [{ userId: "resident" }]);
  m.assignments.mockResolvedValue([]);
  m.profile.mockResolvedValue({ userId: "resident", roleType: "RESIDENT", specialty: "Urology", institution: "Same institution", pgyYear: 3, trainingYearLabel: null, trainingCountry: "CA", user: { id: "resident", name: "Resident", email: "resident@example.test", image: null } });
  m.caseCount.mockResolvedValue(0); m.lastCase.mockResolvedValue(null); m.cases.mockResolvedValue([]);
  m.observationCount.mockResolvedValue(0); m.observations.mockResolvedValue([]); m.pearls.mockResolvedValue([]); m.endorsements.mockResolvedValue(0);
  m.load.mockResolvedValue(new Map([["resident:urology", { summary: { categories: { completed: 2, remaining: 3, total: 5, unknown: 0 } }, sourceFilename: "progress.json", reviewDate: "2026-09-29", reconciliationStatus: "self_reported" }]]));
});

describe("resident progress uses explicit program membership scope", () => {
  it.each(handlers)("authenticates before reading %s", async (_name, handler) => {
    m.auth.mockResolvedValue({ user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) });
    const response = await handler(request(), context());
    expect(response.status).toBe(401);
    expect(m.membership).not.toHaveBeenCalled(); expect(m.profile).not.toHaveBeenCalled(); expect(m.observations).not.toHaveBeenCalled();
  });

  it.each(handlers)("rejects %s without a selected program before reading resident data", async (_name, handler) => {
    const response = await handler(request(null), context());
    expect(response.status).toBe(400);
    expect(m.membership).not.toHaveBeenCalled(); expect(m.profile).not.toHaveBeenCalled(); expect(m.load).not.toHaveBeenCalled();
  });

  it.each(handlers)("denies cross-program %s even when institution names match", async (_name, handler) => {
    const response = await handler(request("program-b"), context());
    expect(response.status).toBe(403);
    expect(m.membership).toHaveBeenCalledWith({ where: { programId_userId: { programId: "program-b", userId: "viewer" } } });
    expect(m.profile).not.toHaveBeenCalled(); expect(m.caseCount).not.toHaveBeenCalled(); expect(m.observations).not.toHaveBeenCalled(); expect(m.load).not.toHaveBeenCalled();
  });

  it.each(handlers)("denies coordinators access to identifiable %s", async (_name, handler) => {
    m.membership.mockResolvedValue({ id: "coordinator", role: "COORDINATOR" });
    const response = await handler(request(), context());
    expect(response.status).toBe(403);
    expect(m.members).not.toHaveBeenCalled(); expect(m.profile).not.toHaveBeenCalled(); expect(m.observations).not.toHaveBeenCalled(); expect(m.load).not.toHaveBeenCalled();
  });

  it.each(handlers)("denies unassigned faculty access to %s", async (_name, handler) => {
    m.membership.mockResolvedValue({ id: "faculty", role: "FACULTY" });
    const response = await handler(request(), context());
    expect(response.status).toBe(403);
    expect(m.assignments).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ programId: "program-a", facultyId: "faculty", AND: expect.any(Array) }) }));
    expect(m.profile).not.toHaveBeenCalled(); expect(m.observations).not.toHaveBeenCalled(); expect(m.load).not.toHaveBeenCalled();
  });

  it.each(handlers)("permits faculty with an active assignment for this resident to read %s", async (_name, handler) => {
    m.membership.mockResolvedValue({ id: "faculty", role: "FACULTY" });
    m.assignments.mockResolvedValue([{ resident: { userId: "resident" } }]);
    const response = await handler(request(), context());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(m.observations).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "resident" }) }));
  });

  it("returns normalized-specialty historical totals and signed-only coverage after authorization", async () => {
    const response = await summary(request(), context());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.program.id).toBe("program-a");
    expect(data.historicalProgress.summary.categories).toEqual({ completed: 2, remaining: 3, total: 5, unknown: 0 });
    expect(m.load).toHaveBeenCalledWith("program-a", ["resident"]);
    expect(m.observations).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "resident", status: "SIGNED" } }));
    expect(m.profile).toHaveBeenCalledTimes(1);
    expect(m.profile).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "resident" } }));
  });
});
