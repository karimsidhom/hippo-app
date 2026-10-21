import { describe, expect, it } from "vitest";
import { historicalEpaSnapshotSchema } from "@/lib/epa/historical-progress";
import type { HistoricalEpaCriterion, HistoricalEpaRecord, HistoricalEpaSnapshot } from "@/lib/epa/historical-progress";
import { summarizeHistoricalProgress, UROLOGY_CREDIT_COMPONENTS } from "@/lib/epa/progress-summary";

function fixture(): HistoricalEpaSnapshot {
  const parents = [...new Set(UROLOGY_CREDIT_COMPONENTS.map(component => component.parentCode))];
  return historicalEpaSnapshotSchema.parse({
    source: { filename: "example-progress.json", review_date: "2026-09-29" },
    interpretation: { unlisted_epa_status: "complete", unlisted_criterion_status: "complete" },
    records: [],
    all_parent_epas: parents.map(code => ({ code, title: `Category ${code}`, completion_status: "complete", actual_completed_count: null })),
  });
}
function criterion(name: string, done: number | null, required: number, unit = "observations"): HistoricalEpaCriterion {
  return { criterion: name, done, required, remaining: done === null ? null : Math.max(required - done, 0), unit, completion_status: done !== null && done >= required ? "complete" : "outstanding" };
}
function record(code: string, done: number | null, required: number, extra: HistoricalEpaCriterion[] = []): HistoricalEpaRecord {
  return {
    code, title: `Component ${code}`, stage: "Core of Discipline", overall_done: done, overall_required: required,
    completion_status: "outstanding",
    criteria: [{ ...criterion("Total observation threshold", done, required), is_total: true }, ...extra],
  };
}
function put(snapshot: HistoricalEpaSnapshot, component: HistoricalEpaRecord) {
  snapshot.records.push(component);
  const parent = component.code.replace(/^((?:TD|F|C|TTP)\d+)[AB]$/, "$1");
  const category = snapshot.all_parent_epas.find(item => item.code === parent);
  if (category) category.completion_status = component.completion_status;
}

describe("historical minimum-credit aggregation", () => {
  it("has 54 independent components and 266 minimum credits without inventing assessment history", () => {
    expect(UROLOGY_CREDIT_COMPONENTS).toHaveLength(54);
    expect(new Set(UROLOGY_CREDIT_COMPONENTS.map(component => component.code)).size).toBe(54);
    const summary = summarizeHistoricalProgress(fixture(), "Urology");
    expect(summary.categories).toEqual({ completed: 39, remaining: 0, total: 39, unknown: 0 });
    expect(summary.individual).toEqual({ creditedMinimum: 266, requiredMinimum: 266, remainingMaximum: 0, additionalBeyondMinimum: 0, minimumFurtherRequired: 0, actualCompleted: null, countsAreMinimums: true });
  });

  it("counts a shared logbook as nine B credits once each while preserving explicit parent statuses", () => {
    const snapshot = fixture();
    put(snapshot, record("C5B-C13B", null, 1));
    const summary = summarizeHistoricalProgress(snapshot);
    expect(summary.individual).toMatchObject({ creditedMinimum: 257, requiredMinimum: 266, remainingMaximum: 9, minimumFurtherRequired: 9 });
    expect(summary.categories.completed).toBe(39);
    expect(summary.limitations.join(" ")).toContain("not nine separate logbook uploads");
  });

  it("uses an explicit B-component record instead of counting its shared evidence twice", () => {
    const snapshot = fixture();
    put(snapshot, record("C5B-C13B", null, 1));
    const completed = record("C7B", 1, 1); completed.completion_status = "complete";
    put(snapshot, completed);
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ creditedMinimum: 258, remainingMaximum: 8, minimumFurtherRequired: 8 });
  });

  it("does not turn logbook breadth cases or nested procedures into EPA credits", () => {
    const snapshot = fixture();
    put(snapshot, record("C14B", 0, 1, [
      criterion("Scrotal cases", 1, 10, "surgeries"),
      { ...criterion("Nested procedures", 0, 100, "surgeries"), depth: 1 },
      criterion("Other cases", 0, 50, "observations"),
    ]));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ creditedMinimum: 265, remainingMaximum: 1, additionalBeyondMinimum: 0, minimumFurtherRequired: 1 });
  });

  it.each(["C19B", "TTP3B"])("counts %s as one collated report rather than its individual raters", code => {
    const snapshot = fixture();
    put(snapshot, record(code, 0, 1, [criterion("Observer feedback", 0, 6, "assessors"), criterion("Nurses", 0, 2)]));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ remainingMaximum: 1, minimumFurtherRequired: 1, additionalBeyondMinimum: 0 });
  });

  it("counts teaching encounters separately from their multiple audience evaluations", () => {
    const snapshot = fixture();
    put(snapshot, record("C20", 1, 2, [criterion("Audience evaluations", 0, 4)]));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ remainingMaximum: 1, minimumFurtherRequired: 1 });
  });

  it("keeps a completed blank threshold credited while adding only the largest applicable remaining gap", () => {
    const snapshot = fixture();
    const component = record("F4A", null, 20, [criterion("Required presentation", 1, 3), criterion("Another overlapping dimension", 0, 1)]);
    component.criteria[0].completion_status = "complete";
    component.criteria[0].remaining = 0;
    put(snapshot, component);
    const summary = summarizeHistoricalProgress(snapshot);
    expect(summary.individual).toMatchObject({ creditedMinimum: 266, remainingMaximum: 0, additionalBeyondMinimum: 2, minimumFurtherRequired: 2, actualCompleted: null });
    expect(summary.categories.remaining).toBe(1);
  });

  it("requires a new assessor observation after the observation target is met", () => {
    const snapshot = fixture();
    put(snapshot, record("C10A", 5, 5, [criterion("Different assessors", 1, 2, "assessors")]));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ creditedMinimum: 266, remainingMaximum: 0, additionalBeyondMinimum: 1, minimumFurtherRequired: 1 });
  });

  it("does not add overlapping component achievements or nested case-mix counts", () => {
    const snapshot = fixture();
    put(snapshot, record("C12A", 0, 10, [
      criterion("Renal mobilization", 0, 5, "achievements"), criterion("Hemostasis", 0, 5, "achievements"), criterion("Quality", 0, 5, "achievements"),
      { ...criterion("Nested source detail", 0, 100), depth: 1 },
    ]));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ creditedMinimum: 256, remainingMaximum: 10, additionalBeyondMinimum: 0, minimumFurtherRequired: 10 });
  });

  it("caps extra completed observations at the required minimum", () => {
    const snapshot = fixture();
    const component = record("C10A", 12, 5); component.completion_status = "complete";
    put(snapshot, component);
    expect(summarizeHistoricalProgress(snapshot).individual.creditedMinimum).toBe(266);
    expect(summarizeHistoricalProgress(snapshot).individual.actualCompleted).toBeNull();
  });

  it("keeps an unrecorded total bounded but does not invent a further count", () => {
    const snapshot = fixture();
    put(snapshot, record("TTP3A", null, 3));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ creditedMinimum: 263, remainingMaximum: 3, minimumFurtherRequired: null, additionalBeyondMinimum: null });
  });

  it("can determine further observations from explicit assessor gaps despite a blank total", () => {
    const snapshot = fixture();
    put(snapshot, record("TTP3A", null, 3, [criterion("Different assessors", 0, 3, "assessors")]));
    expect(summarizeHistoricalProgress(snapshot).individual).toMatchObject({ creditedMinimum: 263, remainingMaximum: 3, minimumFurtherRequired: 3 });
  });

  it("refuses inconsistent targets and conflicting counts instead of choosing an arbitrary total", () => {
    const mismatch = fixture(); put(mismatch, record("C12A", 0, 15));
    expect(summarizeHistoricalProgress(mismatch).individual.creditedMinimum).toBeNull();
    const conflict = fixture();
    const component = record("C10A", 4, 5); component.criteria[0].done = 3;
    put(conflict, component);
    expect(summarizeHistoricalProgress(conflict).individual.requiredMinimum).toBeNull();
  });

  it("does not treat omitted components as finished without the user's completion rule", () => {
    const snapshot = fixture(); snapshot.all_parent_epas = []; snapshot.interpretation = {};
    put(snapshot, record("C10A", 2, 5));
    const summary = summarizeHistoricalProgress(snapshot);
    expect(summary.categories).toMatchObject({ remaining: 1, unknown: 38, total: 39 });
    expect(summary.individual.requiredMinimum).toBeNull();
  });

  it("does not total unknown catalog components or unverified specialties", () => {
    const unknown = fixture(); put(unknown, record("OTHER1", 1, 5));
    expect(summarizeHistoricalProgress(unknown).individual.creditedMinimum).toBeNull();
    const generic = summarizeHistoricalProgress(fixture(), "orthopedic");
    expect(generic.individual.requiredMinimum).toBeNull(); expect(generic.frameworkVersion).toBeNull();
  });

  it("never adds native observations to a potentially overlapping historical snapshot", () => {
    const snapshot = fixture(); snapshot.nativeObservationCount = 500;
    expect(summarizeHistoricalProgress(snapshot).individual.creditedMinimum).toBe(266);
  });
});
