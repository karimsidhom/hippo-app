import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const referral = await db.growthReferral.upsert({
    where: { ownerUserId: auth.user.id },
    create: { ownerUserId: auth.user.id, code: randomBytes(8).toString("base64url") },
    update: {},
  });

  return NextResponse.json({
    url: `https://hippomedicine.com/r/${referral.code}`,
    clicks: referral.clicks,
    signups: referral.signups,
  });
}
