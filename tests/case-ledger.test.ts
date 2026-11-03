import { describe, expect, it } from "vitest";
import {
  filterLedgerCases,
  getLedgerRoleOptions,
  getLedgerYearOptions,
  summarizeLedgerCases,
} from "@/lib/case-ledger";

const cases = Object.freeze([
  Object.freeze({ id: "older", procedureName: "Open nephrectomy", surgicalApproach: "OPEN", role: "First Surgeon", caseDate: "2025-06-01T12:00:00Z", autonomyLevel: "INDEPENDENT", operativeDurationMinutes: 90, notes: "robotic" }),
  Object.freeze({ id: "newer", procedureName: "Robotic prostatectomy", surgicalApproach: "ROBOTIC", role: "Console Surgeon", caseDate: new Date("2026-06-01T12:00:00Z"), autonomyLevel: "SUPERVISOR_PRESENT", operativeDurationMinutes: 120, notes: "nephrectomy" }),
  Object.freeze({ id: "display-label", procedureName: "Partial nephrectomy", surgicalApproach: "Open", role: "Primary Surgeon", caseDate: "2026-07-01T12:00:00Z", autonomyLevel: "TEACHING", operativeDurationMinutes: null, notes: "" }),
]);

describe("case ledger filters", () => {
  it("matches display approach choices to both stored enums and legacy labels", () => {
    expect(filterLedgerCases(cases, { approach: "Open" }).map((entry) => entry.id)).toEqual(["display-label", "older"]);
    expect(filterLedgerCases(cases, { approach: " open " }).map((entry) => entry.id)).toEqual(["display-label", "older"]);
    expect(filterLedgerCases(cases, { approach: "ROBOTIC" }).map((entry) => entry.id)).toEqual(["newer"]);
  });

  it.each(["OPEN", "LAPAROSCOPIC", "ROBOTIC", "ENDOSCOPIC", "HYBRID", "PERCUTANEOUS", "OTHER"])("supports the %s approach", (approach) => {
    const entry = { ...cases[0], surgicalApproach: approach };
    expect(filterLedgerCases([entry], { approach: approach.toLowerCase() })).toEqual([entry]);
  });

  it("trims procedure search, ignores case and keeps the existing procedure-only scope", () => {
    expect(filterLedgerCases(cases, { search: " NEPHRECTOMY " }).map((entry) => entry.id)).toEqual(["display-label", "older"]);
    expect(filterLedgerCases(cases, { search: "robotic" }).map((entry) => entry.id)).toEqual(["newer"]);
    expect(filterLedgerCases(cases, { search: "   " })).toHaveLength(3);
  });

  it("combines year, procedure, approach and exact persisted role filters", () => {
    const filters = { search: "nephrectomy", approach: "Open", role: "Primary Surgeon", year: "2026" };
    expect(filterLedgerCases(cases, filters).map((entry) => entry.id)).toEqual(["display-label"]);
    expect(filterLedgerCases(cases, { role: "First Surgeon" }).map((entry) => entry.id)).toEqual(["older"]);
    expect(filterLedgerCases(cases, { role: "first surgeon" })).toEqual([]);
    expect(filterLedgerCases(cases, { year: "2024" })).toEqual([]);
  });

  it("orders newest first without changing the source array, case objects or dates", () => {
    const date = cases[1].caseDate;
    const result = filterLedgerCases(cases);
    expect(result.map((entry) => entry.id)).toEqual(["display-label", "newer", "older"]);
    expect(cases.map((entry) => entry.id)).toEqual(["older", "newer", "display-label"]);
    expect(result[1]).toBe(cases[1]);
    expect(cases[1].caseDate).toBe(date);
    expect(result).not.toBe(cases);
  });

  it("keeps malformed imported dates after valid dates and out of year choices", () => {
    const invalid = { ...cases[0], caseDate: "invalid" };
    expect(filterLedgerCases([invalid, cases[1]])).toEqual([cases[1], invalid]);
    expect(getLedgerYearOptions([invalid, ...cases])).toEqual(["All", "2026", "2025"]);
  });
});

describe("case ledger options and summaries", () => {
  it("makes legacy and custom roles accessible without merging or rewriting labels", () => {
    const options = getLedgerRoleOptions([
      ...cases,
      { role: "Visiting Surgeon" },
      { role: "Visiting Surgeon" },
      { role: "visiting surgeon" },
      { role: "Imported role " },
      { role: "" },
      { role: "   " },
    ]);
    expect(options[0]).toBe("All");
    expect(options).toEqual(expect.arrayContaining(["First Surgeon", "First Assist", "Second Assist", "First Assistant", "Primary Surgeon", "Teaching Assistant", "Visiting Surgeon", "visiting surgeon", "Imported role "]));
    expect(options.filter((role) => role === "Visiting Surgeon")).toHaveLength(1);
    expect(options).not.toContain("");
    expect(options).not.toContain("   ");
  });

  it("counts teaching as independent and calculates OR hours from recorded minutes", () => {
    expect(summarizeLedgerCases(cases)).toEqual({ count: 3, minutes: 210, hours: 3.5, independentCount: 2, independentRate: 67 });
    expect(summarizeLedgerCases([cases[0]]).hours).toBe(1.5);
    expect(summarizeLedgerCases(filterLedgerCases(cases, { year: "2026" }))).toEqual({ count: 2, minutes: 120, hours: 2, independentCount: 1, independentRate: 50 });
  });

  it("bases independence on autonomy rather than a primary-surgeon role", () => {
    expect(summarizeLedgerCases([{ ...cases[0], role: "Primary Surgeon", autonomyLevel: "SUPERVISOR_PRESENT" }]).independentRate).toBe(0);
    expect(summarizeLedgerCases([{ ...cases[0], role: "Assistant", autonomyLevel: "INDEPENDENT" }]).independentRate).toBe(100);
  });

  it("handles empty lists, missing durations and invalid imported times without NaN totals", () => {
    expect(summarizeLedgerCases([])).toEqual({ count: 0, minutes: 0, hours: 0, independentCount: 0, independentRate: 0 });
    const entries = [undefined, null, 0, -30, NaN, Infinity, 45].map((duration) => ({ autonomyLevel: "OBSERVER", operativeDurationMinutes: duration }));
    expect(summarizeLedgerCases(entries)).toEqual({ count: 7, minutes: 45, hours: 0.75, independentCount: 0, independentRate: 0 });
    expect(getLedgerYearOptions([])).toEqual(["All"]);
    expect(getLedgerRoleOptions([])).toContain("First Surgeon");
  });
});
