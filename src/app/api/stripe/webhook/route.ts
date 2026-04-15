import { NextRequest, NextResponse } from 'next/server';

/**
 * Stripe webhook handler.
 *
 * Events handled:
 *   checkout.session.completed    → mark user as Pro
 *   customer.subscription.updated → sync status changes
 *   customer.subscription.deleted → downgrade to free
 *   invoice.payment_failed        → mark past_due
 *
 * In production: persist these to DB via Prisma.
 * In MVP: events are logged; client reads from localStorage.
 */
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
        console.log('✅ Checkout completed:', session.id);
        // TODO (production): find user by session.customer_email,
        // update DB: { tier: 'pro', stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as import('stripe').Stripe.Subscription;
        console.log('🔄 Subscription updated:', sub.id, sub.status);
        // TODO (production): update user subscription status in DB
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription;
        console.log('❌ Subscription canceled:', sub.id);
        // TODO (production): downgrade user to free in DB
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice;
        console.log('💳 Payment failed for customer:', invoice.customer);
        // TODO (production): send payment failed email, mark past_due
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice;
        console.log('💰 Payment succeeded:', invoice.id);
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
