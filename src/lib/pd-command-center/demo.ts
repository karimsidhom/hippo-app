import type { ProgramCommandCenterData } from "./types";

export const demoProgramCommandCenter: ProgramCommandCenterData = {
  synthetic: true,
  programs: [{ id: "demo", name: "Prairie General Surgery" }],
  program: { id: "demo", name: "Prairie General Surgery", institution: "Prairie University", specialty: "General Surgery", pilotDay: 18, pilotLengthDays: 30, memberCount: 19, residentCount: 12, facultyCount: 6 },
  metrics: { cases30: 284, caseDeltaPercent: 17, epaCompletionPercent: 78, pendingSignoffs: 9, activeResidents: 10, adoptionPercent: 83, medianSignoffDays: 2.4 },
  trend: [
    { label: "May 25", cases: 42 }, { label: "Jun 1", cases: 48 }, { label: "Jun 8", cases: 45 }, { label: "Jun 15", cases: 56 },
    { label: "Jun 22", cases: 61 }, { label: "Jun 29", cases: 67 }, { label: "Jul 6", cases: 72 }, { label: "Jul 13", cases: 78 },
  ],
  stages: [
    { id: "TD", label: "Transition to discipline", signed: 22, total: 24, percent: 92 },
    { id: "F", label: "Foundations", signed: 54, total: 65, percent: 83 },
    { id: "C", label: "Core", signed: 71, total: 96, percent: 74 },
    { id: "TTP", label: "Transition to practice", signed: 17, total: 25, percent: 68 },
  ],
  alerts: [
    { id: "a1", level: "critical", residentId: "demo-1", title: "Noah Bennett", detail: "21 days since activity · 2 EPAs awaiting action", href: "#resident-demo-1" },
    { id: "a2", level: "watch", residentId: "demo-2", title: "Mina Rahman", detail: "4 EPAs awaiting action", href: "#resident-demo-2" },
    { id: "a3", level: "watch", title: "2 competence committee reviews open", detail: "Meeting preparation is due this week.", href: "#reports" },
  ],
  residents: [
    { userId: "demo-1", name: "Noah Bennett", trainingYear: "PGY-2", cases30: 8, totalCases: 86, epaSigned: 7, epaTotal: 12, pending: 2, lastActivityAt: "2026-06-21T12:00:00.000Z", signal: "critical" },
    { userId: "demo-2", name: "Mina Rahman", trainingYear: "PGY-3", cases30: 24, totalCases: 214, epaSigned: 16, epaTotal: 22, pending: 4, lastActivityAt: "2026-07-10T12:00:00.000Z", signal: "watch" },
    { userId: "demo-3", name: "Alex Chen", trainingYear: "PGY-1", cases30: 19, totalCases: 71, epaSigned: 10, epaTotal: 12, pending: 1, lastActivityAt: "2026-07-11T12:00:00.000Z", signal: "good" },
    { userId: "demo-4", name: "Sofia Marin", trainingYear: "PGY-4", cases30: 31, totalCases: 382, epaSigned: 22, epaTotal: 25, pending: 0, lastActivityAt: "2026-07-12T12:00:00.000Z", signal: "good" },
    { userId: "demo-5", name: "Ethan Cardinal", trainingYear: "PGY-5", cases30: 28, totalCases: 491, epaSigned: 28, epaTotal: 31, pending: 0, lastActivityAt: "2026-07-12T12:00:00.000Z", signal: "good" },
  ],
  setup: [
    { id: "profile", label: "Program profile", complete: true, href: "#" }, { id: "residents", label: "Resident roster", complete: true, href: "#" },
    { id: "faculty", label: "Faculty roles", complete: true, href: "#" }, { id: "rotations", label: "Rotation schedule", complete: true, href: "#" },
    { id: "forms", label: "Assessment forms", complete: true, href: "#" }, { id: "activity", label: "First training activity", complete: true, href: "#" },
  ],
  weeklyBrief: {
    headline: "Two residents need a program check-in",
    summary: "Prairie General Surgery is on day 18 of its 30-day pilot.",
    bullets: ["10 of 12 residents active in the last 14 days", "284 cases logged in the last 30 days", "9 EPAs awaiting completion"],
  },
  generatedAt: "2026-07-12T18:00:00.000Z",
};
