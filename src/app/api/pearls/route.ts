import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateNotes, scrubNotes } from "@/lib/phia";

/** GET /api/pearls?authorId=xxx — list pearls, optionally filtered by author */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const authorId = req.nextUrl.searchParams.get("authorId");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);

  const where = {
    isPublished: true,
    ...(authorId && { authorId }),
  };

  const pearls = await db.pearl.findMany({
    where,
    include: {
      author: {
        select: {
          id: true, name: true, image: true,
          profile: { select: { specialty: true, trainingYearLabel: true } },
        },
      },
      likes: { where: { userId: user.id }, select: { id: true } },
      saves: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = pearls.length > limit;
  const items = pearls.slice(0, limit).map((p) => ({
    ...p,
    liked: p.likes.length > 0,
    saved: p.saves.length > 0,
    likes: undefined,
    saves: undefined,
  }));

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

/** POST /api/pearls — create a pearl */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { procedureName, category, title, content, tags } = await req.json();

  if (!procedureName?.trim() || !title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "procedureName, title, and content are required" },
      { status: 400 }
    );
  }

  // PHIA scrub title and content
  const titleResult = validateNotes(title);
  const contentResult = validateNotes(content);

  if (!titleResult.safe || !contentResult.safe) {
    return NextResponse.json(
      {
        error: "Content contains potential PHI — please revise",
        warnings: [...titleResult.warnings, ...contentResult.warnings],
      },
      { status: 422 }
    );
  }

  const pearl = await db.pearl.create({
    data: {
      authorId: user.id,
      procedureName: procedureName.trim(),
      category: category || null,
      title: scrubNotes(title.trim()),
      content: scrubNotes(content.trim()),
      tags: tags || [],
    },
    include: {
      author: {
        select: {
          id: true, name: true, image: true,
          profile: { select: { specialty: true, trainingYearLabel: true } },
        },
      },
    },
  });

  return NextResponse.json({ ...pearl, liked: false, saved: false }, { status: 201 });
}
