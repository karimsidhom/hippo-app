import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { PRICING } from '@/lib/pricing';

// ---------------------------------------------------------------------------
// POST /api/stripe/checkout
//
// Creates a Stripe Checkout Session for the authenticated caller. The
// customer email and user id are attached server-side from the session,
// never trusted from the request body, so the webhook can always tie the
// completed payment back to the right Profile.
// ---------------------------------------------------------------------------

type Plan = 'monthly' | 'yearly' | 'lifetime';

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  try {
    const body = await req.json().catch(() => ({}));
    const { successUrl, cancelUrl } = body as { successUrl?: string; cancelUrl?: string };
    const plan: Plan = body.plan === 'yearly' || body.plan === 'lifetime' ? body.plan : 'monthly';

    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json(
        { error: 'Payments are not switched on yet.' },
        { status: 503 }
      );
    }

    let priceId: string;
    let mode: 'subscription' | 'payment';
    if (plan === 'lifetime') {
      priceId = PRICING.lifetime.stripePriceId;
      mode = 'payment';
    } else if (plan === 'yearly') {
      priceId = PRICING.pro.stripeYearlyPriceId;
      mode = 'subscription';
    } else {
      priceId = PRICING.pro.stripePriceId;
      mode = 'subscription';
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Payments are not switched on yet.' },
        { status: 503 }
      );
    }

    // Dynamically import stripe to avoid build errors when key is missing
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' as any });

    const sessionParams: import('stripe').Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        app: 'hippo',
        tier: 'pro',
        userId: user.id,
        plan,
      },
    };

    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          app: 'hippo',
          tier: 'pro',
          userId: user.id,
          plan,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Checkout failed' },
      { status: 500 }
    );
  }
}
