import { describe, expect, it } from "vitest";
import {
  MAX_HISTORICAL_EPA_BYTES,
  parseHistoricalProgressImport,
  readHistoricalProgressImport,
} from "@/lib/epa/historical-progress";

function fixture() {
  return {
    specialty: "urology",
    snapshot: {
      source: { filename: "committee-progress.json", review_date: "2026-09-29", pending_assessments: 0 },
      interpretation: { unlisted_epa_status: "complete", user_clarification: "Omitted EPAs are finished." },
      records: [{
        code: "C10A", stage: "Core of Discipline", title: "Percutaneous procedure",
        completion_status: "outstanding", overall_done: 5, overall_required: 5,
        criteria: [
          { criterion_id: "c10a:total", criterion: "Total observation threshold", done: 5, required: 5, remaining: 0, completion_status: "complete", unit: "observations" },
          { criterion_id: "c10a:assessors", parent_criterion_id: null as string | null, criterion: "Distinct assessors", done: 1, required: 2, remaining: 1, completion_status: "outstanding", unit: "assessors" },
        ],
      }],
      all_parent_epas: [{ code: "C2", title: "Completed EPA", completion_status: "complete", actual_completed_count: null }],
    },
  };
}

describe("historical EPA summary validation", () => {
  it("keeps completed thresholds, remaining assessor gaps and unknown actual counts separate", () => {
    const { snapshot } = parseHistoricalProgressImport(fixture());
    expect(snapshot.records[0].completion_status).toBe("outstanding");
    expect(snapshot.records[0].criteria.map((criterion) => criterion.completion_status)).toEqual(["complete", "outstanding"]);
    expect(snapshot.all_parent_epas[0]).toMatchObject({ completion_status: "complete", actual_completed_count: null });
    expect(snapshot.interpretation.unlisted_epa_status).toBe("complete");
    expect(snapshot.source.pending_assessments).toBe(0);
  });

  it("preserves provenance and nested criteria without fabricating observations", () => {
    const input = fixture();
    const total = input.snapshot.records[0].criteria[0];
    Object.assign(total, { parent_criterion_id: "c10a:assessors", depth: 1, source_note: "Original source note" });
    const result = parseHistoricalProgressImport(input);
    expect(result.snapshot.records[0].criteria[0]).toMatchObject({ parent_criterion_id: "c10a:assessors", depth: 1, source_note: "Original source note" });
    expect(result.snapshot.source.filename).toBe("committee-progress.json");
    expect(result.snapshot).not.toHaveProperty("observations");
  });

  it("does not fill a blank completed total with a made-up count", () => {
    const input = fixture();
    Object.assign(input.snapshot.records[0].criteria[0], { done: null, remaining: 0 });
    Object.assign(input.snapshot.records[0], { overall_done: null });
    const result = parseHistoricalProgressImport(input);
    expect(result.snapshot.records[0].overall_done).toBeNull();
    expect(result.snapshot.records[0].criteria[0].done).toBeNull();
  });

  it.each([-1, 1.5, 1_000_001])("rejects invalid counts %s", (done) => {
    const input = fixture(); input.snapshot.records[0].criteria[0].done = done;
    expect(() => parseHistoricalProgressImport(input)).toThrow("Invalid progress summary");
  });

  it.each(["2026-02-30", "2026-13-01", "09/29/2026", "not-a-date"])("rejects invalid review date %s", (date) => {
    const input = fixture(); input.snapshot.source.review_date = date;
    expect(() => parseHistoricalProgressImport(input)).toThrow("Invalid progress summary");
  });

  it("rejects invalid identifiers, duplicate EPAs, contradictory remaining counts and broken parent references", () => {
    const invalidId = fixture(); invalidId.snapshot.records[0].code = "../../account";
    expect(() => parseHistoricalProgressImport(invalidId)).toThrow();
    const duplicate = fixture(); duplicate.snapshot.records.push(duplicate.snapshot.records[0]);
    expect(() => parseHistoricalProgressImport(duplicate)).toThrow("unique");
    const conflicting = fixture(); conflicting.snapshot.records[0].criteria[1].remaining = 7;
    expect(() => parseHistoricalProgressImport(conflicting)).toThrow("does not match");
    const orphan = fixture(); orphan.snapshot.records[0].criteria[1].parent_criterion_id = "missing:parent";
    expect(() => parseHistoricalProgressImport(orphan)).toThrow("parent criterion");
  });

  it("rejects empty summaries and identity fields in the import wrapper", () => {
    const empty = fixture(); empty.snapshot.records = []; empty.snapshot.all_parent_epas = [];
    expect(() => parseHistoricalProgressImport(empty)).toThrow("at least one");
    expect(() => parseHistoricalProgressImport({ ...fixture(), userId: "another-user" })).toThrow();
  });

  it("supports an entirely completed summary with no outstanding records", () => {
    const input = fixture(); input.snapshot.records = [];
    expect(parseHistoricalProgressImport(input).snapshot.all_parent_epas).toHaveLength(1);
  });

  it("bounds bytes for multibyte input and for streamed requests with a false Content-Length", async () => {
    const input = fixture(); input.snapshot.interpretation.user_clarification = "é".repeat(MAX_HISTORICAL_EPA_BYTES);
    expect(() => parseHistoricalProgressImport(input)).toThrow("256 KiB");
    const request = new Request("https://example.test/api/epa/progress-snapshot", {
      method: "PUT", headers: { "content-length": "1" }, body: " ".repeat(MAX_HISTORICAL_EPA_BYTES + 1),
    });
    await expect(readHistoricalProgressImport(request)).rejects.toMatchObject({ status: 413 });
  });

  it("rejects malformed JSON before any persistence", async () => {
    const request = new Request("https://example.test/api/epa/progress-snapshot", { method: "PUT", body: "{ broken" });
    await expect(readHistoricalProgressImport(request)).rejects.toMatchObject({ status: 400 });
  });
});
