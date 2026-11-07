import { db } from '@/lib/db';

export interface MeetingMetrics {
  /** Null start means "since they joined", i.e. a first meeting. */
  since: string | null;
  until: string;
  caseCount: number;
  casesByCategory: { category: string; count: number }[];
  casesByRole: { role: string; count: number }[];
  epaTotal: number;
  epaAchieved: number;
  /** Weeks in the interval with no case logged. A consistency signal only. */
  weeksWithoutLogging: number;
}

/**
 * What Hippo already knows about this resident over the interval since their
 * last meeting. Counts only. This is context to open the conversation with,
 * not an assessment, and the PDF prints it under its own heading so it is
 * never confused with what the director wrote.
 */
export async function meetingMetrics(
  residentId: string,
  since: Date | null,
  until: Date = new Date(),
): Promise<MeetingMetrics> {
  const where = {
    userId: residentId,
    caseDate: { ...(since ? { gte: since } : {}), lte: until },
  };

  const [cases, epaTotal, epaAchieved] = await Promise.all([
    db.caseLog.findMany({
      where,
      select: { procedureCategory: true, role: true, caseDate: true },
    }),
    db.epaObservation.count({
      where: { userId: residentId, createdAt: { ...(since ? { gte: since } : {}), lte: until } },
    }),
    db.epaObservation.count({
      where: {
        userId: residentId,
        achievement: 'ACHIEVED',
        createdAt: { ...(since ? { gte: since } : {}), lte: until },
      },
    }),
  ]);

  const tally = (key: 'procedureCategory' | 'role') => {
    const m = new Map<string, number>();
    for (const c of cases) {
      const k = (c[key] ?? 'Uncategorised') as string;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([k, count]) => ({ category: k, role: k, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Weeks with nothing logged, over the interval. Capped so a first meeting
  // with a long lead-in does not report an alarming number.
  let weeksWithoutLogging = 0;
  if (since) {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.max(0, Math.floor((until.getTime() - since.getTime()) / weekMs));
    const logged = new Set(
      cases.map((c) => Math.floor((c.caseDate.getTime() - since.getTime()) / weekMs)),
    );
    weeksWithoutLogging = Math.max(0, totalWeeks - logged.size);
  }

  return {
    since: since?.toISOString() ?? null,
    until: until.toISOString(),
    caseCount: cases.length,
    casesByCategory: tally('procedureCategory').map(({ category, count }) => ({ category, count })),
    casesByRole: tally('role').map(({ role, count }) => ({ role, count })),
    epaTotal,
    epaAchieved,
    weeksWithoutLogging,
  };
}
