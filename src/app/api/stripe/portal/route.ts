import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ensureDbUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// POST /api/stripe/portal
//
// Opens a Stripe Billing Portal session for the authenticated caller's own
// Stripe customer. The customer id is looked up server-side from the
// caller's Profile, never trusted from the request body.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  try {
    const { returnUrl } = await req.json().catch(() => ({}));

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
      select: { stripeCustomerId: true },
    });

    if (!profile?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account on file' }, { status: 404 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Payments are not switched on yet.' }, { status: 503 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' as any });

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Billing portal error:', err);
    return NextResponse.json({ error: err.message ?? 'Portal failed' }, { status: 500 });
  }
}
