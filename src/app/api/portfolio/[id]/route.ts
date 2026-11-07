import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateNotes, scrubNotes } from "@/lib/phia";

/** PATCH /api/portfolio/:id — update portfolio case */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const existing = await db.portfolioCase.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // PHIA check description if updated
  let description = body.description;
  if (description !== undefined && description !== null) {
    description = description.trim() || null;
    if (description) {
      const { safe, warnings } = validateNotes(description);
      if (!safe) {
        return NextResponse.json({ error: "Description contains PHI", warnings }, { status: 422 });
      }
      description = scrubNotes(description);
    }
  }

  const updated = await db.portfolioCase.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(description !== undefined && { description }),
      ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      ...(body.isMilestone !== undefined && { isMilestone: body.isMilestone }),
      ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
    },
  });

  return NextResponse.json(updated);
}

/** DELETE /api/portfolio/:id — remove from portfolio */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.portfolioCase.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.portfolioCase.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
