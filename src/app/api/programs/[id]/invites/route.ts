import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { isProgramOwner } from '@/lib/program-auth';
import { sendEmail, buildProgramInviteEmail } from '@/lib/email';

/**
 * GET /api/programs/[id]/invites
 * List pending invites for a program. Owner only.
 */
export async function GET(
  _req: Request,
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

  const invites = await db.programInvite.findMany({
    where: { programId: id, acceptedAt: null, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
      acceptedAt: i.acceptedAt?.toISOString() ?? null,
      revokedAt: i.revokedAt?.toISOString() ?? null,
    })),
  });
}

/**
 * POST /api/programs/[id]/invites
 * Create one or more invites and email them. Owner only.
 * Body: { emails: string[] }
 */
export async function POST(
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

  let body: { emails?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawEmails = body.emails ?? [];
  const emails = Array.from(
    new Set(
      rawEmails
        .map((e) => e?.toLowerCase().trim())
        .filter((e): e is string => !!e && /.+@.+\..+/.test(e)),
    ),
  );

  if (emails.length === 0) {
    return NextResponse.json(
      { error: 'At least one valid email is required.' },
      { status: 400 },
    );
  }
  if (emails.length > 50) {
    return NextResponse.json(
      { error: 'Max 50 invites at a time.' },
      { status: 400 },
    );
  }

  const [program, inviter] = await Promise.all([
    db.program.findUnique({ where: { id } }),
    db.user.findUnique({ where: { id: user.id } }),
  ]);

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  const inviterName = inviter?.name?.trim() || user.email.split('@')[0];

  // 14-day expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\\n$/, '').replace(/\s+$/, '').trim() ||
    'https://hippomedicine.com';

  const results: {
    email: string;
    status: 'sent' | 'already-member' | 'already-invited' | 'send-failed';
    inviteId?: string;
  }[] = [];

  for (const email of emails) {
    // Skip users already in the program
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      const membership = await db.programMember.findUnique({
        where: { programId_userId: { programId: id, userId: existingUser.id } },
      });
      if (membership) {
        results.push({ email, status: 'already-member' });
        continue;
      }
    }

    // Skip if a pending invite already exists
    const existingInvite = await db.programInvite.findFirst({
      where: {
        programId: id,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      results.push({
        email,
        status: 'already-invited',
        inviteId: existingInvite.id,
      });
      continue;
    }

    // Generate a cryptographically-random URL-safe token
    const token = crypto.randomBytes(32).toString('base64url');

    const invite = await db.programInvite.create({
      data: {
        programId: id,
        email,
        token,
        invitedById: user.id,
        expiresAt,
      },
    });

    const joinUrl = `${baseUrl}/join/${token}`;
    const { subject, html, text } = buildProgramInviteEmail({
      recipientEmail: email,
      inviterName,
      programName: program.name,
      programInstitution: program.institution,
      joinUrl,
      expiresAt,
    });

    const ok = await sendEmail({ to: email, subject, html, text });
    results.push({
      email,
      status: ok ? 'sent' : 'send-failed',
      inviteId: invite.id,
    });
  }

  return NextResponse.json({ results });
}
