import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildHistoricalProgressView, HistoricalEpaProgress, normalizeHistoricalSpecialty, parseHistoricalProgressForSpecialty } from "@/components/epa/HistoricalEpaProgress";
import { historicalEpaSnapshotSchema } from "@/lib/epa/historical-progress";

function fixture() {
  return historicalEpaSnapshotSchema.parse({
    source: { filename: "progress.json", review_date: "2026-09-29" },
    interpretation: { unlisted_epa_status: "complete", unlisted_criterion_status: "complete" },
    all_parent_epas: [
      { code: "F4", title: "Urology patient assessment", completion_status: "outstanding", actual_completed_count: null },
      { code: "C5", title: "Bladder surgery", completion_status: "outstanding", actual_completed_count: null },
      { code: "C6", title: "Prostate surgery", completion_status: "complete", actual_completed_count: null },
    ],
    records: [
      { code: "F4A", stage: "Foundations of Discipline", title: "Patient assessment", completion_status: "outstanding", overall_done: null, overall_required: 20, criteria: [
        { criterion: "Overall requirement", done: null, required: 20, remaining: 0, completion_status: "complete", unit: "observations" },
        { criterion: "Remaining presentation", done: 1, required: 3, remaining: 2, completion_status: "outstanding", unit: "observations" },
      ] },
      { code: "C5A", stage: "Core of Discipline", title: "Surgical skills", completion_status: "outstanding", overall_done: 2, overall_required: 3, criteria: [
        { criterion: "Overall requirement", done: 2, required: 3, remaining: 1, completion_status: "outstanding", unit: "observations" },
      ] },
      { code: "C5B-C13B", stage: "Core of Discipline", title: "Shared surgical logbook", completion_status: "outstanding", overall_done: 0, overall_required: 1, criteria: [
        { criterion: "Submit logbook", done: 0, required: 1, remaining: 1, completion_status: "outstanding", unit: "submissions" },
      ] },
    ],
  });
}

describe("historical EPA progress display", () => {
  it.each([["Urology", "urology"], ["urology", "urology"], ["General Surgery", "general-surgery"], ["Orthopedic Surgery", "orthopedic"], ["general-surgery", "general-surgery"]])("normalizes profile specialty %s for private snapshot requests", (value, expected) => {
    expect(normalizeHistoricalSpecialty(value)).toBe(expected);
  });

  it("accepts raw snapshots and matching specialty wrappers, and rejects mismatched specialty imports", () => {
    const snapshot = fixture();
    expect(parseHistoricalProgressForSpecialty(snapshot, "Urology").specialty).toBe("urology");
    expect(parseHistoricalProgressForSpecialty({ specialty: "Urology", snapshot }, "urology").specialty).toBe("urology");
    expect(() => parseHistoricalProgressForSpecialty({ specialty: "general-surgery", snapshot }, "Urology")).toThrow("different specialty");
  });

  it("preserves completed omitted parents without inventing assessment counts", () => {
    const view = buildHistoricalProgressView(fixture());
    expect(view.completed).toBe(1);
    expect(view.outstanding).toBe(2);
    expect(view.rows.find(row => row.code === "C6")).toMatchObject({ completion_status: "complete", actual_completed_count: null, records: [] });
  });

  it("keeps the shared logbook separate from parent counts and groups A components", () => {
    const view = buildHistoricalProgressView(fixture());
    expect(view.rows).toHaveLength(3);
    expect(view.sharedRecords.map(record => record.code)).toEqual(["C5B-C13B"]);
    expect(view.rows.find(row => row.code === "C5")?.records.map(record => record.code)).toEqual(["C5A"]);
  });

  it("retains record-only parents when the imported parent inventory is partial", () => {
    const snapshot = fixture();
    snapshot.all_parent_epas = snapshot.all_parent_epas.filter(parent => parent.code !== "F4");
    const view = buildHistoricalProgressView(snapshot);
    expect(view.rows.find(row => row.code === "F4")?.records[0].code).toBe("F4A");
    expect(view.outstanding).toBe(2);
  });

  it("retains Urology Foundations and unknown actual totals alongside remaining criteria", () => {
    const view = buildHistoricalProgressView(fixture());
    const foundations = view.rows.find(row => row.code === "F4");
    expect(foundations?.stage).toBe("Urology Foundations");
    expect(foundations?.records[0].criteria[0]).toMatchObject({ done: null, required: 20, remaining: 0, completion_status: "complete" });
    expect(foundations?.records[0].criteria[1].remaining).toBe(2);
  });

  it("renders unknown completed totals separately from numeric remaining criteria", () => {
    const html = renderToStaticMarkup(createElement(HistoricalEpaProgress, { initialSnapshot: fixture() }));
    expect(html).toContain("Required: 20 observations · actual count not recorded");
    expect(html).toContain("2 observations remaining");
    expect(html).toContain("Shared requirements");
    expect(html).toContain("EPAs and criteria omitted from your source are marked complete");
  });

  it("renders nested category requirements without labelling overall totals as categories", () => {
    const snapshot = fixture();
    snapshot.records[0].criteria[0].is_total = true;
    snapshot.records[0].criteria[0].criterion_kind = "overall";
    snapshot.records[0].criteria[1].criterion_kind = "category";
    snapshot.records[0].criteria[1].depth = 1;
    const html = renderToStaticMarkup(createElement(HistoricalEpaProgress, { initialSnapshot: snapshot }));
    expect(html.match(/Category total/g)).toHaveLength(1);
    expect(html).toContain("padding-left:14px");
  });
});
