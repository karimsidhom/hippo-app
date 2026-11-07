import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { normaliseDiscoverQuery } from '@/lib/program-join/discover';

/**
 * GET /api/programs/discover?q=...
 *
 * Search discoverable programs so a resident can attach to one during
 * onboarding. This is the only program query in the app that is not
 * scoped to membership, so it is deliberately thin: name, institution,
 * specialty, member count, and the caller's own status with it. No
 * roster, no member names, no counts that could identify anyone.
 */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const q = normaliseDiscoverQuery(new URL(req.url).searchParams.get('q'));
  if (!q) return NextResponse.json({ programs: [] });

  const programs = await db.program.findMany({
    where: {
      discoverable: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { institution: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      institution: true,
      specialty: true,
      _count: { select: { members: true } },
      members: { where: { userId: user.id }, select: { id: true }, take: 1 },
      joinRequests: {
        where: { userId: user.id },
        select: { status: true },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
    take: 20,
  });

  return NextResponse.json({
    programs: programs.map((p) => ({
      id: p.id,
      name: p.name,
      institution: p.institution,
      specialty: p.specialty,
      memberCount: p._count.members,
      myStatus: p.members.length
        ? ('MEMBER' as const)
        : (p.joinRequests[0]?.status ?? null),
    })),
  });
}
