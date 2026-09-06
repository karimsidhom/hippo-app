/**
 * Hippo Pricing — single source of truth.
 * Update ONLY here; all UI reads from these constants.
 */

export const PRICING = {
  pro: {
    label: 'Pro',
    monthlyUsd: 5,
    monthlyDisplay: '$5',
    yearlyUsd: 48,
    yearlyDisplay: '$48',
    yearlyPerMonth: '$4',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID ?? '',
    tagline: 'For residents & fellows',
    cta: 'Start Pro — $5/month',
    ctaShort: '$5/mo',
    description: 'Unlimited logging, AI coaching, and interview-ready PDF exports.',
    features: [
      'Unlimited case logging',
      'All 10+ specialties',
      'Logbook PDF export — interview & fellowship ready',
      'Unlimited AI Brief Me (pre-case coaching)',
      'AI O-score suggestions on every EPA',
      'Bulk EPA sign-off queue (attendings)',
      'Benchmark percentiles & leaderboards',
      'Excel export (PHIA-safe)',
      'On-track projections against your program minimums',
      'Fellowship Summary sheet: category by role by year, ready to paste into any application',
      'Social & friends system',
      'No ads — ever',
    ],
  },
  /**
   * Team plan: a chief resident or a program office buys seats for a cohort.
   * Priced per resident per month, billed to one card, minimum 5 seats.
   */
  team: {
    label: 'Team',
    perSeatMonthlyUsd: 3,
    perSeatMonthlyDisplay: '$3',
    minSeats: 5,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID ?? '',
    tagline: 'For a cohort or a chief resident',
    cta: 'Buy seats for your cohort',
    description: 'Everything in Pro for every resident on one bill.',
  },
  /** One payment, Pro for life. Early-adopter anchor; revisit after the first 200 sold. */
  lifetime: {
    label: 'Lifetime',
    oneTimeUsd: 99,
    oneTimeDisplay: '$99',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID ?? '',
    tagline: 'Pay once, keep it through fellowship',
    cta: 'Lifetime Pro — $99 once',
    description: 'Every Pro feature, forever, including features shipped after you buy.',
  },
  institution: {
    label: 'Institution',
    monthlyUsd: 49,
    monthlyDisplay: '$49',
    tagline: 'For programs & hospitals',
    cta: 'Contact Sales',
    description: 'Multi-resident dashboards and cohort analytics.',
    features: [
      'Everything in Pro',
      'Multi-resident dashboards',
      'Cohort benchmarking',
      'ACGME / RCPSC exports',
      'Faculty mentorship tools',
      'Anonymized program comparisons',
      'Research database mode',
      'Dedicated support',
    ],
  },
  free: {
    label: 'Free',
    monthlyUsd: 0,
    weeklyCaseLimit: 5,
    specialtyLimit: 1,
    features: [
      '5 cases per week',
      '1 specialty',
      'Basic time trend graph',
      'Personal analytics only',
    ],
    limitations: [
      'No social / friends access',
      'No benchmark percentile comparison',
      'No public profile',
      'Ads shown throughout',
    ],
  },
} as const;

export type PricingTier = 'free' | 'pro' | 'institution';

/**
 * Beta switch. While true, every feature is unlocked for every user on both
 * the client (SubscriptionContext) and the server (API routes that call
 * isUnlocked). Flip to false when billing goes live.
 */
export const BETA_ALL_UNLOCKED = true;

/** Server-side gate that honours the beta switch. Use this in API routes. */
export function isUnlocked(tier: PricingTier, feature: keyof typeof FEATURE_GATES): boolean {
  return BETA_ALL_UNLOCKED || hasFeature(tier, feature);
}

/** Human-readable tier display */
export const TIER_LABELS: Record<PricingTier, string> = {
  free: 'Free',
  pro: 'Pro',
  institution: 'Institution',
};

/** Feature gate — call this to check access */
export function hasFeature(tier: PricingTier, feature: keyof typeof FEATURE_GATES): boolean {
  return FEATURE_GATES[feature].includes(tier);
}

export const FEATURE_GATES = {
  unlimitedCases:       ['pro', 'institution'] as PricingTier[],
  allSpecialties:       ['pro', 'institution'] as PricingTier[],
  benchmarkPercentiles: ['pro', 'institution'] as PricingTier[],
  socialFriends:        ['pro', 'institution'] as PricingTier[],
  leaderboard:          ['pro', 'institution'] as PricingTier[],
  excelExport:          ['pro', 'institution'] as PricingTier[],
  publicProfile:        ['pro', 'institution'] as PricingTier[],
  aiInsights:           ['pro', 'institution'] as PricingTier[],
  programDashboard:     ['institution'] as PricingTier[],
  noAds:                ['pro', 'institution'] as PricingTier[],

  // Pro anchors — shipped April 2026
  /** Download the full logbook as a branded PDF — interview & fellowship ready. */
  logbookPdf:           ['pro', 'institution'] as PricingTier[],
  /** AI "Brief Me" pre-case coaching — free tier limited to FREE_BRIEF_LIMIT/mo. */
  aiBrief:              ['pro', 'institution'] as PricingTier[],
  /** AI entrustment-score suggestions in the attending inbox. */
  aiOscore:             ['pro', 'institution'] as PricingTier[],
  /** Bulk EPA sign-off queue for attendings / PDs. */
  bulkSignoff:          ['pro', 'institution'] as PricingTier[],

  // Pro anchors — September 2026
  /** "On track" projections against the program's case minimums. */
  onTrack:              ['pro', 'institution'] as PricingTier[],
  /** Fellowship Summary sheet in the Excel export (category x role x year). */
  fellowshipSummary:    ['pro', 'institution'] as PricingTier[],
} as const;

/**
 * Free-tier monthly allowance for AI Brief Me. Residents get this many
 * briefs per calendar month before hitting the paywall. Pro = unlimited.
 */
export const FREE_BRIEF_LIMIT = 5;
