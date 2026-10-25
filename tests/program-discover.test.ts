import { describe, expect, it } from "vitest";
import { normaliseDiscoverQuery } from "@/lib/program-join/discover";

describe("normaliseDiscoverQuery", () => {
  it("returns null for a missing query", () => {
    expect(normaliseDiscoverQuery(null)).toBeNull();
  });

  it("returns null for whitespace", () => {
    expect(normaliseDiscoverQuery("   ")).toBeNull();
  });

  it("returns null below two characters, to keep the search bounded", () => {
    expect(normaliseDiscoverQuery("m")).toBeNull();
  });

  it("trims and keeps a usable query", () => {
    expect(normaliseDiscoverQuery("  Manitoba ")).toBe("Manitoba");
  });

  it("caps an absurdly long query rather than passing it to the database", () => {
    expect(normaliseDiscoverQuery("x".repeat(500))).toHaveLength(100);
  });
});
