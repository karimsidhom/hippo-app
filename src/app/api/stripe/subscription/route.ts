import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET  /api/stripe/subscription?id=sub_xxx
//   Retrieves a subscription straight from Stripe. Restricted to the
//   caller's own subscription id (verified against their Profile) so one
//   user can't probe another user's billing state.
//
// POST /api/stripe/subscription  { sessionId }
//   Fallback sync path used by /upgrade/success when the checkout redirect
//   lands before the webhook has processed. Retrieves the Checkout Session
//   directly from Stripe, verifies it belongs to this app and this caller,
//   and writes tier/status/customer/subscription ids onto the caller's own
//   Profile — the same effect the webhook would have had.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing subscription id' }, { status: 400 });

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { stripeSubscriptionId: true },
  });
  if (!profile?.stripeSubscriptionId || profile.stripeSubscriptionId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return NextResponse.json({ error: 'Payments are not switched on yet.' }, { status: 503 });

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' as any });

    const sub = await stripe.subscriptions.retrieve(id);
    const currentPeriodEndUnix = (sub as unknown as { current_period_end?: number }).current_period_end;

    return NextResponse.json({
      status: sub.status,
      tier: (sub.metadata?.tier ?? 'pro') as string,
      currentPeriodEnd: currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000).toISOString() : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return NextResponse.json({ error: 'Payments are not switched on yet.' }, { status: 503 });

  try {
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' as any });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer_details'],
    });

    if (session.metadata?.app !== 'hippo') {
      return NextResponse.json({ error: 'Session does not belong to this app' }, { status: 403 });
    }

    const sessionEmail = (session.customer_email ?? session.customer_details?.email ?? '').toLowerCase();
    if (!sessionEmail || sessionEmail !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Session does not belong to this account' }, { status: 403 });
    }

    const customerId = typeof session.customer === 'string' ? session.customer : null;
    const isLifetime = session.mode === 'payment';

    await db.profile.update({
      where: { userId: user.id },
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
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
          },
    });

    return NextResponse.json({ synced: true });
  } catch (err: any) {
    console.error('Session sync error:', err);
    return NextResponse.json({ error: err.message ?? 'Sync failed' }, { status: 500 });
  }
}
