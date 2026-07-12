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

  const price = process.env.STRIPE_PROGRAM_PRICE_ID;
  if (!price) return NextResponse.json({ error: "Program billing is not configured" }, { status: 503 });

  try {
    const stripe = getStripe();
    const billing = await db.programSubscription.findUnique({ where: { programId } });
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://hippomedicine.com";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer: billing?.stripeCustomerId,
      customer_email: billing ? undefined : auth.user.email,
      allow_promotion_codes: true,
      success_url: `${origin}/programs?billing=success`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
      metadata: { app: "hippo", programId },
      subscription_data: { metadata: { app: "hippo", programId } },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Program checkout failed", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
