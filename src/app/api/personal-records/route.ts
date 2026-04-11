import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/personal-records — all PRs for the current user
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const records = await db.personalRecord.findMany({
    where: { userId: user.id },
    orderBy: { achievedAt: 'desc' },
  });

  return NextResponse.json(records);
}

/**
 * POST /api/personal-records — upsert a personal record
 * If a record for this procedure + type already exists, update it and record the previous value.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { procedureName, recordType, value, title, description } = body;

  if (!procedureName || !recordType || value === undefined) {
    return NextResponse.json(
      { error: 'procedureName, recordType, and value are required' },
      { status: 400 },
    );
  }

  const existing = await db.personalRecord.findFirst({
    where: { userId: user.id, procedureName, recordType },
  });

  let record;

  if (existing) {
    // Only update if it's a new record (lower duration = better for time records)
    if (value >= existing.value) {
      return NextResponse.json(existing); // Not a new record
    }
    record = await db.personalRecord.update({
      where: { id: existing.id },
      data: { value, previousValue: existing.value, achievedAt: new Date() },
    });
  } else {
    record = await db.personalRecord.create({
      data: { userId: user.id, procedureName, recordType, value },
    });
  }

  // Feed event for a new personal record
  await db.feedEvent.create({
    data: {
      userId:      user.id,
      eventType:   'PERSONAL_RECORD',
      title:       title ?? `New PR: ${procedureName}`,
      description: description ?? `${recordType}: ${value}`,
      isPublic:    true,
      metadata:    { recordId: record.id, procedureName, recordType, value },
    },
  }).catch(() => {});

  return NextResponse.json(record, { status: 201 });
}
