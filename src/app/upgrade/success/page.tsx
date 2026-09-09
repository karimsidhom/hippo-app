'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';

const S = {
  page: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
  },
  icon: {
    width: 72, height: 72,
    background: 'rgba(34,197,94,.1)',
    border: '1px solid rgba(34,197,94,.2)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  eyebrow: { fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#22c55e', marginBottom: 12 },
  h1: { fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', color: '#fafafa', marginBottom: 10, textAlign: 'center' as const },
  p: { fontSize: 15, color: '#71717a', textAlign: 'center' as const, lineHeight: 1.6, maxWidth: 340, marginBottom: 36 },
  btn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '15px 28px',
    background: '#3b82f6', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background .15s',
  },
  features: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    maxWidth: 360, width: '100%', marginBottom: 36,
  },
  feature: {
    background: '#111113', border: '1px solid #1f1f23',
    borderRadius: 10, padding: '14px 16px',
    fontSize: 13, color: '#a1a1aa',
  },
  featureTitle: { fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 4 },
};

const UNLOCKED = [
  { title: 'Unlimited Logging', desc: 'No weekly case limits' },
  { title: 'All Specialties', desc: '10+ surgical specialties' },
  { title: 'Benchmark Engine', desc: 'Percentile comparisons' },
  { title: 'Excel Export', desc: 'PHIA-safe workbooks' },
  { title: 'Social Features', desc: 'Friends & leaderboards' },
  { title: 'No Ads', desc: 'Clean interface' },
];

function SuccessPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { isPro, refresh } = useSubscription();
  const [syncing, setSyncing] = useState(true);
  const ranOnce = useRef(false);

  const sessionId = params.get('session_id');

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    async function sync() {
      // The webhook may already have landed by the time the browser
      // redirects back here. Try a plain refresh first.
      await refresh();

      // If not, fall back to a direct sync from the Checkout Session so
      // the user doesn't sit on a "welcome" screen that isn't true yet.
      if (sessionId) {
        try {
          const res = await fetch('/api/stripe/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          if (res.ok) await refresh();
        } catch (err) {
          console.error('Session sync error:', err);
        }
      }
      setSyncing(false);
    }

    sync();
  }, [sessionId, refresh]);

  if (syncing) {
    return (
      <div style={S.page}>
        <div style={S.icon}>
          <Loader2 size={30} color="#22c55e" className="animate-spin" />
        </div>
        <h1 style={S.h1}>Confirming your subscription...</h1>
        <p style={S.p}>This only takes a moment.</p>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.icon}>
        <CheckCircle size={34} color="#22c55e" />
      </div>

      <div style={S.eyebrow}>Welcome to Pro</div>
      <h1 style={S.h1}>{isPro ? "You're all set." : 'Almost there.'}</h1>
      <p style={S.p}>
        {isPro
          ? 'Your Hippo Pro subscription is active. Everything is unlocked, start logging.'
          : "We couldn't confirm your subscription yet. If you were just charged, this will update within a minute or two, refresh Settings then Subscription to check."}
      </p>

      <div style={S.features}>
        {UNLOCKED.map(f => (
          <div key={f.title} style={S.feature}>
            <div style={S.featureTitle}>{f.title}</div>
            <div>{f.desc}</div>
          </div>
        ))}
      </div>

      <button style={S.btn} onClick={() => router.push('/dashboard')}>
        Go to Dashboard <ArrowRight size={16} />
      </button>

      <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 20 }}>
        A receipt has been sent to your email via Stripe.
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessPageInner />
    </Suspense>
  );
}
