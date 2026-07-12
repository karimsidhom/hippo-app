import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { isProgramOwner } from "@/lib/program-auth";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { programId } = await req.json().catch(() => ({}));
  if (typeof programId !== "string" || !(await isProgramOwner(auth.user.id, programId))) {
    return NextResponse.json({ error: "Program owner access required" }, { status: 403 });
  }

  const billing = await db.programSubscription.findUnique({ where: { programId } });
  if (!billing) return NextResponse.json({ error: "No billing account found" }, { status: 404 });

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://hippomedicine.com";
    const session = await getStripe().billingPortal.sessions.create({ customer: billing.stripeCustomerId, return_url: `${origin}/programs` });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Program billing portal failed", error);
    return NextResponse.json({ error: "Unable to open billing portal" }, { status: 500 });
  }
}
