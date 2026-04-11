'use client';

import { useState } from 'react';
import { Lock, Check, Zap, X, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PRICING } from '@/lib/pricing';
import { useSubscription } from '@/context/SubscriptionContext';

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
  /** Override the gate — if true, children render normally */
  bypass?: boolean;
  blur?: boolean;
}

export function ProGate({ children, feature = 'this feature', bypass, blur = true }: ProGateProps) {
  const { isFree } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  const gated = bypass !== undefined ? !bypass : isFree;
  if (!gated) return <>{children}</>;

  return (
    <div style={{ position: 'relative' }}>
      {blur && (
        <div style={{ filter: 'blur(5px)', opacity: .35, pointerEvents: 'none', userSelect: 'none' }}>
          {children}
        </div>
      )}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(9,9,11,.75)',
        borderRadius: 12, zIndex: 10,
        padding: 24, textAlign: 'center',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111113', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Lock size={18} color="#3b82f6" />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 4 }}>Pro Feature</p>
        <p style={{ fontSize: 13, color: '#71717a', marginBottom: 16 }}>Upgrade to access {feature}</p>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Zap size={13} /> Upgrade — {PRICING.pro.monthlyDisplay}/mo
        </button>
      </div>

      {showModal && <UpgradeModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export function UpgradeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { startCheckout, simulateUpgrade, isFree } = useSubscription();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    onClose();
    try {
      await startCheckout();
    } finally {
      setLoading(false);
    }
  }

  function handleUpgradePage() {
    onClose();
    router.push('/upgrade');
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0f0f11', borderTop: '1px solid #1f1f23', borderRadius: '20px 20px 0 0', padding: '0 0 max(24px, env(safe-area-inset-bottom))', width: '100%', maxWidth: 500, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#27272a', borderRadius: 2, margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 6 }}>Hippo Pro</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', color: '#fafafa', lineHeight: 1.2 }}>
              Unlock everything.
            </div>
            <div style={{ fontSize: 14, color: '#52525b', marginTop: 6 }}>
              {PRICING.pro.monthlyDisplay}/month · Cancel any time
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#1c1c1f', border: '1px solid #27272a', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
            <X size={15} color="#71717a" />
          </button>
        </div>

        {/* Features */}
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PRICING.pro.features.slice(0, 6).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a1a1aa' }}>
              <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1a1a1d', margin: '0 24px' }} />

        {/* CTA */}
        <div style={{ padding: '20px 24px' }}>
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{ width: '100%', padding: '15px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? .7 : 1, transition: 'opacity .15s' }}
          >
            <Zap size={15} />
            {loading ? 'Redirecting…' : `Start Pro — ${PRICING.pro.monthlyDisplay}/month`}
          </button>

          <button
            onClick={handleUpgradePage}
            style={{ width: '100%', marginTop: 10, padding: '13px 20px', background: 'transparent', color: '#71717a', border: '1px solid #27272a', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            See full comparison
          </button>

          {/* Dev-only simulate button */}
          {process.env.NODE_ENV !== 'production' && (
            <button
              onClick={() => { simulateUpgrade(); onClose(); }}
              style={{ width: '100%', marginTop: 8, padding: '11px', background: 'transparent', color: '#3f3f46', border: '1px dashed #27272a', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ⚡ Dev: Simulate Upgrade (no Stripe)
            </button>
          )}
        </div>

        {/* Trust */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#3f3f46', paddingBottom: 4 }}>
          <Shield size={11} />
          Secure checkout via Stripe · Cancel any time
        </div>
      </div>
    </div>
  );
}
