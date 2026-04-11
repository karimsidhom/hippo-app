import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing subscription id' }, { status: 400 });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' as any });

    const sub = await stripe.subscriptions.retrieve(id);

    return NextResponse.json({
      status: sub.status,
      tier: (sub.metadata?.tier ?? 'pro') as string,
      currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
