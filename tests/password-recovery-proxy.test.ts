import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

import { proxy } from "@/proxy";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-anon-key");
  vi.stubEnv("NEXT_PUBLIC_DEFAULT_MODULE", "");
  vi.stubEnv("NEXT_PUBLIC_DESIGN_PREVIEW", "0");
  getUser.mockResolvedValue({ data: { user: null } });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

function request(path: string) {
  return new NextRequest(`https://hippomedicine.com${path}`);
}

describe("public password recovery routes", () => {
  it.each(["/forgot-password", "/reset-password", "/reset-password?code=synthetic-code"])("allows logged-out access to %s before a browser session exists", async (path) => {
    const response = await proxy(request(path));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
    expect(getUser).toHaveBeenCalledOnce();
  });

  it.each(["/forgot-password", "/reset-password"])("keeps %s available to an authenticated recovery session", async (path) => {
    getUser.mockResolvedValue({ data: { user: { id: "synthetic-user" } } });
    const response = await proxy(request(path));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});

describe("existing authentication guards remain intact", () => {
  it.each(["/cases", "/dashboard", "/reset-password/private", "/forgot-password/private"])("protects %s from logged-out access", async (path) => {
    const response = await proxy(request(path));
    expect(response.status).toBe(307);
    const redirect = new URL(response.headers.get("location")!);
    expect(redirect.pathname).toBe("/login");
    expect(redirect.searchParams.get("next")).toBe(path);
  });

  it("still returns 401 for protected APIs instead of exposing account data", async () => {
    const response = await proxy(request("/api/cases"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it.each(["/login", "/signup"])("still redirects an authenticated user away from %s", async (path) => {
    getUser.mockResolvedValue({ data: { user: { id: "synthetic-user" } } });
    const response = await proxy(request(path));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("never enables the design preview escape hatch in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DESIGN_PREVIEW", "1");
    const response = await proxy(request("/cases"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });
});
