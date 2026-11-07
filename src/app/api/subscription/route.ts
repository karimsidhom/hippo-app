import { NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import type { PricingTier } from "@/lib/pricing";

// ---------------------------------------------------------------------------
// /api/subscription
//   GET — server-side source of truth for the caller's subscription state.
//         Everything the client shows (Pro badge, gated UI, Sidebar label)
//         reads from here through SubscriptionContext. The Stripe webhook
//         is the only writer of these fields on the Profile.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

/** Statuses that keep Pro access live, including a payment-retry grace period. */
const ACTIVE_STATUSES = new Set(["active", "trialing", "comped", "past_due", "lifetime"]);

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  // Emergency kill switch: restores beta-style "everyone is Pro" without a
  // code deploy. Set HIPPO_BETA_UNLOCK_ALL=1 in Vercel to flip it on.
  if (process.env.HIPPO_BETA_UNLOCK_ALL === "1") {
    return NextResponse.json({
      tier: "pro" as PricingTier,
      status: "comped",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      isPro: true,
      betaUnlock: true,
    });
  }

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: {
      tier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  const tier = (profile?.tier ?? "free") as PricingTier;
  const status = profile?.subscriptionStatus ?? null;

  const isPro =
    tier === "institution" ||
    (tier === "pro" && (status !== null && ACTIVE_STATUSES.has(status)));

  return NextResponse.json({
    tier,
    status,
    currentPeriodEnd: profile?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: profile?.cancelAtPeriodEnd ?? false,
    stripeCustomerId: profile?.stripeCustomerId ?? null,
    stripeSubscriptionId: profile?.stripeSubscriptionId ?? null,
    isPro,
  });
}
