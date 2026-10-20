import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { canCreateJoinRequest } from '@/lib/program-join/state';

/**
 * POST /api/programs/[id]/join-requests
 *
 * A resident asks to join a program. Creates a PENDING request with
 * invitedById null, which is what tells the state machine the director
 * is the one who decides it.
 *
 * A previously declined or withdrawn row is reused rather than
 * duplicated, because (programId, userId) is unique.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  const program = await db.program.findFirst({
    where: { id: programId, discoverable: true },
    select: { id: true },
  });
  // 404 rather than 403: do not confirm that a hidden program exists.
  if (!program) {
    return NextResponse.json({ error: 'Program not found.' }, { status: 404 });
  }

  const alreadyMember = await db.programMember.findUnique({
    where: { programId_userId: { programId, userId: user.id } },
    select: { id: true },
  });
  if (alreadyMember) {
    return NextResponse.json(
      { error: 'You are already a member of this program.' },
      { status: 409 },
    );
  }

  let body: { claimedPgy?: unknown; message?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is fine. Both fields are optional.
  }

  const claimedPgy =
    typeof body.claimedPgy === 'number' &&
    Number.isInteger(body.claimedPgy) &&
    body.claimedPgy >= 1 &&
    body.claimedPgy <= 10
      ? body.claimedPgy
      : null;
  const message =
    typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 500)
      : null;

  const existing = await db.programJoinRequest.findUnique({
    where: { programId_userId: { programId, userId: user.id } },
    select: { status: true, invitedById: true },
  });

  const decision = canCreateJoinRequest(existing);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: 409 });
  }

  const request = await db.programJoinRequest.upsert({
    where: { programId_userId: { programId, userId: user.id } },
    create: { programId, userId: user.id, claimedPgy, message, status: 'PENDING' },
    update: {
      status: 'PENDING',
      claimedPgy,
      message,
      // Clear the previous outcome so the director sees a fresh request.
      invitedById: null,
      decidedById: null,
      decidedAt: null,
      declineReason: null,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ request }, { status: 201 });
}

/**
 * GET /api/programs/[id]/join-requests?status=PENDING
 *
 * The director's queue. Owner-only, because the list carries the names
 * and emails of people who are not yet members.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id: programId } = await params;

  if (!(await isProgramOwner(user.id, programId))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const statusParam = new URL(req.url).searchParams.get('status');
  const status =
    statusParam === 'APPROVED' ||
    statusParam === 'DECLINED' ||
    statusParam === 'WITHDRAWN' ||
    statusParam === 'PENDING'
      ? statusParam
      : 'PENDING';

  const requests = await db.programJoinRequest.findMany({
    where: { programId, status },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      claimedPgy: true,
      message: true,
      invitedById: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: {
            select: {
              roleType: true,
              trainingYearLabel: true,
              institution: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      claimedPgy: r.claimedPgy,
      message: r.message,
      invitedById: r.invitedById,
      createdAt: r.createdAt.toISOString(),
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
        roleType: r.user.profile?.roleType ?? null,
        trainingYearLabel: r.user.profile?.trainingYearLabel ?? null,
        institution: r.user.profile?.institution ?? null,
      },
    })),
  });
}
