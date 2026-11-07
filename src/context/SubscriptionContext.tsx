'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { PricingTier, hasFeature, FEATURE_GATES } from '@/lib/pricing';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'comped'
  | 'lifetime'
  | 'unpaid'
  | 'incomplete'
  | 'none'
  | null;

export interface SubscriptionState {
  tier: PricingTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
}

interface SubscriptionContextValue extends SubscriptionState {
  /** True when the caller's Profile is tier pro/institution with an active-ish status. */
  isPro: boolean;
  isInstitution: boolean;
  isFree: boolean;
  /** Check if a specific feature is gated */
  can: (feature: keyof typeof FEATURE_GATES) => boolean;
  /** Trigger Stripe Checkout for Pro (or lifetime) */
  startCheckout: (plan?: 'monthly' | 'yearly' | 'lifetime') => Promise<void>;
  /** Open Stripe Billing Portal to manage/cancel */
  openBillingPortal: () => Promise<void>;
  /** Re-fetch subscription state from the server (e.g. after returning from Stripe) */
  refresh: () => Promise<void>;
}

const DEFAULT_STATE: SubscriptionState = {
  tier: 'free',
  status: 'none',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  loading: true,
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const [serverIsPro, setServerIsPro] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription', { cache: 'no-store' });
      if (!res.ok) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      const data = await res.json();
      setState({
        tier: (data.tier ?? 'free') as PricingTier,
        status: data.status ?? 'none',
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: data.stripeSubscriptionId ?? null,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        loading: false,
      });
      setServerIsPro(Boolean(data.isPro));
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // While the first fetch is in flight, treat the user as Pro so gated UI
  // doesn't flash a paywall before we know the real answer.
  const isPro = state.loading ? true : serverIsPro;
  const isInstitution = state.tier === 'institution';
  const isFree = !isPro;

  const can = useCallback(
    (feature: keyof typeof FEATURE_GATES) => {
      const effectiveTier: PricingTier = isPro ? (isInstitution ? 'institution' : 'pro') : 'free';
      return hasFeature(effectiveTier, feature);
    },
    [isPro, isInstitution]
  );

  const startCheckout = useCallback(async (plan: 'monthly' | 'yearly' | 'lifetime' = 'monthly') => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Checkout session failed');
      }
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Stripe checkout error:', err);
      throw err;
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings?tab=subscription`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Portal session failed');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Billing portal error:', err);
      throw err;
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      isPro,
      isInstitution,
      isFree,
      can,
      startCheckout,
      openBillingPortal,
      refresh: load,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
