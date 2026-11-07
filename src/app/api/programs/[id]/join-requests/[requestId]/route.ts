import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import {
  decideJoinAction,
  type JoinAction,
  type JoinActor,
} from '@/lib/program-join/state';

const ACTIONS: JoinAction[] = ['approve', 'decline', 'withdraw', 'accept'];

/**
 * PATCH /api/programs/[id]/join-requests/[requestId]
 *
 * Settles a request. Who may do what is decided entirely by
 * decideJoinAction(); this handler only resolves which actor the caller
 * is, applies the result, and creates the ProgramMember row on approval.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId, requestId } = await params;

  let body: { action?: unknown; declineReason?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const action = body.action as JoinAction;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of ${ACTIONS.join(', ')}.` },
      { status: 400 },
    );
  }

  const request = await db.programJoinRequest.findFirst({
    where: { id: requestId, programId },
    select: { id: true, status: true, invitedById: true, userId: true },
  });
  if (!request) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const isSubject = request.userId === user.id;
  const isDirector = await isProgramOwner(user.id, programId);
  // A caller who is neither must not learn that this request exists.
  if (!isSubject && !isDirector) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  // The subject's own claim wins when a director somehow requested to
  // join their own program, so the state machine sees the stricter actor.
  const actor: JoinActor = isSubject ? 'subject' : 'director';

  const decision = decideJoinAction(request, actor, action);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: 409 });
  }

  const nextStatus = decision.nextStatus;
  const declineReason =
    nextStatus === 'DECLINED' && typeof body.declineReason === 'string'
      ? body.declineReason.trim().slice(0, 500) || null
      : null;

  // Approval has to create the membership and settle the request
  // together, or a crash between them leaves a resident approved with no
  // roster row.
  await db.$transaction(async (tx) => {
    await tx.programJoinRequest.update({
      where: { id: request.id },
      data: {
        status: nextStatus,
        decidedById: user.id,
        decidedAt: new Date(),
        declineReason,
      },
    });

    if (nextStatus === 'APPROVED') {
      await tx.programMember.upsert({
        where: {
          programId_userId: { programId, userId: request.userId },
        },
        create: { programId, userId: request.userId, role: 'RESIDENT' },
        update: {},
      });
    }
  });

  return NextResponse.json({ request: { id: request.id, status: nextStatus } });
}
