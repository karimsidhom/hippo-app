'use client';

import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// /upgrade — beta mode
//
// Hippo is fully free during the beta. This page used to host the Pro
// pricing + Stripe checkout; we've pulled those out of the user-facing
// surface intentionally so everyone gets the full feature set while we
// learn what's valuable enough to charge for later.
//
// The route is kept alive so stale links (old emails, saved tabs, OG
// previews) land on something friendly rather than a 404.
// ---------------------------------------------------------------------------

export default function UpgradePage() {
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
            <Sparkles size={11} /> Open beta
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
            Hippo is completely free right now.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: '#94A3B8' }}>
            No paid tier, no paywalls, no &ldquo;Pro&rdquo; anywhere. Every
            resident, fellow, attending, and PD gets the full feature set while
            we&apos;re in beta. You don&apos;t need to do anything — just go
            use it.
          </p>
        </div>

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
            Included for everyone
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              'Unlimited case logging',
              'All specialties',
              'Logbook PDF export — interview-ready',
              'Unlimited AI Brief Me (pre-case coaching)',
              'AI O-score suggestions for attendings',
              'Bulk EPA sign-off queue',
              'Benchmark percentiles & leaderboards',
              'Excel export (PHIA-safe)',
              'Social & friends system',
              'No ads — ever',
            ].map((f) => (
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

        {/* Footer note */}
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: '#64748B',
            textAlign: 'center',
            lineHeight: 1.55,
          }}
        >
          We&apos;ll introduce a paid tier later. You&apos;ll hear about it in
          the app before anything changes — nothing you rely on today will
          silently disappear.
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
              background: '#0EA5E9',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Open Hippo →
          </Link>
        </div>
      </div>
    </div>
  );
}
