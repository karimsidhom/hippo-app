import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Stripe webhook handler.
 *
 * Events handled:
 *   checkout.session.completed     → mark the Profile as Pro (or lifetime)
 *   customer.subscription.updated  → sync status / period / cancel flag
 *   customer.subscription.deleted  → downgrade to free
 *   invoice.payment_failed         → mark past_due
 *
 * This is the ONLY writer of Profile.tier / subscriptionStatus /
 * stripeCustomerId / stripeSubscriptionId / currentPeriodEnd /
 * cancelAtPeriodEnd. The client only ever reads these through
 * /api/subscription.
 */

async function findProfileUserId(
  stripe: import('stripe').Stripe,
  session: import('stripe').Stripe.Checkout.Session
): Promise<string | null> {
  // 1) metadata.userId (set by our own checkout route)
  const metaUserId = session.metadata?.userId;
  if (metaUserId) {
    const profile = await db.profile.findUnique({ where: { userId: metaUserId }, select: { userId: true } });
    if (profile) return profile.userId;
  }

  // 2) client_reference_id (also set by our checkout route, belt and suspenders)
  if (session.client_reference_id) {
    const profile = await db.profile.findUnique({
      where: { userId: session.client_reference_id },
      select: { userId: true },
    });
    if (profile) return profile.userId;
  }

  // 3) customer email, case-insensitive
  let email = session.customer_email ?? session.customer_details?.email ?? null;
  if (!email && typeof session.customer === 'string') {
    try {
      const customer = await stripe.customers.retrieve(session.customer);
      if (customer && !('deleted' in customer)) email = customer.email ?? null;
    } catch {
      // ignore — fall through with no email
    }
  }
  if (email) {
    const user = await db.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (user) return user.id;
  }

  return null;
}

async function findProfileBySubscription(subscriptionId: string, customerId: string | null) {
  const bySub = await db.profile.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
  if (bySub) return bySub;
  if (customerId) {
    return db.profile.findFirst({ where: { stripeCustomerId: customerId } });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' as any });

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: import('stripe').Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session;
        const userId = await findProfileUserId(stripe, session);

        if (!userId) {
          console.error('checkout.session.completed: no matching Profile for session', session.id);
          break;
        }

        const customerId = typeof session.customer === 'string' ? session.customer : null;
        const isLifetime = session.mode === 'payment';

        await db.profile.update({
          where: { userId },
          data: isLifetime
            ? {
                tier: 'pro',
                subscriptionStatus: 'lifetime',
                stripeCustomerId: customerId,
                stripeSubscriptionId: null,
                cancelAtPeriodEnd: false,
              }
            : {
                tier: 'pro',
                subscriptionStatus: 'active',
                stripeCustomerId: customerId,
                stripeSubscriptionId:
                  typeof session.subscription === 'string' ? session.subscription : null,
              },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as import('stripe').Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : null;
        const profile = await findProfileBySubscription(sub.id, customerId);

        if (!profile) {
          console.error('customer.subscription.updated: no matching Profile for subscription', sub.id);
          break;
        }

        const currentPeriodEndUnix = (sub as unknown as { current_period_end?: number }).current_period_end;

        await db.profile.update({
          where: { userId: profile.userId },
          data: {
            subscriptionStatus: sub.status,
            currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000) : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: customerId ?? profile.stripeCustomerId,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : null;
        const profile = await findProfileBySubscription(sub.id, customerId);

        if (!profile) {
          console.error('customer.subscription.deleted: no matching Profile for subscription', sub.id);
          break;
        }

        await db.profile.update({
          where: { userId: profile.userId },
          data: {
            tier: 'free',
            subscriptionStatus: 'canceled',
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : null;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;

        const profile = subscriptionId
          ? await findProfileBySubscription(subscriptionId, customerId)
          : customerId
            ? await db.profile.findFirst({ where: { stripeCustomerId: customerId } })
            : null;

        if (!profile) {
          console.error('invoice.payment_failed: no matching Profile for invoice', invoice.id);
          break;
        }

        await db.profile.update({
          where: { userId: profile.userId },
          data: { subscriptionStatus: 'past_due' },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice;
        console.log('Payment succeeded:', invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
