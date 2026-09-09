'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { PRICING } from '@/lib/pricing';
import { useSubscription } from '@/context/SubscriptionContext';

// ---------------------------------------------------------------------------
// /upgrade — real Pro pricing page.
//
// Shows Hippo Pro (monthly) and, only when a live Stripe price id is
// configured for it, a one-time Lifetime option. Both go through
// startCheckout, which hits /api/stripe/checkout server-side.
// ---------------------------------------------------------------------------

export default function UpgradePage() {
  const { isPro, startCheckout } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'lifetime' | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const hasLifetime = Boolean(PRICING.lifetime.stripePriceId);

  async function handleUpgrade(plan: 'monthly' | 'lifetime') {
    setCheckoutError(null);
    setLoadingPlan(plan);
    try {
      await startCheckout(plan);
    } catch (err) {
      setCheckoutError(
        err instanceof Error && err.message.toLowerCase().includes('not switched on')
          ? 'Payments are not switched on yet. Check back soon.'
          : 'Could not start checkout. Please try again.'
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060d13',
        color: '#E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 16px 48px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '20px 0 12px',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#64748B',
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </nav>

      <div style={{ width: '100%', maxWidth: 480, marginTop: 16 }}>
        {/* Hero */}
        <div
          style={{
            padding: '24px 22px 20px',
            borderRadius: 16,
            border: '1px solid rgba(14,165,233,0.3)',
            background:
              'linear-gradient(135deg, rgba(14,165,233,0.10), rgba(16,185,129,0.07))',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(14,165,233,0.18)',
              color: '#0EA5E9',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <Sparkles size={11} /> Hippo Pro
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              color: '#F1F5F9',
              marginBottom: 10,
            }}
          >
            {isPro ? 'You are already on Pro.' : 'Unlock everything Hippo can do.'}
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: '#94A3B8' }}>
            {isPro
              ? 'Manage your plan from Settings, then Subscription.'
              : PRICING.pro.description}
          </p>
        </div>

        {!isPro && (
          <>
            {/* Monthly plan */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: 14,
                border: '1px solid #1f1f23',
                background: '#111113',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>
                  {PRICING.pro.monthlyDisplay}
                </span>
                <span style={{ fontSize: 13, color: '#64748B' }}>/month, cancel any time</span>
              </div>
              <button
                onClick={() => handleUpgrade('monthly')}
                disabled={loadingPlan !== null}
                style={{
                  width: '100%',
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 20px',
                  borderRadius: 10,
                  background: '#0EA5E9',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingPlan ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: loadingPlan && loadingPlan !== 'monthly' ? 0.6 : 1,
                }}
              >
                <Zap size={14} />
                {loadingPlan === 'monthly' ? 'Redirecting...' : `Start Pro, ${PRICING.pro.monthlyDisplay}/month`}
              </button>
            </div>

            {/* Lifetime plan, only shown once a live price id exists */}
            {hasLifetime && (
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 14,
                  border: '1px solid #1f1f23',
                  background: '#111113',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em' }}>
                    {PRICING.lifetime.oneTimeDisplay}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>once, {PRICING.lifetime.tagline.toLowerCase()}</span>
                </div>
                <button
                  onClick={() => handleUpgrade('lifetime')}
                  disabled={loadingPlan !== null}
                  style={{
                    width: '100%',
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '13px 20px',
                    borderRadius: 10,
                    background: 'transparent',
                    color: '#F1F5F9',
                    border: '1px solid #27272a',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loadingPlan ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: loadingPlan && loadingPlan !== 'lifetime' ? 0.6 : 1,
                  }}
                >
                  {loadingPlan === 'lifetime' ? 'Redirecting...' : `Lifetime Pro, ${PRICING.lifetime.oneTimeDisplay} once`}
                </button>
              </div>
            )}

            {checkoutError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#F59E0B',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {checkoutError}
              </div>
            )}
          </>
        )}

        {/* Feature list */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            border: '1px solid #1f1f23',
            background: '#111113',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64748B',
              marginBottom: 14,
            }}
          >
            Pro includes
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {PRICING.pro.features.map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13.5,
                  color: '#D4D4D8',
                }}
              >
                <Check size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 22px',
              borderRadius: 10,
              background: 'transparent',
              color: '#64748B',
              border: '1px solid #1f1f23',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {isPro ? 'Back to dashboard' : 'Not now, take me back'}
          </Link>
        </div>
      </div>
    </div>
  );
}
