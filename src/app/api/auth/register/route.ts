import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { ATTRIBUTION_COOKIE, decodeAttribution, REFERRAL_COOKIE } from '@/lib/growth/attribution';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/register
 *
 * 1. Creates the Supabase auth user (service role — bypasses email confirmation for MVP)
 * 2. Creates the Prisma User + Profile row using the Supabase UUID as the primary key
 * 3. Signs in immediately and returns the session
 *
 * The browser client then calls supabase.auth.setSession() with the returned tokens.
 */
export async function POST(req: NextRequest) {
  try {
    // IP-based rate limit — block credential-stuffing + mass account creation.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const rl = checkRateLimit(`auth:register:${ip}`, LIMITS.auth);
    if (!rl.allowed) return rl.response;

    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const supabase = createServiceRoleClient();

    // ── 1. Create Supabase auth user ──────────────────────────────────────
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm — add email verification later
        user_metadata: { name },
      });

    if (authError) {
      const alreadyExists =
        authError.message.toLowerCase().includes('already') ||
        authError.message.toLowerCase().includes('exists');
      return NextResponse.json(
        { error: alreadyExists ? 'Email already registered' : authError.message },
        { status: alreadyExists ? 409 : 400 },
      );
    }

    const authUserId = authData.user.id;

    // ── 2. Create DB user + default profile ──────────────────────────────
    await db.user.upsert({
      where: { id: authUserId },
      update: { name, email },
      create: {
        id: authUserId,
        email,
        name,
        profile: { create: { onboardingCompleted: false } },
      },
    });

    const attribution = decodeAttribution(req.cookies.get(ATTRIBUTION_COOKIE)?.value);
    const referralCode = req.cookies.get(REFERRAL_COOKIE)?.value;
    await db.$transaction(async (tx) => {
      await tx.growthEvent.create({
        data: {
          name: 'signup',
          path: '/signup',
          userId: authUserId,
          source: referralCode ? 'resident_referral' : attribution.source || null,
          medium: referralCode ? 'share' : attribution.medium || null,
          campaign: attribution.campaign || null,
          content: attribution.content || null,
          referralCode: referralCode || null,
        },
      });
      if (referralCode) {
        await tx.growthReferral.updateMany({
          where: { code: referralCode, NOT: { ownerUserId: authUserId } },
          data: { signups: { increment: 1 } },
        });
      }
    });

    // ── 3. Sign in to get session tokens ─────────────────────────────────
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) throw signInError;

    return NextResponse.json({
      session: signInData.session,
      user: {
        id: authUserId,
        email,
        name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    console.error('[register]', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
