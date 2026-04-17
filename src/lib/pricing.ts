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
      'Social & friends system',
      'No ads — ever',
    ],
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
} as const;

/**
 * Free-tier monthly allowance for AI Brief Me. Residents get this many
 * briefs per calendar month before hitting the paywall. Pro = unlimited.
 */
export const FREE_BRIEF_LIMIT = 5;
