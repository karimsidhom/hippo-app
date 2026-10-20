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
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();

  // Exact email only. This was a substring match on name OR email with a
  // two-character floor, which made the endpoint a directory of every Hippo
  // account: iterating short queries enumerated the name, email address,
  // institution and training level of the entire user base, to any member
  // of any program. A director inviting a colleague knows their address, so
  // requiring the whole thing costs nothing and removes the enumeration.
  if (!q.includes('@') || q.length < 5) {
    return NextResponse.json({ users: [] });
  }

  const [existingMembers, pendingInvites, pendingRequests] = await Promise.all([
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
    // Someone already asked, or was already asked. Either way they
    // should not show up as someone still to invite.
    db.programJoinRequest.findMany({
      where: { programId: id, status: 'PENDING' },
      select: { userId: true },
    }),
  ]);

  const excludeUserIds = new Set(existingMembers.map((m) => m.userId));
  excludeUserIds.add(user.id);
  for (const r of pendingRequests) excludeUserIds.add(r.userId);
  const excludeEmails = new Set(pendingInvites.map((i) => i.email.toLowerCase()));

  const matches = await db.user.findMany({
    where: {
      AND: [
        { id: { notIn: Array.from(excludeUserIds) } },
        { email: { equals: q, mode: 'insensitive' } },
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
    take: 1,
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
