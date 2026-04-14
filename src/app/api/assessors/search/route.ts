import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/assessors/search?q=...
 * Searches Hippo users with assessor roles (ATTENDING / STAFF / PROGRAM_DIRECTOR)
 * by name or email. Powers the in-app attending picker on the EPA log form.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ assessors: [] });

  const users = await db.user.findMany({
    where: {
      AND: [
        {
          profile: {
            roleType: { in: ['ATTENDING', 'STAFF', 'PROGRAM_DIRECTOR'] },
          },
        },
        {
          OR: [
            { name:  { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { roleType: true, institution: true } },
    },
    take: 8,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    assessors: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.profile?.roleType ?? null,
      institution: u.profile?.institution ?? null,
    })),
  });
}
