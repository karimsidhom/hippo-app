import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateNotes, scrubNotes } from "@/lib/phia";

// ---------------------------------------------------------------------------
// Pearl (social post) CRUD + feed.
//
// Feed modes (?feed=...):
//   following  — posts from users I follow + my own
//   specialty  — posts from users in my specialty (discovery)
//   all        — everything public (fallback / explore)
//   featured   — curated seed posts shown in the empty state
//
// New fields in POST body (v2):
//   isAnonymous  — strip name/avatar/institution on display
//   pollOptions  — array of {id,label} for postType=poll
// ---------------------------------------------------------------------------

const AUTHOR_SELECT = {
  select: {
    id: true,
    name: true,
    image: true,
    profile: {
      select: {
        specialty: true,
        trainingYearLabel: true,
        roleType: true,
        institution: true,
      },
    },
  },
} as const;

// Strip identifying author fields when the post is marked anonymous. We keep
// specialty + PGY so the label still reads "PGY-3 General Surgery · Canada"
// — useful signal without identity.
function anonymizeIfNeeded<T extends { isAnonymous: boolean; author: { id: string; name: string | null; image: string | null; profile: { specialty: string | null; trainingYearLabel: string | null; roleType: string; institution: string | null } | null } }>(pearl: T) {
  if (!pearl.isAnonymous) return pearl;
  return {
    ...pearl,
    author: {
      id: "anonymous",
      name: null,
      image: null,
      profile: pearl.author.profile
        ? {
            specialty: pearl.author.profile.specialty,
            trainingYearLabel: pearl.author.profile.trainingYearLabel,
            roleType: pearl.author.profile.roleType,
            institution: null,
          }
        : null,
    },
  };
}

/** GET /api/pearls?authorId=xxx
 *  GET /api/pearls?feed=following|specialty|all|featured
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const authorId = req.nextUrl.searchParams.get("authorId");
  const feed = req.nextUrl.searchParams.get("feed");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);

  let where: Record<string, unknown> = {
    isPublished: true,
    ...(authorId && { authorId }),
  };

  if (feed === "following" || feed === "true") {
    const followedIds = await db.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });
    const ids = followedIds.map((f) => f.followingId);
    ids.push(user.id);
    where = { isPublished: true, authorId: { in: ids } };
  } else if (feed === "specialty") {
    const me = await db.profile.findUnique({
      where: { userId: user.id },
      select: { specialty: true },
    });
    if (me?.specialty) {
      where = {
        isPublished: true,
        author: { profile: { specialty: me.specialty } },
      };
    }
  } else if (feed === "featured") {
    where = { isPublished: true, isFeatured: true };
  }
  // feed=all or missing → everything public

  const pearls = await db.pearl.findMany({
    where,
    include: {
      author: AUTHOR_SELECT,
      likes: { where: { userId: user.id }, select: { id: true } },
      saves: { where: { userId: user.id }, select: { id: true } },
      reactions: { where: { userId: user.id }, select: { kind: true } },
      endorsements: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = pearls.length > limit;
  const items = pearls.slice(0, limit).map((p) => {
    const anonymized = anonymizeIfNeeded(p);
    return {
      ...anonymized,
      liked: p.likes.length > 0,
      saved: p.saves.length > 0,
      endorsedByMe: p.endorsements.length > 0,
      myReactions: p.reactions.map((r) => r.kind),
      likes: undefined,
      saves: undefined,
      reactions: undefined,
      endorsements: undefined,
    };
  });

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

/** POST /api/pearls — create a post */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const {
    procedureName,
    category,
    title,
    content,
    tags,
    postType,
    imageUrl,
    linkUrl,
    linkedCaseId,
    isAnonymous,
    pollOptions,
  } = body as {
    procedureName?: string;
    category?: string;
    title?: string;
    content?: string;
    tags?: string[];
    postType?: string;
    imageUrl?: string;
    linkUrl?: string;
    linkedCaseId?: string;
    isAnonymous?: boolean;
    pollOptions?: Array<{ id: string; label: string }>;
  };

  if (!procedureName?.trim() || !title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "procedureName, title, and content are required" },
      { status: 400 },
    );
  }

  const validPostTypes = ["pearl", "case_share", "research", "discussion", "poll"];
  const resolvedPostType = validPostTypes.includes(postType ?? "") ? (postType as string) : "pearl";

  // Poll validation — must have 2-4 options, each with an id+label.
  let resolvedPollOptions: Array<{ id: string; label: string }> | null = null;
  if (resolvedPostType === "poll") {
    if (!Array.isArray(pollOptions) || pollOptions.length < 2 || pollOptions.length > 4) {
      return NextResponse.json(
        { error: "Poll requires 2-4 options" },
        { status: 400 },
      );
    }
    resolvedPollOptions = pollOptions
      .filter((o) => o && typeof o.label === "string" && o.label.trim().length > 0)
      .slice(0, 4)
      .map((o, i) => ({
        id: typeof o.id === "string" && o.id ? o.id : `opt-${i}`,
        label: o.label.trim().slice(0, 80),
      }));
    if (resolvedPollOptions.length < 2) {
      return NextResponse.json({ error: "Poll requires 2-4 non-empty options" }, { status: 400 });
    }
  }

  const titleResult = validateNotes(title);
  const contentResult = validateNotes(content);
  if (!titleResult.safe || !contentResult.safe) {
    return NextResponse.json(
      {
        error: "Content contains potential PHI — please revise",
        warnings: [...titleResult.warnings, ...contentResult.warnings],
      },
      { status: 422 },
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
      postType: resolvedPostType,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      linkedCaseId: linkedCaseId || null,
      isAnonymous: Boolean(isAnonymous),
      pollOptions: resolvedPollOptions ?? undefined,
    },
    include: { author: AUTHOR_SELECT },
  });

  const shaped = anonymizeIfNeeded({ ...pearl, endorsements: [] as Array<{ id: string }> } as unknown as Parameters<typeof anonymizeIfNeeded>[0]);
  return NextResponse.json(
    {
      ...shaped,
      liked: false,
      saved: false,
      endorsedByMe: false,
      myReactions: [] as string[],
      commentCount: 0,
    },
    { status: 201 },
  );
}
