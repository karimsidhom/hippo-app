import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateNotes, scrubNotes } from "@/lib/phia";

/** GET /api/pearls/[id]/comments — paginated comments for a pearl */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: pearlId } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);

  const comments = await db.pearlComment.findMany({
    where: { pearlId },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = comments.length > limit;
  const items = comments.slice(0, limit);

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

/** POST /api/pearls/[id]/comments — add a comment */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id: pearlId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // PHIA scrub comment content
  const result = validateNotes(content);
  if (!result.safe) {
    return NextResponse.json(
      { error: "Comment contains potential PHI — please revise", warnings: result.warnings },
      { status: 422 }
    );
  }

  // Verify the pearl exists
  const pearl = await db.pearl.findUnique({ where: { id: pearlId } });
  if (!pearl) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Create comment and increment count in a transaction
  const [comment] = await db.$transaction([
    db.pearlComment.create({
      data: {
        pearlId,
        authorId: user.id,
        content: scrubNotes(content.trim()),
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
    db.pearl.update({
      where: { id: pearlId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json(comment, { status: 201 });
}
