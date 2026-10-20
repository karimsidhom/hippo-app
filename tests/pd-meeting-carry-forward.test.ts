import { describe, expect, it } from "vitest";
import {
  buildMeetingView,
  carryBullet,
  validateForPublish,
} from "@/lib/pd-meeting/carry-forward";
import { emptySections, type PdSections } from "@/lib/pd-meeting/types";

function withBullets(sectionId: string, texts: string[]): PdSections {
  const s = emptySections();
  s[sectionId] = { bullets: texts.map((t, i) => ({ id: `${sectionId}-${i}`, text: t })) };
  return s;
}

describe("buildMeetingView", () => {
  it("returns all eight sections even when both columns are empty", () => {
    expect(buildMeetingView(emptySections(), null)).toHaveLength(8);
  });

  it("puts the previous meeting on the left and this one on the right", () => {
    const prev = withBullets("progress", ["Hard worker"]);
    const cur = withBullets("progress", ["Progressing"]);
    const view = buildMeetingView(cur, prev);
    const progress = view.find((s) => s.id === "progress")!;
    expect(progress.previous.map((b) => b.text)).toEqual(["Hard worker"]);
    expect(progress.current.map((b) => b.text)).toEqual(["Progressing"]);
  });

  it("leaves the left column empty for a first meeting", () => {
    const view = buildMeetingView(withBullets("progress", ["Progressing"]), null);
    expect(view.every((s) => s.previous.length === 0)).toBe(true);
  });

  it("applies label overrides without changing ids", () => {
    const view = buildMeetingView(emptySections(), null, { tres: "T-RES / logbook" });
    expect(view.find((s) => s.id === "tres")!.label).toBe("T-RES / logbook");
  });

  it("tolerates a previous meeting missing a section entirely", () => {
    const prev: PdSections = { progress: { bullets: [{ id: "p1", text: "x" }] } };
    expect(() => buildMeetingView(emptySections(), prev)).not.toThrow();
    expect(buildMeetingView(emptySections(), prev)).toHaveLength(8);
  });
});

describe("carryBullet", () => {
  it("copies the text and records where it came from", () => {
    const out = carryBullet({ id: "old-1", text: "Attend CUA and AUA" });
    expect(out.text).toBe("Attend CUA and AUA");
    expect(out.carriedFrom).toBe("old-1");
    expect(out.id).not.toBe("old-1");
  });

  it("does not carry the old outcome across", () => {
    const out = carryBullet({ id: "old-1", text: "x", outcome: "met" });
    expect(out.outcome).toBeUndefined();
  });
});

describe("validateForPublish", () => {
  it("passes a first meeting with content and no previous goals", () => {
    expect(validateForPublish(withBullets("progress", ["Progressing"]), null)).toEqual([]);
  });

  it("refuses a meeting with nothing in it", () => {
    const problems = validateForPublish(emptySections(), null);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].message).toMatch(/nothing/i);
  });

  it("refuses when a previous goal has no outcome", () => {
    const prev = withBullets("goals", ["Enhance and structure study time"]);
    const cur = withBullets("progress", ["Progressing"]);
    const problems = validateForPublish(cur, prev);
    expect(problems).toHaveLength(1);
    expect(problems[0].sectionId).toBe("goals");
    expect(problems[0].message).toMatch(/outcome/i);
  });

  it("passes once every previous goal has an outcome", () => {
    const prev = withBullets("goals", ["Study time", "Reading"]);
    const cur = emptySections();
    cur.goals = {
      bullets: [
        { id: "n1", text: "Study time", outcome: "met", carriedFrom: "goals-0" },
        { id: "n2", text: "Reading", outcome: "carried", carriedFrom: "goals-1" },
      ],
    };
    expect(validateForPublish(cur, prev)).toEqual([]);
  });

  it("counts an outcome recorded on any bullet citing that goal", () => {
    const prev = withBullets("goals", ["Study time"]);
    const cur = emptySections();
    cur.goals = {
      bullets: [
        { id: "n1", text: "Different wording", outcome: "not_met", carriedFrom: "goals-0" },
      ],
    };
    expect(validateForPublish(cur, prev)).toEqual([]);
  });

  it("ignores outcomes outside the goals section", () => {
    const prev = withBullets("progress", ["Hard worker"]);
    expect(validateForPublish(withBullets("progress", ["Progressing"]), prev)).toEqual([]);
  });
});
