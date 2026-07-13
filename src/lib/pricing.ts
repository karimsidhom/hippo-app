/**
 * Hippo Pricing — single source of truth.
 * Update ONLY here; all UI reads from these constants.
 */

export const PRICING = {
  pro: {
    label: 'Resident',
    monthlyUsd: 0,
    monthlyDisplay: '$0',
    yearlyUsd: 0,
    yearlyDisplay: '$0',
    yearlyPerMonth: '$0',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID ?? '',
    tagline: 'For residents & fellows',
    cta: 'Start free',
    ctaShort: 'Free',
    description: 'Unlimited logging, coaching, and interview-ready exports, free for residents.',
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
    monthlyUsd: 0,
    monthlyDisplay: 'Pilot pricing',
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
    weeklyCaseLimit: Infinity,
    specialtyLimit: Infinity,
    features: [
      'Unlimited cases and specialties',
      'Full analytics and benchmarks',
      'EPA and milestone tracking',
      'PDF and spreadsheet exports',
    ],
    limitations: [
      'Program administration requires an institutional plan',
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
  unlimitedCases:       ['free', 'pro', 'institution'] as PricingTier[],
  allSpecialties:       ['free', 'pro', 'institution'] as PricingTier[],
  benchmarkPercentiles: ['free', 'pro', 'institution'] as PricingTier[],
  socialFriends:        ['free', 'pro', 'institution'] as PricingTier[],
  leaderboard:          ['free', 'pro', 'institution'] as PricingTier[],
  excelExport:          ['free', 'pro', 'institution'] as PricingTier[],
  publicProfile:        ['free', 'pro', 'institution'] as PricingTier[],
  aiInsights:           ['free', 'pro', 'institution'] as PricingTier[],
  programDashboard:     ['institution'] as PricingTier[],
  noAds:                ['free', 'pro', 'institution'] as PricingTier[],

  // Pro anchors — shipped April 2026
  /** Download the full logbook as a branded PDF — interview & fellowship ready. */
  logbookPdf:           ['free', 'pro', 'institution'] as PricingTier[],
  /** AI "Brief Me" pre-case coaching — free tier limited to FREE_BRIEF_LIMIT/mo. */
  aiBrief:              ['free', 'pro', 'institution'] as PricingTier[],
  /** AI entrustment-score suggestions in the attending inbox. */
  aiOscore:             ['free', 'pro', 'institution'] as PricingTier[],
  /** Bulk EPA sign-off queue for attendings / PDs. */
  bulkSignoff:          ['free', 'pro', 'institution'] as PricingTier[],
} as const;

/**
 * Free-tier monthly allowance for AI Brief Me. Residents get this many
 * briefs per calendar month before hitting the paywall. Pro = unlimited.
 */
export const FREE_BRIEF_LIMIT = Number.POSITIVE_INFINITY;
