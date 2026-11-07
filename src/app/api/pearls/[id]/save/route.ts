import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/** POST /api/pearls/:id/save — save a pearl */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  await db.pearlSave.upsert({
    where: { pearlId_userId: { pearlId: id, userId: user.id } },
    create: { pearlId: id, userId: user.id },
    update: {},
  });

  const count = await db.pearlSave.count({ where: { pearlId: id } });
  await db.pearl.update({ where: { id }, data: { saveCount: count } });

  return NextResponse.json({ ok: true, saveCount: count });
}

/** DELETE /api/pearls/:id/save — unsave a pearl */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  await db.pearlSave.deleteMany({
    where: { pearlId: id, userId: user.id },
  });

  const count = await db.pearlSave.count({ where: { pearlId: id } });
  await db.pearl.update({ where: { id }, data: { saveCount: count } });

  return NextResponse.json({ ok: true, saveCount: count });
}
