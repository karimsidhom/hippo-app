import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { validateNotes, scrubNotes } from "@/lib/phia";

/** GET /api/portfolio?userId=xxx — list portfolio cases */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const items = await db.portfolioCase.findMany({
    where: { userId },
    include: {
      caseLog: {
        select: {
          procedureName: true,
          surgicalApproach: true,
          autonomyLevel: true,
          operativeDurationMinutes: true,
          outcomeCategory: true,
          caseDate: true,
        },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

/** POST /api/portfolio — add a case to portfolio */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { caseLogId, title, description, isFeatured, isMilestone } = await req.json();

  if (!caseLogId || !title?.trim()) {
    return NextResponse.json({ error: "caseLogId and title required" }, { status: 400 });
  }

  // Verify case belongs to user
  const caseLog = await db.caseLog.findFirst({
    where: { id: caseLogId, userId: user.id },
  });
  if (!caseLog) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Check for duplicate
  const existing = await db.portfolioCase.findUnique({ where: { caseLogId } });
  if (existing) {
    return NextResponse.json({ error: "Case already in portfolio" }, { status: 409 });
  }

  // PHIA validation on description
  let safeDescription = description?.trim() || null;
  if (safeDescription) {
    const { safe, warnings } = validateNotes(safeDescription);
    if (!safe) {
      return NextResponse.json({ error: "Description contains PHI", warnings }, { status: 422 });
    }
    safeDescription = scrubNotes(safeDescription);
  }

  const item = await db.portfolioCase.create({
    data: {
      userId: user.id,
      caseLogId,
      title: title.trim(),
      description: safeDescription,
      isFeatured: isFeatured || false,
      isMilestone: isMilestone || false,
    },
    include: {
      caseLog: {
        select: {
          procedureName: true,
          surgicalApproach: true,
          autonomyLevel: true,
          operativeDurationMinutes: true,
          outcomeCategory: true,
          caseDate: true,
        },
      },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
