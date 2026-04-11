'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { PricingTier, hasFeature, FEATURE_GATES, PRICING } from '@/lib/pricing';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'none';

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
  /** True when tier is pro or institution and status is active/trialing */
  isPro: boolean;
  isInstitution: boolean;
  isFree: boolean;
  /** Check if a specific feature is gated */
  can: (feature: keyof typeof FEATURE_GATES) => boolean;
  /** Trigger Stripe Checkout for Pro */
  startCheckout: () => Promise<void>;
  /** Open Stripe Billing Portal to manage/cancel */
  openBillingPortal: () => Promise<void>;
  /** Manually refresh subscription state (e.g. after returning from Stripe) */
  refresh: () => Promise<void>;
  /** Demo-only: simulate upgrade (until Stripe is wired up) */
  simulateUpgrade: () => void;
  simulateDowngrade: () => void;
}

const STORAGE_KEY = 'hippo_subscription';

function loadFromStorage(): Partial<SubscriptionState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.currentPeriodEnd) parsed.currentPeriodEnd = new Date(parsed.currentPeriodEnd);
    return parsed;
  } catch {
    return {};
  }
}

function saveToStorage(state: SubscriptionState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
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

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    setState(prev => ({ ...prev, ...stored, loading: false }));
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!state.loading) saveToStorage(state);
  }, [state]);

  // ── Everything is free and unlocked during beta ──────────────────────────
  const isPro = true;
  const isInstitution = false;
  const isFree = false;

  const can = useCallback(
    (_feature: keyof typeof FEATURE_GATES) => true,
    []
  );

  const startCheckout = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICING.pro.stripePriceId,
          successUrl: `${window.location.origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
        }),
      });
      if (!res.ok) throw new Error('Checkout session failed');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Stripe checkout error:', err);
      // Fallback: open Stripe payment link if configured
      const fallback = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
      if (fallback) window.open(fallback, '_blank');
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: state.stripeCustomerId,
          returnUrl: `${window.location.origin}/settings?tab=subscription`,
        }),
      });
      if (!res.ok) throw new Error('Portal session failed');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Billing portal error:', err);
    }
  }, [state.stripeCustomerId]);

  const refresh = useCallback(async () => {
    if (!state.stripeSubscriptionId) return;
    try {
      const res = await fetch(`/api/stripe/subscription?id=${state.stripeSubscriptionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setState(prev => ({
        ...prev,
        tier: data.tier,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      }));
    } catch {}
  }, [state.stripeSubscriptionId]);

  // Demo helpers — active until real Stripe is wired
  const simulateUpgrade = useCallback(() => {
    const newState: SubscriptionState = {
      tier: 'pro',
      status: 'active',
      stripeCustomerId: 'cus_demo',
      stripeSubscriptionId: 'sub_demo',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      loading: false,
    };
    setState(newState);
  }, []);

  const simulateDowngrade = useCallback(() => {
    setState({ ...DEFAULT_STATE, loading: false });
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
      refresh,
      simulateUpgrade,
      simulateDowngrade,
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
