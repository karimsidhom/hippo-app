import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { db } from '@/lib/db';

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
