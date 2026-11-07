import { timingSafeEqual } from 'node:crypto';
/** Service authentication only; an absent secret must never authorize a scheduled endpoint. */
export function cronAuthorized(request: Pick<Request, 'headers'>, secret = process.env.CRON_SECRET): boolean {
  if (!secret || !secret.trim()) return false;
  const expected = Buffer.from(`Bearer ${secret}`), actual = Buffer.from(request.headers.get('authorization') ?? '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
