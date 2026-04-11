'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowLeft, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { PRICING } from '@/lib/pricing';
import { useSubscription } from '@/context/SubscriptionContext';

const S = {
  page: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '0 16px 64px',
  },
  nav: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    alignItems: 'center',
    padding: '20px 0',
    marginBottom: 8,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    color: '#71717a', fontSize: 14, textDecoration: 'none',
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', padding: 0,
    transition: 'color .15s',
  },
  container: { width: '100%', maxWidth: 480 },
  eyebrow: {
    fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
    textTransform: 'uppercase' as const,
    color: '#3b82f6', marginBottom: 12,
  },
  heading: {
    fontSize: 28, fontWeight: 700, letterSpacing: '-.02em',
    color: '#fafafa', lineHeight: 1.2, marginBottom: 10,
  },
  sub: { fontSize: 15, color: '#71717a', lineHeight: 1.6, marginBottom: 32 },
  card: {
    background: '#111113',
    border: '1px solid #1f1f23',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardHeader: {
    padding: '20px 24px 0',
    borderBottom: '1px solid #1f1f23',
    paddingBottom: 20,
  },
  tierLabel: { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#3b82f6', marginBottom: 8 },
  price: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 },
  priceNum: { fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', color: '#fafafa' },
  pricePer: { fontSize: 15, color: '#52525b' },
  priceNote: { fontSize: 13, color: '#52525b', marginBottom: 16 },
  tagline: { fontSize: 14, color: '#71717a', paddingBottom: 0 },
  features: { padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, gap: 10 },
  feature: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#d4d4d8' },
  featureIcon: { width: 16, height: 16, color: '#22c55e', flexShrink: 0 },
  ctaSection: { padding: '0 24px 24px' },
  ctaBtn: {
    width: '100%', padding: '15px 20px',
    background: '#3b82f6', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background .15s, transform .1s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaBtnSecondary: {
    width: '100%', padding: '13px 20px',
    background: 'transparent', color: '#71717a',
    border: '1px solid #27272a', borderRadius: 10,
    fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'border-color .15s, color .15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10,
  },
  trustRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: 20,
    fontSize: 12, color: '#3f3f46',
  },
  canceledBanner: {
    background: '#1a1a1f', border: '1px solid #27272a',
    borderRadius: 10, padding: '12px 16px',
    fontSize: 13, color: '#71717a', marginBottom: 20,
    display: 'flex', alignItems: 'center', gap: 8,
  },
};

function UpgradePageInner() {
  const params = useSearchParams();
  const canceled = params.get('canceled') === 'true';
  const { startCheckout, simulateUpgrade, isFree, loading } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      await startCheckout();
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) return null;

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link href="/dashboard" style={S.backBtn}>
          <ArrowLeft size={16} /> Back
        </Link>
      </nav>

      <div style={S.container}>
        {canceled && (
          <div style={S.canceledBanner}>
            <Shield size={14} />
            Payment was canceled — no charge made. You can try again any time.
          </div>
        )}

        <div style={S.eyebrow}>Hippo Pro</div>
        <h1 style={S.heading}>The full operating system for surgical growth.</h1>
        <p style={S.sub}>
          Unlimited case logging, benchmark comparisons, social features, and Excel exports —
          designed for residents, fellows, and staff.
        </p>

        {/* Pro card */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.tierLabel}>Pro</div>
            <div style={S.price}>
              <span style={S.priceNum}>{PRICING.pro.monthlyDisplay}</span>
              <span style={S.pricePer}>/month</span>
            </div>
            <div style={S.priceNote}>Billed monthly · Cancel any time</div>
            <div style={S.tagline}>{PRICING.pro.tagline}</div>
          </div>

          <div style={S.features}>
            {PRICING.pro.features.map(f => (
              <div key={f} style={S.feature}>
                <Check size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>

          <div style={S.ctaSection}>
            <button
              style={{ ...S.ctaBtn, opacity: checkingOut ? .7 : 1 }}
              disabled={checkingOut}
              onClick={handleCheckout}
            >
              <Zap size={16} />
              {checkingOut ? 'Redirecting to Stripe…' : `Start Pro — ${PRICING.pro.monthlyDisplay}/month`}
            </button>

            {/* Demo button (remove in production) */}
            {process.env.NODE_ENV !== 'production' && isFree && (
              <button
                style={S.ctaBtnSecondary}
                onClick={simulateUpgrade}
                title="Demo only — simulates upgrade without Stripe"
              >
                ⚡ Demo: Simulate Pro Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Institution card */}
        <div style={{ ...S.card, opacity: .85 }}>
          <div style={S.cardHeader}>
            <div style={{ ...S.tierLabel, color: '#a1a1aa' }}>Institution</div>
            <div style={S.price}>
              <span style={S.priceNum}>{PRICING.institution.monthlyDisplay}</span>
              <span style={S.pricePer}>/month</span>
            </div>
            <div style={S.priceNote}>For programs & hospitals · Custom onboarding</div>
          </div>
          <div style={S.features}>
            {PRICING.institution.features.map(f => (
              <div key={f} style={S.feature}>
                <Check size={15} style={{ color: '#3f3f46', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
          <div style={S.ctaSection}>
            <a
              href="mailto:hello@hippo.app?subject=Institution%20Plan%20Inquiry"
              style={{ ...S.ctaBtnSecondary, textDecoration: 'none', justifyContent: 'center' }}
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* Trust line */}
        <div style={S.trustRow}>
          <Shield size={12} />
          Secure checkout via Stripe · No card stored on our servers · Cancel any time
        </div>

        {/* Free tier comparison */}
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
            Free vs Pro
          </div>
          {[
            ['Case logging', '5/week', 'Unlimited'],
            ['Specialties', '1', 'All 10+'],
            ['Benchmark percentiles', '—', '✓'],
            ['Social & friends', '—', '✓'],
            ['Excel export', '—', '✓'],
            ['Ads', 'Yes', 'None'],
            ['AI insights', '—', '✓'],
          ].map(([feat, free, pro]) => (
            <div key={feat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #18181b', fontSize: 14 }}>
              <span style={{ color: '#71717a' }}>{feat}</span>
              <div style={{ display: 'flex', gap: 32 }}>
                <span style={{ color: '#3f3f46', minWidth: 60, textAlign: 'center' }}>{free}</span>
                <span style={{ color: free === '—' ? '#22c55e' : '#3b82f6', minWidth: 60, textAlign: 'center', fontWeight: 500 }}>{pro}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageInner />
    </Suspense>
  );
}
