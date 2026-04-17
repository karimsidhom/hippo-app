import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';

/**
 * GET /api/programs/[id]/search-users?q=...
 *
 * Autocomplete search for users the PD can invite from within the app.
 * Scoped to program owners only.
 *
 * Excludes:
 *   • The current user
 *   • Users already in this program
 *   • Users with an outstanding (unaccepted, unrevoked, unexpired) invite
 *
 * Matches case-insensitively against name and email, returns up to 8 results.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  if (!(await isProgramOwner(user.id, id))) {
    return NextResponse.json(
      { error: 'Access denied. Owner only.' },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const [existingMembers, pendingInvites] = await Promise.all([
    db.programMember.findMany({
      where: { programId: id },
      select: { userId: true },
    }),
    db.programInvite.findMany({
      where: {
        programId: id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { email: true },
    }),
  ]);

  const excludeUserIds = new Set(existingMembers.map((m) => m.userId));
  excludeUserIds.add(user.id);
  const excludeEmails = new Set(pendingInvites.map((i) => i.email.toLowerCase()));

  const matches = await db.user.findMany({
    where: {
      AND: [
        { id: { notIn: Array.from(excludeUserIds) } },
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
      ],
    },
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
    take: 20,
  });

  const filtered = matches
    .filter((u) => !excludeEmails.has(u.email.toLowerCase()))
    .slice(0, 8)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      roleType: u.profile?.roleType ?? null,
      trainingYearLabel: u.profile?.trainingYearLabel ?? null,
      institution: u.profile?.institution ?? null,
    }));

  return NextResponse.json({ users: filtered });
}
