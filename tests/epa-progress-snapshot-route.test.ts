import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), ensure: vi.fn(), find: vi.fn(), upsert: vi.fn(), revision: vi.fn(), transaction: vi.fn(), createObservation: vi.fn(), createCase: vi.fn() }));
vi.mock("@/lib/api-auth", () => ({ requireAuth: m.auth, ensureDbUser: m.ensure }));
vi.mock("@/lib/db", () => ({ db: {
  epaProgressSnapshot: { findUnique: m.find, upsert: m.upsert },
  $transaction: m.transaction,
  epaObservation: { create: m.createObservation }, caseLog: { create: m.createCase },
} }));
import { GET, PUT } from "@/app/api/epa/progress-snapshot/route";

const user = { id: "owner-user", email: "owner@example.test" };
const payload = () => ({
  specialty: "urology",
  snapshot: {
    source: { filename: "progress.json", review_date: "2026-09-29" },
    records: [],
    all_parent_epas: [{ code: "C2", title: "Completed EPA", completion_status: "complete", actual_completed_count: null }],
  },
});
function request(method = "GET", body?: unknown, query = "specialty=urology") {
  return new Request(`https://example.test/api/epa/progress-snapshot?${query}`, {
    method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user, error: null });
  m.find.mockResolvedValue(null);
  m.transaction.mockImplementation(async callback => callback({ epaProgressSnapshot: { findUnique: m.find, upsert: m.upsert }, epaProgressRevision: { upsert: m.revision } }));
  m.upsert.mockImplementation(async ({ create }) => ({
    id: "snapshot-row", importedAt: new Date("2026-10-21T00:00:00Z"), updatedAt: new Date("2026-10-21T00:00:00Z"), ...create,
  }));
});

describe("private historical EPA snapshot API", () => {
  it.each([["GET", GET], ["PUT", PUT]] as const)("requires authentication for %s before touching storage", async (method, handler) => {
    m.auth.mockResolvedValue({ user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) });
    const response = await handler(request(method, method === "PUT" ? payload() : undefined));
    expect(response.status).toBe(401);
    expect(m.find).not.toHaveBeenCalled(); expect(m.upsert).not.toHaveBeenCalled(); expect(m.ensure).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("always reads the authenticated owner even when another user is named in the URL", async () => {
    const response = await GET(request("GET", undefined, "specialty=urology&userId=other-user"));
    expect(await response.json()).toEqual({ snapshot: null, metadata: null });
    expect(m.find).toHaveBeenCalledWith({ where: { userId_specialtySlug: { userId: user.id, specialtySlug: "urology" } } });
    expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(response.headers.get("vary")).toContain("Authorization");
  });

  it("upserts the owner's single specialty summary and never creates cases or observations", async () => {
    const first = await PUT(request("PUT", payload()));
    const second = await PUT(request("PUT", payload()));
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    const result = await first.json();
    expect(result.snapshot.all_parent_epas[0]).toMatchObject({ completion_status: "complete", actual_completed_count: null });
    expect(result.metadata).toMatchObject({ specialty: "urology", reviewDate: "2026-09-29", provenance: "user_imported_summary", schemaVersion: 1 });
    expect(m.upsert).toHaveBeenCalledTimes(2);
    for (const [args] of m.upsert.mock.calls) {
      expect(args.where).toEqual({ userId_specialtySlug: { userId: user.id, specialtySlug: "urology" } });
      expect(args.create.userId).toBe(user.id); expect(args.update).not.toHaveProperty("userId");
    }
    expect(m.createCase).not.toHaveBeenCalled(); expect(m.createObservation).not.toHaveBeenCalled();
  });

  it("rejects a forged owner before provisioning or writing anything", async () => {
    const response = await PUT(request("PUT", { ...payload(), userId: "other-user" }));
    expect(response.status).toBe(400);
    expect(m.ensure).not.toHaveBeenCalled(); expect(m.upsert).not.toHaveBeenCalled();
  });

  it("does not expose database details or imported private text on failure", async () => {
    m.find.mockRejectedValue(new Error("secret postgres://credentials private-source"));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/secret|postgres|private-source/);
  });

  it("validates the specialty before reading storage", async () => {
    expect((await GET(request("GET", undefined, "specialty=..%2Fother"))).status).toBe(400);
    expect(m.find).not.toHaveBeenCalled();
  });
});
