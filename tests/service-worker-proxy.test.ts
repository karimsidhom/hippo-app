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

describe("service worker", () => {
  it.each(["/sw.js", "/sw.js.map"])("serves %s to logged-out visitors so the PWA can register", async (path) => {
    const response = await proxy(request(path));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("still sends logged-out visitors to sign in for app pages", async () => {
    const response = await proxy(request("/dashboard"));
    expect(response.headers.get("location")).toContain("/login");
  });
});
