import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/milestones — fetch all milestones for the current user
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const milestones = await db.milestone.findMany({
    where: { userId: user.id },
    orderBy: { achievedAt: 'desc' },
  });

  return NextResponse.json(milestones);
}

/**
 * POST /api/milestones — record a newly achieved milestone
 * Also creates a public feed event.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { type, procedureName, value, badgeKey, title, description } = body;

  if (!type || !badgeKey || value === undefined) {
    return NextResponse.json(
      { error: 'type, badgeKey, and value are required' },
      { status: 400 },
    );
  }

  // Avoid duplicating the same milestone
  const existing = await db.milestone.findFirst({
    where: { userId: user.id, type, procedureName: procedureName ?? null, value },
  });
  if (existing) return NextResponse.json(existing);

  const milestone = await db.milestone.create({
    data: {
      userId: user.id,
      type,
      procedureName: procedureName ?? null,
      value,
      badgeKey,
    },
  });

  // Create a feed event for the milestone
  await db.feedEvent.create({
    data: {
      userId:      user.id,
      eventType:   'MILESTONE',
      title:       title ?? `Milestone: ${badgeKey}`,
      description: description ?? `Reached ${value} ${type.toLowerCase().replace(/_/g, ' ')}`,
      isPublic:    true,
      metadata:    { milestoneId: milestone.id, badgeKey, type, value },
    },
  }).catch(() => {});

  return NextResponse.json(milestone, { status: 201 });
}
