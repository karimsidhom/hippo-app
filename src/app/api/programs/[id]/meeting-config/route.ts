import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { canDirectMeetings, getOrCreateMeetingConfig } from '@/lib/pd-meeting/access';

/** GET /api/programs/[id]/meeting-config */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({ config: await getOrCreateMeetingConfig(programId) });
}

/**
 * PUT /api/programs/[id]/meeting-config
 *
 * Replaces the editable lists. The eight section IDs are fixed in code and
 * cannot be changed here; sectionConfig only overrides their labels.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await canDirectMeetings(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  await getOrCreateMeetingConfig(programId);
  const data: Record<string, unknown> = {};
  for (const k of ['checklists', 'scoreTables', 'certifications', 'sectionConfig', 'letterhead'] as const) {
    if (k in body) data[k] = body[k] as object;
  }
  if (typeof body.introText === 'string') data.introText = body.introText.slice(0, 4000);
  if (typeof body.logoUrl === 'string' || body.logoUrl === null) data.logoUrl = body.logoUrl;

  const config = await db.programMeetingConfig.update({ where: { programId }, data });
  return NextResponse.json({ config });
}
