/**
 * Pending subprocessor change notices.
 *
 * Per our Subprocessors policy: users get 30 days' notice in-app before a new
 * third-party vendor starts processing their personal data.
 *
 * Workflow:
 *   1. Before signing a contract with a new vendor, add a notice here with
 *      an `effectiveDate` at least 30 days in the future.
 *   2. The <SubprocessorBanner /> component in the app shell reads this list
 *      and shows a dismissible banner to every signed-in user.
 *   3. On the `effectiveDate`, update /legal/subprocessors to include the
 *      vendor in the main table, and remove the notice from this list.
 *
 * Keep entries here even after dismissal by a given user — dismissal is
 * stored per-user in localStorage so re-appearing banners will surface to
 * anyone who hasn't seen the notice yet.
 */

export interface SubprocessorNotice {
  /** Unique ID used for dismissal tracking. Do not reuse. */
  id: string;
  /** Vendor name, as it will appear in the Subprocessors table. */
  vendor: string;
  /** One-sentence purpose (what the vendor will do for Hippo). */
  purpose: string;
  /** What data class the vendor will process. */
  data: string;
  /** ISO date (YYYY-MM-DD) on/after which the vendor starts processing. */
  effectiveDate: string;
  /** ISO date (YYYY-MM-DD) when this notice was first posted. */
  postedOn: string;
}

export const PENDING_SUBPROCESSOR_NOTICES: SubprocessorNotice[] = [
  // Example (commented out):
  // {
  //   id: "upstash-2026-05-15",
  //   vendor: "Upstash",
  //   purpose: "Rate-limiting and caching for API endpoints.",
  //   data: "Rate-limit counters keyed by user ID.",
  //   effectiveDate: "2026-05-15",
  //   postedOn: "2026-04-14",
  // },
];

/** Notices whose effective date is still in the future. */
export function upcomingSubprocessorNotices(now = new Date()): SubprocessorNotice[] {
  const todayISO = now.toISOString().slice(0, 10);
  return PENDING_SUBPROCESSOR_NOTICES.filter((n) => n.effectiveDate > todayISO);
}
