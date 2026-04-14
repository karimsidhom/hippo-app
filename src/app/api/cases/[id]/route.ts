import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/cases/:id — fetch a single case
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const caseLog = await db.caseLog.findUnique({ where: { id } });

  if (!caseLog || caseLog.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(caseLog);
}

/**
 * PATCH /api/cases/:id — update a case
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const existing = await db.caseLog.findUnique({ where: { id } });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();

  // Whitelist — only allow known fields to be updated
  const allowedFields = [
    'procedureName', 'procedureCategory', 'surgicalApproach', 'role',
    'autonomyLevel', 'difficultyScore', 'operativeDurationMinutes',
    'consoleTimeMinutes', 'dockingTimeMinutes', 'attendingLabel',
    'institutionSite', 'patientAgeBin', 'diagnosisCategory',
    'outcomeCategory', 'complicationCategory', 'conversionOccurred',
    'notes', 'reflection', 'tags', 'isPublic', 'benchmarkOptIn', 'caseDate',
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = field === 'caseDate' ? new Date(body[field]) : body[field];
    }
  }

  const updated = await db.caseLog.update({ where: { id }, data: updateData });

  void logAudit({
    userId: user.id,
    action: 'case.update',
    entityType: 'CaseLog',
    entityId: id,
    before: existing,
    after: updated,
    metadata: { fieldsChanged: Object.keys(updateData) },
    req,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/cases/:id — delete a case
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const existing = await db.caseLog.findUnique({ where: { id } });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.caseLog.delete({ where: { id } });

  void logAudit({
    userId: user.id,
    action: 'case.delete',
    entityType: 'CaseLog',
    entityId: id,
    before: existing,
    req,
  });

  return NextResponse.json({ success: true });
}
