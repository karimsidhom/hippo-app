export type SignalLevel = "critical" | "watch" | "good";

export interface ProgramCommandCenterData {
  programs: Array<{ id: string; name: string }>;
  program: {
    id: string;
    name: string;
    institution: string;
    specialty: string;
    pilotDay: number;
    pilotLengthDays: number;
    memberCount: number;
    residentCount: number;
    facultyCount: number;
  };
  metrics: {
    cases30: number;
    caseDeltaPercent: number;
    epaCompletionPercent: number;
    pendingSignoffs: number;
    activeResidents: number;
    adoptionPercent: number;
    medianSignoffDays: number | null;
  };
  trend: Array<{ label: string; cases: number }>;
  stages: Array<{ id: string; label: string; signed: number; total: number; percent: number }>;
  alerts: Array<{
    id: string;
    level: SignalLevel;
    residentId?: string;
    title: string;
    detail: string;
    href: string;
  }>;
  residents: Array<{
    userId: string;
    name: string;
    trainingYear: string;
    cases30: number;
    totalCases: number;
    epaSigned: number;
    epaTotal: number;
    pending: number;
    lastActivityAt: string | null;
    signal: SignalLevel;
  }>;
  setup: Array<{ id: string; label: string; complete: boolean; href: string }>;
  weeklyBrief: {
    headline: string;
    summary: string;
    bullets: string[];
  };
  generatedAt: string;
  synthetic?: boolean;
}
