import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { parseFormSchema, scoreSubmission, type FieldValue } from '@/lib/forms/types';
import type { FormSubmissionStatus, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// /api/forms/submissions/[id]
//   GET    — submission + responses
//   PATCH  — update responses (author or program owner) +/- transition
//            status. Allowed transitions:
//              DRAFT      → SUBMITTED  (author)
//              SUBMITTED  → SIGNED     (program owner / chair)
//              SUBMITTED  → RETURNED   (program owner — needs reason)
//              RETURNED   → SUBMITTED  (author resubmits)
//   DELETE — author can delete a DRAFT; nothing else.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

interface ParamsCtx {
  params: Promise<{ id: string }>;
}

async function loadSubmission(id: string) {
  return db.formSubmission.findUnique({
    where: { id },
    include: {
      template: true,
      responses: true,
      subject: { select: { id: true, name: true, email: true } },
      author:  { select: { id: true, name: true, email: true } },
    },
  });
}

async function callerCanRead(
  callerUserId: string,
  submission: NonNullable<Awaited<ReturnType<typeof loadSubmission>>>,
): Promise<boolean> {
  if (submission.subjectId === callerUserId) return true;
  if (submission.authorId === callerUserId) return true;
  const member = await db.programMember.findFirst({
    where: { programId: submission.template.programId, userId: callerUserId },
  });
  return !!member;
}

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const submission = await loadSubmission(id);
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!(await callerCanRead(user.id, submission))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ submission });
}

interface PatchBody {
  responses?: Record<string, FieldValue>;
  summary?: string;
  status?: FormSubmissionStatus;
  returnedReason?: string;
}

export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const submission = await loadSubmission(id);
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isAuthor = submission.authorId === user.id;
  const ownerMember = await db.programMember.findFirst({
    where: {
      programId: submission.template.programId,
      userId: user.id,
      role: { in: ['OWNER', 'PD', 'CHAIR'] },
    },
  });
  const isOwner = !!ownerMember;
  if (!isAuthor && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.summary !== undefined) data.summary = body.summary.trim() || null;

  // Status transitions enforced server-side.
  if (body.status) {
    const from = submission.status;
    const to = body.status;
    const allowed =
      (from === 'DRAFT' && to === 'SUBMITTED' && isAuthor) ||
      (from === 'SUBMITTED' && to === 'SIGNED' && isOwner) ||
      (from === 'SUBMITTED' && to === 'RETURNED' && isOwner) ||
      (from === 'RETURNED' && to === 'SUBMITTED' && isAuthor) ||
      (from === 'SIGNED' && to === 'SUBMITTED' && isOwner); // amend
    if (!allowed) {
      return NextResponse.json(
        { error: `Cannot transition from ${from} to ${to} as your current role.` },
        { status: 400 },
      );
    }
    data.status = to;
    if (to === 'SIGNED') data.signedAt = new Date();
    if (to === 'RETURNED') {
      data.returnedReason = (body.returnedReason ?? '').trim() || null;
    }
    if (to === 'SUBMITTED' && from === 'RETURNED') data.returnedReason = null;
  }

  // Responses: only the author can edit while DRAFT or RETURNED.
  if (body.responses) {
    if (!isAuthor) {
      return NextResponse.json(
        { error: 'Only the form author can edit responses.' },
        { status: 403 },
      );
    }
    if (submission.status !== 'DRAFT' && submission.status !== 'RETURNED') {
      return NextResponse.json(
        { error: `Cannot edit responses in status ${submission.status}.` },
        { status: 409 },
      );
    }

    // Recompute aggregate score from the new responses + the template
    // schema. Wrap in try/catch so a malformed schema doesn't block
    // saving the user's text answers.
    try {
      const schema = parseFormSchema(submission.template.schema);
      const result = scoreSubmission(schema, body.responses);
      data.aggregateScore = result.percent;
    } catch {
      // ignore — leave existing score
    }

    // Replace the response set in a transaction so the row never has
    // a half-applied state.
    await db.$transaction(async (tx) => {
      await tx.formResponse.deleteMany({ where: { submissionId: id } });
      const entries = Object.entries(body.responses ?? {});
      if (entries.length > 0) {
        await tx.formResponse.createMany({
          data: entries.map(([fieldId, value]) => ({
            submissionId: id,
            fieldId,
            value: value as unknown as Prisma.InputJsonValue,
          })),
        });
      }
    });
  }

  const updated = await db.formSubmission.update({
    where: { id },
    data,
    include: { responses: true },
  });
  return NextResponse.json({ submission: updated });
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const submission = await db.formSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (submission.authorId !== user.id) {
    return NextResponse.json({ error: 'Only the author can delete.' }, { status: 403 });
  }
  if (submission.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Only drafts can be deleted. Returned submissions stay archived.' },
      { status: 409 },
    );
  }
  await db.formSubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
