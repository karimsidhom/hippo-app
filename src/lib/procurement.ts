export const INSTITUTIONAL_AGREEMENT_VERSION = "2026-07-13";
export const PILOT_LENGTH_DAYS = 30;

export const PROCUREMENT_STATUSES = {
  DRAFT: "Draft",
  SUBMITTED: "Agreement sent",
  AGREEMENT_ACCEPTED: "Agreement executed",
  ACTIVE: "Active",
} as const;

export function stripeProgramBillingConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PROGRAM_PRICE_ID,
  );
}

export function agreementUrl(token: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://hippomedicine.com";
  return `${origin}/institutional-agreement/${encodeURIComponent(token)}`;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}
