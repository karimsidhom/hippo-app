import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// /api/cc-reviews/[id]/notes
//   POST   — append a note from the calling member.
//   DELETE — remove a note (only the original author).
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

interface CreateNoteBody {
  body?: string;
  category?: string;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const review = await db.cCReview.findUnique({
    where: { id },
    select: { id: true, programId: true, status: true },
  });
  if (!review)
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.status === "FINALISED" || review.status === "ARCHIVED") {
    return NextResponse.json(
      { error: "Notes are locked once the review is finalised." },
      { status: 409 },
    );
  }

  const member = await db.programMember.findFirst({
    where: { programId: review.programId, userId: user.id },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: CreateNoteBody;
  try {
    body = (await req.json()) as CreateNoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.body || !body.body.trim()) {
    return NextResponse.json({ error: "Note body required" }, { status: 400 });
  }

  const created = await db.cCReviewNote.create({
    data: {
      reviewId: id,
      authorId: user.id,
      body: body.body.trim(),
      category: body.category?.trim() || null,
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ note: created });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const noteId = req.nextUrl.searchParams.get("noteId");
  if (!noteId)
    return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const note = await db.cCReviewNote.findUnique({
    where: { id: noteId },
  });
  if (!note || note.reviewId !== id) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }
  if (note.authorId !== user.id) {
    return NextResponse.json(
      { error: "Only the original author can remove their note." },
      { status: 403 },
    );
  }

  await db.cCReviewNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
