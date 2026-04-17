/**
 * Central source of truth for the current version of every user-facing
 * legal policy on Hippo. When a policy is materially changed:
 *
 *   1. Bump its version string below (ISO date of the change is the convention).
 *   2. Update the page's "Last updated" / "Effective date" line to match.
 *   3. On next login, users will be re-prompted via the onboarding-style
 *      legal-acceptance gate to accept the new version.
 *
 * The key values are stored literally in the `legal_acceptances` table, so
 * do not rename keys — only add new ones or bump versions.
 */

export const POLICY_KEYS = [
  "eula",
  "terms",
  "privacy",
  "phia",
  "acceptable-use",
] as const;

export type PolicyKey = typeof POLICY_KEYS[number];

export const POLICY_VERSIONS: Record<PolicyKey, string> = {
  eula: "2026-04-14",
  // 2026-04-17: rewrote Terms with the risk-shifting stack — user-content
  // warranty, indemnity, AI disclaimer, content-moderation rights,
  // privacy-specific no-PHI list, strengthened liability cap. Bumping the
  // version forces every existing user to re-accept on next sign-in.
  terms: "2026-04-17",
  privacy: "2026-04-14",
  // 2026-04-17: rewrote §4 (AI features and PHI) to disclose current
  // providers (Google AI Studio primary, Groq failover), the multi-layer
  // scrub compensating control, and the expanded no-PHI obligation.
  phia: "2026-04-17",
  "acceptable-use": "2026-04-14",
};

export const POLICY_META: Record<
  PolicyKey,
  { title: string; href: string; summary: string }
> = {
  eula: {
    title: "End User Licence Agreement",
    href: "/legal/eula",
    summary:
      "The binding contract — licence grants, ownership of your content, restrictions, liability caps.",
  },
  terms: {
    title: "Terms of Use",
    href: "/legal/terms",
    summary:
      "Operational terms — not an official training record, no medical advice, fees and cancellation.",
  },
  privacy: {
    title: "Privacy Policy",
    href: "/legal/privacy",
    summary:
      "What we collect, how we use it, your access/deletion rights.",
  },
  phia: {
    title: "PHIA Notice",
    href: "/legal/phia",
    summary:
      "Manitoba PHIA-specific notice. You agree not to enter patient-identifying information.",
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    href: "/legal/acceptable-use",
    summary:
      "Community rules, the no-PHI rule, and what constitutes abuse of the platform.",
  },
};
