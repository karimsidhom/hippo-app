import { describe, expect, it } from "vitest";
import { PD_SECTIONS, GOALS_SECTION_ID } from "@/lib/pd-meeting/types";
import { MANITOBA_UROLOGY_CONFIG } from "@/lib/pd-meeting/defaults";

describe("PD_SECTIONS", () => {
  it("has the eight sections of the letter, in order", () => {
    expect(PD_SECTIONS.map((s) => s.id)).toEqual([
      "progress",
      "goals",
      "career",
      "resident_concerns",
      "faculty_concerns",
      "tres",
      "cbd",
      "entrada",
    ]);
  });

  it("names the goals section, which is the only one carrying outcomes", () => {
    expect(GOALS_SECTION_ID).toBe("goals");
    expect(PD_SECTIONS.some((s) => s.id === GOALS_SECTION_ID)).toBe(true);
  });

  it("gives every section a human label", () => {
    for (const s of PD_SECTIONS) expect(s.label.length).toBeGreaterThan(3);
  });
});

describe("MANITOBA_UROLOGY_CONFIG", () => {
  it("carries the two checklists from the letter", () => {
    expect(MANITOBA_UROLOGY_CONFIG.checklists.map((c) => c.id)).toEqual([
      "core_curriculum",
      "qi_modules",
    ]);
  });

  it("has every core curriculum row with a target year", () => {
    const core = MANITOBA_UROLOGY_CONFIG.checklists.find((c) => c.id === "core_curriculum")!;
    expect(core.items.length).toBe(10);
    for (const i of core.items) expect(i.targetYear).toBeTruthy();
  });

  it("has no duplicate item ids anywhere, which the paper letter does have", () => {
    const ids = MANITOBA_UROLOGY_CONFIG.checklists.flatMap((c) => c.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries the ten QI and patient-safety modules", () => {
    const qi = MANITOBA_UROLOGY_CONFIG.checklists.find((c) => c.id === "qi_modules")!;
    expect(qi.items.length).toBe(10);
  });

  it("defines the Mini-QUEST table with the letter's columns", () => {
    const t = MANITOBA_UROLOGY_CONFIG.scoreTables.find((t) => t.id === "mini_quest")!;
    expect(t.columns.map((c) => c.id)).toEqual(["overall", "mcq", "osce", "vr", "rank"]);
  });

  it("defines the AUA in-service table", () => {
    expect(MANITOBA_UROLOGY_CONFIG.scoreTables.some((t) => t.id === "aua")).toBe(true);
  });

  it("lists the four certifications", () => {
    expect(MANITOBA_UROLOGY_CONFIG.certifications.map((c) => c.id)).toEqual([
      "acls", "atls", "procedural_sedation", "principles_of_surgery",
    ]);
  });

  it("carries the letter's opening paragraph", () => {
    expect(MANITOBA_UROLOGY_CONFIG.introText).toContain("semi-annual");
  });
});
