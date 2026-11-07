import { requireIdentityClient } from '@/lib/api-auth';
import { requireSafety, SafetyError } from '@/lib/safety';
import { NextResponse } from 'next/server';

/** Uses the same verified cookie/bearer actor and current receipts before touching handoffs. */
export async function linkClient() {
  const identity = await requireIdentityClient();
  if (identity.error) return { context: null, error: identity.error };
  try {
    await requireSafety(identity.client, 'cases');
    return { context: { supabase: identity.client, userId: identity.user.id }, error: null };
  } catch (error) {
    const failure = error instanceof SafetyError ? error : new SafetyError('cases', 503);
    return { context: null, error: NextResponse.json({ error: failure.message, code: failure.code, onboardingUrl: failure.onboardingUrl }, { status: failure.status, headers: { 'Cache-Control': 'no-store' } }) };
  }
}
