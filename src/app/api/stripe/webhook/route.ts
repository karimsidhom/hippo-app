import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

function periodEnd(subscription: Stripe.Subscription) {
  const seconds = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const programId = subscription.metadata.programId;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const existing = programId
    ? await db.programSubscription.findUnique({ where: { programId } })
    : await db.programSubscription.findUnique({ where: { stripeCustomerId: customerId } });
  const resolvedProgramId = programId || existing?.programId;
  if (!resolvedProgramId) return;

  await db.programSubscription.upsert({
    where: { programId: resolvedProgramId },
    create: {
      programId: resolvedProgramId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodEnd: periodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodEnd: periodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
  const institutionActive = subscription.status === "active" || subscription.status === "trialing" || subscription.status === "past_due";
  await db.institutionalProcurement.updateMany({
    where: { programId: resolvedProgramId, agreementAcceptedAt: { not: null } },
    data: institutionActive
      ? { status: "ACTIVE", activatedAt: new Date() }
      : { status: "AGREEMENT_ACCEPTED", activatedAt: null },
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!webhookSecret) return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  if (!signature) return NextResponse.json({ error: "Stripe signature is required" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature failed", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    await db.stripeWebhookEvent.create({ data: { eventId: event.id, eventType: event.type } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const programId = session.metadata?.programId;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (programId && customerId) {
        await db.programSubscription.upsert({
          where: { programId },
          create: { programId, stripeCustomerId: customerId, stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id, status: "active" },
          update: { stripeCustomerId: customerId, stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id },
        });
        await db.institutionalProcurement.updateMany({
          where: { programId, agreementAcceptedAt: { not: null } },
          data: { status: "ACTIVE", activatedAt: new Date() },
        });
      }
    }
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    await db.stripeWebhookEvent.delete({ where: { eventId: event.id } }).catch(() => undefined);
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
