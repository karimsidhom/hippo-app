import { db } from '@/lib/db';
import { getOrCreateMeetingConfig } from './access';
import { renderMeetingPdf, type MeetingPdfInput } from './pdf';
import { asSections } from './types';
import type {
  CertificationDef,
  ChecklistDef,
  LetterheadDef,
  ScoreTableDef,
} from './types';

/**
 * Assemble everything the letter needs for one meeting and render it.
 *
 * A PUBLISHED record is rendered entirely from its snapshot, so reprinting
 * an old meeting shows that meeting's numbers rather than today's. A DRAFT
 * has no snapshot yet, so it renders live as a preview for the director.
 */
export async function renderMeetingPdfById(meetingId: string): Promise<Buffer | null> {
  const m = await db.pdMeeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true, programId: true, residentId: true,
      meetingDate: true, cycleLabel: true, pgyAtMeeting: true,
      status: true, sections: true, snapshot: true,
      acknowledgedAt: true, acknowledgedName: true,
      resident: { select: { name: true, email: true } },
      director: { select: { name: true, email: true } },
      program: { select: { name: true, institution: true } },
      previousMeeting: { select: { sections: true, meetingDate: true } },
    },
  });
  if (!m) return null;

  const snap = (m.snapshot ?? null) as Record<string, unknown> | null;
  const snapConfig = (snap?.config ?? null) as Record<string, unknown> | null;

  // Published: everything from the snapshot. Draft: live.
  const live = snapConfig ? null : await getOrCreateMeetingConfig(m.programId);

  const pick = <T,>(key: string, fallback: T): T =>
    (snapConfig?.[key] as T | undefined) ??
    ((live as unknown as Record<string, unknown> | null)?.[key] as T | undefined) ??
    fallback;

  const scores = snap?.scores
    ? (snap.scores as { tableId: string; sittingAt: string; values: Record<string, string> }[])
    : (
        await db.residentScoreEntry.findMany({
          where: { programId: m.programId, residentId: m.residentId },
          orderBy: { sittingAt: 'asc' },
          select: { tableId: true, sittingAt: true, values: true },
        })
      ).map((r) => ({
        tableId: r.tableId,
        sittingAt: r.sittingAt.toISOString(),
        values: (r.values ?? {}) as Record<string, string>,
      }));

  const checklistRows = snap?.checklist
    ? (snap.checklist as { itemId: string; completed: boolean }[])
    : await db.residentChecklistItem.findMany({
        where: { programId: m.programId, residentId: m.residentId },
        select: { itemId: true, completed: true },
      });
  const checklist: Record<string, { completed: boolean }> = {};
  for (const c of checklistRows) checklist[c.itemId] = { completed: c.completed };

  const previousSections = snap?.previousSections
    ? asSections(snap.previousSections)
    : m.previousMeeting
      ? asSections(m.previousMeeting.sections)
      : null;

  const previousMeetingDate = snap?.previousMeetingDate
    ? new Date(snap.previousMeetingDate as string)
    : (m.previousMeeting?.meetingDate ?? null);

  const residentName = m.resident.name?.trim() || m.resident.email;
  const directorName = m.director.name?.trim() || null;

  const input: MeetingPdfInput = {
    residentName,
    pgyAtMeeting: m.pgyAtMeeting,
    meetingDate: m.meetingDate,
    previousMeetingDate,
    cycleLabel: m.cycleLabel,
    directorName,
    directorTitleLines: [
      'Program Director',
      m.program.name,
      m.program.institution ?? '',
    ].filter(Boolean),
    programName: m.program.name,
    letterhead: pick<LetterheadDef | null>('letterhead', null),
    introText: pick<string | null>('introText', null),
    sections: asSections(m.sections),
    previousSections,
    scoreTables: pick<ScoreTableDef[]>('scoreTables', []),
    scores,
    checklists: pick<ChecklistDef[]>('checklists', []),
    checklist,
    certifications: pick<CertificationDef[]>('certifications', []),
    acknowledgedName: m.acknowledgedName,
    acknowledgedAt: m.acknowledgedAt,
  };

  return renderMeetingPdf(input);
}

/** A filename a director can find again in their downloads folder. */
export function meetingPdfFilename(residentName: string, meetingDate: Date): string {
  const safe = residentName.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Resident';
  const d = meetingDate.toISOString().slice(0, 10);
  return `PD-1-1_${safe}_${d}.pdf`;
}
