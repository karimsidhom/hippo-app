import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/auth/me
 *
 * Returns the current user + profile. Lightweight session check.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role,
    },
    profile: dbUser.profile,
  });
}
