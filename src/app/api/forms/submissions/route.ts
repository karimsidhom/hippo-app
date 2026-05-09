import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { parseFormSchema, scoreSubmission, type FieldValue } from '@/lib/forms/types';
import type { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// /api/forms/submissions
//
//   GET ?subjectId=… &authorId=… &status=… — list submissions visible
//                                            to the caller
//   POST                                   — create a draft submission
//                                            (any program member can
//                                            initiate)
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const params = req.nextUrl.searchParams;
  const subjectId = params.get('subjectId');
  const authorId = params.get('authorId');
  const status = params.get('status');

  // Visibility rule: caller must be EITHER subject, author, or in
  // a program that owns the template.
  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    select: { programId: true },
  });
  const programIds = memberships.map((m) => m.programId);

  const where: Prisma.FormSubmissionWhereInput = {
    OR: [
      { subjectId: user.id },
      { authorId: user.id },
      ...(programIds.length > 0
        ? [{ template: { programId: { in: programIds } } }]
        : []),
    ],
    ...(subjectId ? { subjectId } : {}),
    ...(authorId ? { authorId } : {}),
    ...(status ? { status: status as Prisma.FormSubmissionWhereInput['status'] } : {}),
  };

  const submissions = await db.formSubmission.findMany({
    where,
    include: {
      template: { select: { id: true, name: true, category: true } },
      subject: { select: { id: true, name: true, email: true } },
      author:  { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ submissions });
}

interface CreateBody {
  templateId?: string;
  subjectId?: string;
  caseLogId?: string;
  rotationAssignmentId?: string;
  responses?: Record<string, FieldValue>;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.templateId || !body.subjectId) {
    return NextResponse.json(
      { error: 'templateId and subjectId are required' },
      { status: 400 },
    );
  }

  const template = await db.formTemplate.findUnique({
    where: { id: body.templateId },
  });
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  if (!template.active) {
    return NextResponse.json(
      { error: 'This form is no longer active.' },
      { status: 409 },
    );
  }

  // Caller must be a member of the program that owns the template.
  const member = await db.programMember.findFirst({
    where: { programId: template.programId, userId: user.id },
  });
  if (!member) {
    return NextResponse.json(
      { error: 'Not a member of this program.' },
      { status: 403 },
    );
  }

  // Optional: the subject must also be a member (otherwise the
  // submission references someone outside the program — which is
  // never useful and creates a leakage risk).
  const subjectMember = await db.programMember.findFirst({
    where: { programId: template.programId, userId: body.subjectId },
  });
  if (!subjectMember) {
    return NextResponse.json(
      { error: 'Subject is not a member of this program.' },
      { status: 400 },
    );
  }

  let aggregateScore: number | null = null;
  try {
    const schema = parseFormSchema(template.schema);
    if (body.responses) {
      const result = scoreSubmission(schema, body.responses);
      aggregateScore = result.percent;
    }
  } catch {
    // Invalid template schema — leave aggregate null and let the form
    // editor surface the issue.
  }

  const submission = await db.formSubmission.create({
    data: {
      templateId: template.id,
      subjectId: body.subjectId,
      authorId: user.id,
      status: 'DRAFT',
      caseLogId: body.caseLogId ?? null,
      rotationAssignmentId: body.rotationAssignmentId ?? null,
      aggregateScore,
      responses: body.responses
        ? {
            create: Object.entries(body.responses).map(([fieldId, value]) => ({
              fieldId,
              value: value as unknown as Prisma.InputJsonValue,
            })),
          }
        : undefined,
    },
    include: { responses: true },
  });

  return NextResponse.json({ submission });
}
