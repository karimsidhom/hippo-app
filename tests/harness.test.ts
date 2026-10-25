import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs and resolves the @ alias to src", async () => {
    const mod = await import("@/lib/program-auth");
    expect(typeof mod.roleCanManageProgram).toBe("function");
  });
});
