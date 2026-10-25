import { db } from '@/lib/db';
import { roleCanReadPdMeetings } from '@/lib/program-auth';
import { MANITOBA_UROLOGY_CONFIG } from './defaults';
import type { MeetingConfig } from './types';

/**
 * True when this user may create, read and publish meetings in this
 * programme. Deliberately narrower than roster access: see
 * roleCanReadPdMeetings in program-auth.ts.
 *
 * Note this admits any OWNER or PD of the programme, not only the director
 * who created a given draft. A programme with two directors should not lock
 * one out of a half-finished record; the resident still sees nothing until
 * it is published.
 */
export async function canDirectMeetings(
  userId: string,
  programId: string,
): Promise<boolean> {
  const m = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId } },
    select: { role: true },
  });
  return m ? roleCanReadPdMeetings(m.role) : false;
}

/**
 * The programme's meeting configuration, seeded with the Manitoba defaults
 * the first time anyone asks. Seeding on read rather than at program
 * creation means programmes created before this feature existed get one too.
 */
export async function getOrCreateMeetingConfig(programId: string) {
  const existing = await db.programMeetingConfig.findUnique({ where: { programId } });
  if (existing) return existing;

  const d: MeetingConfig = MANITOBA_UROLOGY_CONFIG;
  return db.programMeetingConfig.create({
    data: {
      programId,
      checklists: d.checklists as object,
      scoreTables: d.scoreTables as object,
      certifications: d.certifications as object,
      introText: d.introText,
      letterhead: d.letterhead as object,
    },
  });
}

/**
 * Load a meeting and confirm the caller may direct it. Returns null when it
 * does not exist OR the caller has no business seeing it, so every caller
 * answers 404 either way and never discloses that a record exists.
 */
export async function loadMeetingForDirector(meetingId: string, userId: string) {
  const meeting = await db.pdMeeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      programId: true,
      residentId: true,
      meetingDate: true,
      cycleLabel: true,
      pgyAtMeeting: true,
      status: true,
      publishedAt: true,
      previousMeetingId: true,
      acknowledgedAt: true,
      sections: true,
      resident: { select: { id: true, name: true, email: true } },
      previousMeeting: { select: { sections: true, meetingDate: true } },
    },
  });
  if (!meeting) return null;
  if (!(await canDirectMeetings(userId, meeting.programId))) return null;
  return meeting;
}
