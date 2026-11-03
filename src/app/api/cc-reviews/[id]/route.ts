import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import type { CCDecision, CCReviewStatus } from "@prisma/client";
import { roleCanFinaliseCC, roleIsProgramStaff } from "@/lib/program-auth";

// ---------------------------------------------------------------------------
// /api/cc-reviews/[id]
//   GET    — full review payload + member notes.
//   PATCH  — chair finalises, or in-progress edits to summary fields.
//   POST   (path: [id]/notes) handled in ./notes/route.ts
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

async function ensureAccess(reviewId: string, userId: string) {
  const review = await db.cCReview.findUnique({
    where: { id: reviewId },
    include: { program: { select: { id: true } } },
  });
  if (!review) return { review: null, error: "not_found" as const };

  if (review.residentId === userId) {
    return { review, role: "resident" as const };
  }

  // Staff only. Any other member, another resident included, is refused:
  // membership alone used to be enough to read and edit anyone's review.
  const member = await db.programMember.findFirst({
    where: { programId: review.programId, userId },
  });
  if (!member || !roleIsProgramStaff(member.role)) return { review, error: "forbidden" as const };
  return { review, role: roleCanFinaliseCC(member.role) ? ("chair" as const) : ("staff" as const) };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const { review, error: accessError } = await ensureAccess(id, user.id);
  if (accessError === "not_found")
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (accessError === "forbidden")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const full = await db.cCReview.findUnique({
    where: { id },
    include: {
      resident: {
        select: { id: true, name: true, email: true, image: true },
      },
      finalisedBy: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      notes: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ review: full });
}

interface PatchBody {
  decision?: CCDecision;
  decisionRationale?: string;
  chairSummary?: string;
  dissent?: string;
  cycleLabel?: string;
  status?: CCReviewStatus;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await ctx.params;
  const access = await ensureAccess(id, user.id);
  if (access.error === "not_found")
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (access.error === "forbidden" || access.role === "resident") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Finalising, reopening or archiving is the director's or chair's call;
  // every other staff member edits the working fields.
  if (body.status !== undefined && access.role !== "chair") {
    return NextResponse.json(
      { error: "Only the program director or chair can finalise, reopen or archive a CC review." },
      { status: 403 },
    );
  }

  const data: Record<string, unknown> = {};
  if (body.decision !== undefined) data.decision = body.decision;
  if (body.decisionRationale !== undefined)
    data.decisionRationale = body.decisionRationale.trim() || null;
  if (body.chairSummary !== undefined)
    data.chairSummary = body.chairSummary.trim() || null;
  if (body.dissent !== undefined) data.dissent = body.dissent.trim() || null;
  if (body.cycleLabel !== undefined)
    data.cycleLabel = body.cycleLabel.trim() || null;
  if (body.status === "FINALISED") {
    data.status = "FINALISED";
    data.finalisedAt = new Date();
    data.finalisedById = user.id;
  } else if (body.status === "ARCHIVED") {
    data.status = "ARCHIVED";
  } else if (body.status === "IN_PROGRESS") {
    data.status = "IN_PROGRESS";
    data.finalisedAt = null;
    data.finalisedById = null;
  }

  const updated = await db.cCReview.update({
    where: { id },
    data,
  });

  return NextResponse.json({ review: updated });
}
