import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { REFERRAL_COOKIE } from "@/lib/growth/attribution";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referral = await db.growthReferral.findUnique({ where: { code }, select: { code: true } });
  const destination = new URL(referral ? "/signup?ref=resident" : "/signup", request.url);
  const response = NextResponse.redirect(destination);

  if (referral) {
    await Promise.all([
      db.growthReferral.update({ where: { code }, data: { clicks: { increment: 1 } } }),
      db.growthEvent.create({ data: { name: "referral_click", path: `/r/${code}`, referralCode: code, source: "resident_referral", medium: "share" } }),
    ]);
    response.cookies.set(REFERRAL_COOKIE, code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}
