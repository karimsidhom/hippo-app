import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/assessors/lookup?email=...
 * Tells the client whether a given attending email belongs to a Hippo user,
 * so the EPA form can show "They'll get an in-app notification" vs "Email invite".
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ isHippoUser: false });
  }

  const u = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, profile: { select: { roleType: true } } },
  });

  if (!u) return NextResponse.json({ isHippoUser: false });

  const roleType = u.profile?.roleType;
  // Only treat as an in-app assessor if role is an assessor role.
  const isAssessor =
    roleType === 'ATTENDING' ||
    roleType === 'STAFF' ||
    roleType === 'PROGRAM_DIRECTOR';

  return NextResponse.json({
    isHippoUser: true,
    isAssessor,
    name: u.name ?? null,
    role: roleType ?? null,
  });
}
