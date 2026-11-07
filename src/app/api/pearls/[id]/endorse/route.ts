import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// Attending "co-sign" on a pearl. The social moat: verified attendings
// elevate good content. Gated here at the API so the UI cannot bypass —
// residents calling this endpoint get a 403.
const ENDORSER_ROLES = new Set(["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"]);

async function isEndorser(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    select: { roleType: true },
  });
  return !!profile && ENDORSER_ROLES.has(profile.roleType);
}

async function resync(pearlId: string) {
  const count = await db.pearlEndorsement.count({ where: { pearlId } });
  await db.pearl.update({
    where: { id: pearlId },
    data: { endorseCount: count },
  });
  return count;
}

/** POST /api/pearls/:id/endorse — attending adds a co-sign */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  if (!(await isEndorser(user.id))) {
    return NextResponse.json(
      { error: "Only attending/staff/PD can endorse pearls" },
      { status: 403 },
    );
  }

  await db.pearlEndorsement.upsert({
    where: { pearlId_userId: { pearlId: id, userId: user.id } },
    create: { pearlId: id, userId: user.id },
    update: {},
  });

  const count = await resync(id);
  return NextResponse.json({ ok: true, endorseCount: count });
}

/** DELETE /api/pearls/:id/endorse — remove co-sign */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  await db.pearlEndorsement.deleteMany({
    where: { pearlId: id, userId: user.id },
  });

  const count = await resync(id);
  return NextResponse.json({ ok: true, endorseCount: count });
}

/** GET /api/pearls/:id/endorse — list endorsers (up to 10) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const list = await db.pearlEndorsement.findMany({
    where: { pearlId: id },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { specialty: true, roleType: true } },
        },
      },
    },
  });

  return NextResponse.json({ endorsers: list.map((e) => e.user) });
}
