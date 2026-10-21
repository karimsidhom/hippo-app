import { createHash } from 'node:crypto';

/** Stable source identity: JSON key order cannot invalidate a review. */
export function progressContentHash(payload: unknown): string {
  function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, v]) => [key, canonical(v)]));
    }
    return value;
  }
  return createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');
}
