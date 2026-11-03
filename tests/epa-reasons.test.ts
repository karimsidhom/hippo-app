import { describe, expect, it } from "vitest";
import { readableReason, readableReasons } from "@/lib/epa/reasons";

describe("EPA suggestion reasons in plain words", () => {
  it("rewrites the rule-based scoring lines", () => {
    expect(readableReason('Substring procedure match: "laser lithotripsy"')).toBe("Matches “laser lithotripsy”");
    expect(readableReason('Exact procedure match: "TURBT"')).toBe("Same procedure: TURBT");
    expect(readableReason('Partial word overlap with: "radical nephrectomy" (2 words)')).toBe("Similar to “radical nephrectomy”");
    expect(readableReason("Category alignment (10 pts): procedure/diagnosis category overlaps with EPA scope")).toBe("Same area of practice");
    expect(readableReason("Autonomy-stage alignment: INDEPENDENT matches Core/TTP EPA")).toBe("Fits your autonomy level");
    expect(readableReason("Approach relevance: EPA references endoscopic approach")).toBe("Endoscopic approach");
  });
  it("drops the gap line the progress bar already shows", () => {
    expect(readableReason("Gap priority (+12 pts): 2/10 observations completed")).toBeNull();
  });
  it("passes the model's own wording through and removes duplicates", () => {
    expect(readableReasons(["Flexible ureteroscopy for a renal stone", "Flexible ureteroscopy for a renal stone", ""]))
      .toEqual(["Flexible ureteroscopy for a renal stone"]);
  });
});
