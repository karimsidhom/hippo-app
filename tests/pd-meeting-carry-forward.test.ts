import { describe, expect, it } from "vitest";
import {
  buildMeetingView,
  carryBullet,
  validateForPublish,
} from "@/lib/pd-meeting/carry-forward";
import { answersOf, emptySections, type PdSections } from "@/lib/pd-meeting/types";

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

describe('answers, kept apart from goals', () => {
  const prev = (): PdSections => ({
    goals: { bullets: [{ id: 'g1', text: 'One' }, { id: 'g2', text: 'Two' }] },
  });

  it('reads the answers map when a record has one', () => {
    const current: PdSections = {
      goals: { bullets: [], answers: { g1: 'met', g2: 'carried' } },
    };
    expect(answersOf(current, 'goals')).toEqual({ g1: 'met', g2: 'carried' });
  });

  it('derives answers from the old bullet shape when there is no map', () => {
    const current: PdSections = {
      goals: {
        bullets: [
          { id: 'n1', text: 'One', carriedFrom: 'g1', outcome: 'met' },
          { id: 'n2', text: 'Two', carriedFrom: 'g2', outcome: 'not_met' },
        ],
      },
    };
    expect(answersOf(current, 'goals')).toEqual({ g1: 'met', g2: 'not_met' });
  });

  it('publishes once every previous goal is answered, with no bullets at all', () => {
    const current: PdSections = {
      progress: { bullets: [{ id: 'p', text: 'Doing well.' }] },
      goals: { bullets: [], answers: { g1: 'met', g2: 'not_met' } },
    };
    expect(validateForPublish(current, prev())).toEqual([]);
  });

  it('still blocks publish when one goal has no answer', () => {
    const current: PdSections = {
      progress: { bullets: [{ id: 'p', text: 'Doing well.' }] },
      goals: { bullets: [], answers: { g1: 'met' } },
    };
    const problems = validateForPublish(current, prev());
    expect(problems).toHaveLength(1);
    expect(problems[0].sectionId).toBe('goals');
    expect(problems[0].message).toMatch(/one goal/i);
  });

  it('carrying a goal does not carry its answer across', () => {
    const carried = carryBullet({ id: 'g1', text: 'One', outcome: 'met', carriedFrom: 'older' });
    expect(carried.outcome).toBeUndefined();
    expect(carried.carriedFrom).toBe('g1');
    expect(carried.text).toBe('One');
  });

  it('puts answers on the goals row of the view and nowhere else', () => {
    const current: PdSections = {
      goals: { bullets: [], answers: { g1: 'met' } },
      progress: { bullets: [] },
    };
    const view = buildMeetingView(current, prev());
    const goals = view.find((v) => v.id === 'goals');
    const progress = view.find((v) => v.id === 'progress');
    expect(goals?.answers).toEqual({ g1: 'met' });
    expect(progress?.answers).toEqual({});
  });
});
