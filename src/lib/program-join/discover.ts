/** Longest query we will send to the database. */
const MAX_QUERY = 100;
/** Shortest query worth running, to keep the result set bounded. */
const MIN_QUERY = 2;

/**
 * Normalise the ?q= parameter for program discovery. Returns null when
 * the caller has not typed enough to run a useful search, which the
 * route turns into an empty result rather than a scan of every program.
 */
export function normaliseDiscoverQuery(raw: string | null): string | null {
  const q = (raw ?? '').trim();
  if (q.length < MIN_QUERY) return null;
  return q.slice(0, MAX_QUERY);
}
