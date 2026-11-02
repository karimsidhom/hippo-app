import { describe, expect, it } from "vitest";
import { collectCaseNotes, filterCaseNotes, type NoteCase } from "@/lib/case-notes";

const row = (patch: Partial<NoteCase> = {}): NoteCase => ({ id: "case-one", userId: "me", procedureName: "Teaching procedure", specialtyName: "Urology", notes: "Keep the orientation clear.", reflection: null, tags: ["technique"], caseDate: "2026-10-01T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z", ...patch });
describe("private case notebook", () => {
  it("never renders another owner's stale rows or unsaved optimistic records", () => {
    const rows = [row(), row({ id: "other", userId: "someone-else", notes: "Private other content" }), row({ id: "tmp_unsaved" })];
    expect(collectCaseNotes(rows, "me").map(note => note.id)).toEqual(["case-one"]);
    expect(collectCaseNotes(rows, undefined)).toEqual([]);
  });
  it("collects original notes, legacy reflections and structured learning goals without exposing raw transcripts", () => {
    const rows = [row({ reflection: JSON.stringify({ v: 2, wentWell: "Exposure", doBetter: "Position", workOn: "Practice", raw: "DO_NOT_INDEX_RAW_TRANSCRIPT" }) }), row({ id: "legacy", notes: null, reflection: "Original reflection" }), row({ id: "empty", notes: " ", reflection: "" })];
    const notes = collectCaseNotes(rows, "me");
    expect(notes).toHaveLength(2); expect(notes[0].sections.map(section => section.title)).toEqual(["Case notes", "What went well", "What to do differently", "Next learning goal"]);
    expect(notes[1].sections[0].text).toBe("Original reflection");
    expect(JSON.stringify(notes)).not.toContain("DO_NOT_INDEX_RAW_TRANSCRIPT");
  });
  it("searches originals without mutating them and combines specialty/year filters", () => {
    const source = Object.freeze([row(), row({ id: "earlier", specialtyName: "General Surgery", caseDate: "2025-01-01T00:00:00Z", notes: "Position" })]);
    const notes = collectCaseNotes(source, "me");
    expect(filterCaseNotes(notes, { search: " ORIENTATION ", year: "2026", specialty: "Urology" }).map(note => note.id)).toEqual(["case-one"]);
    expect(filterCaseNotes(notes, { search: "technique" })).toHaveLength(2);
    expect(filterCaseNotes(notes, { search: "nothing" })).toEqual([]);
    expect(source[0].notes).toBe("Keep the orientation clear.");
  });
  it("keeps raw transcripts out when a structured reflection is partial or malformed", () => {
    const notes = collectCaseNotes([row({ reflection: JSON.stringify({ v: 2, wentWell: "Original lesson", doBetter: 42, raw: "PRIVATE_RAW_TRANSCRIPT" }) }), row({ id: "truncated", reflection: '{"v":2,"raw":"PRIVATE_RAW_TRANSCRIPT' })], "me");
    expect(notes[0].sections).toContainEqual({ title: "What went well", text: "Original lesson" });
    expect(JSON.stringify(notes)).not.toContain("PRIVATE_RAW_TRANSCRIPT");
    expect(filterCaseNotes(notes, { search: "PRIVATE_RAW_TRANSCRIPT" })).toEqual([]);
  });
  it("preserves the recorded UTC calendar day and places unknown dates last", () => {
    const notes = collectCaseNotes([row({ id: "unknown", caseDate: "invalid" }), row({ id: "earlier", caseDate: "2025-01-01T00:00:00Z" }), row()], "me");
    expect(filterCaseNotes(notes).map(note => note.id)).toEqual(["case-one", "earlier", "unknown"]);
    expect(notes[2].year).toBe("2026");
  });
});
