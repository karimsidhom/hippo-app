import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * DELETE /api/social/friends/:friendshipId
 *
 * Unfriend. Only a member of the friendship may delete it.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const { friendshipId } = await params;

    const friendship = await db.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || (friendship.user1Id !== user.id && friendship.user2Id !== user.id)) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    await db.friendship.delete({ where: { id: friendshipId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[hippo:social] DELETE /api/social/friends/[friendshipId] failed', err);
    return NextResponse.json({ error: 'Could not remove this friend' }, { status: 500 });
  }
}
