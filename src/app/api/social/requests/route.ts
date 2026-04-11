import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/social/requests
 *
 * Returns pending friend requests RECEIVED by the current user,
 * plus a count of pending requests SENT by the current user.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [received, sentCount] = await Promise.all([
    db.friendRequest.findMany({
      where: { toUserId: user.id, status: 'PENDING' },
      include: {
        fromUser: {
          select: {
            id: true, name: true, image: true,
            profile: { select: { specialty: true, trainingYearLabel: true, institution: true, roleType: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.friendRequest.count({
      where: { fromUserId: user.id, status: 'PENDING' },
    }),
  ]);

  return NextResponse.json({ received, sentCount });
}

/**
 * POST /api/social/requests
 *
 * Send a friend request to another user.
 * Body: { toUserId: string }
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { toUserId } = await req.json();
  if (!toUserId) {
    return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });
  }
  if (toUserId === user.id) {
    return NextResponse.json({ error: 'Cannot send a friend request to yourself' }, { status: 400 });
  }

  // Check if already friends
  const existingFriendship = await db.friendship.findFirst({
    where: {
      OR: [
        { user1Id: user.id, user2Id: toUserId },
        { user1Id: toUserId, user2Id: user.id },
      ],
    },
  });
  if (existingFriendship) {
    return NextResponse.json({ error: 'Already friends' }, { status: 409 });
  }

  // Check for existing pending request in either direction
  const existingRequest = await db.friendRequest.findFirst({
    where: {
      OR: [
        { fromUserId: user.id, toUserId },
        { fromUserId: toUserId, toUserId: user.id },
      ],
      status: 'PENDING',
    },
  });
  if (existingRequest) {
    return NextResponse.json({ error: 'A pending request already exists' }, { status: 409 });
  }

  const request = await db.friendRequest.create({
    data: { fromUserId: user.id, toUserId, status: 'PENDING' },
  });

  return NextResponse.json(request, { status: 201 });
}

/**
 * PATCH /api/social/requests
 *
 * Accept or reject a received friend request.
 * Body: { requestId: string, action: 'ACCEPT' | 'REJECT' }
 *
 * On ACCEPT: deletes the request and creates a Friendship record.
 */
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { requestId, action } = await req.json();
  if (!requestId || !action) {
    return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 });
  }
  if (!['ACCEPT', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'action must be ACCEPT or REJECT' }, { status: 400 });
  }

  const request = await db.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.toUserId !== user.id) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 });
  }

  if (action === 'ACCEPT') {
    // Use a transaction: update request status + create friendship
    await db.$transaction([
      db.friendRequest.update({
        where: { id: requestId },
        data:  { status: 'ACCEPTED' },
      }),
      db.friendship.create({
        data: {
          user1Id: request.fromUserId,
          user2Id: request.toUserId,
        },
      }),
    ]);
    return NextResponse.json({ success: true, action: 'ACCEPTED' });
  } else {
    await db.friendRequest.update({
      where: { id: requestId },
      data:  { status: 'REJECTED' },
    });
    return NextResponse.json({ success: true, action: 'REJECTED' });
  }
}

/**
 * DELETE /api/social/requests
 *
 * Cancel a pending friend request YOU sent.
 * Body: { requestId: string }
 */
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { requestId } = await req.json();
  if (!requestId) {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }

  const request = await db.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.fromUserId !== user.id) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  await db.friendRequest.delete({ where: { id: requestId } });
  return NextResponse.json({ success: true });
}
