import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { stripHonorific } from '@/lib/names';

/**
 * GET /api/profile — fetch the current user's profile
 *
 * Wraps Prisma in try/catch and tags every error with `[hippo:profile]`
 * so the failing query is visible in Vercel runtime logs. Includes the
 * Prisma error code in the JSON payload for client-side diagnostics.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const profile = await db.profile.findUnique({ where: { userId: user.id } });

    if (!profile) {
      const created = await db.profile.create({
        data: { userId: user.id, onboardingCompleted: false },
      });
      return NextResponse.json(created);
    }

    return NextResponse.json(profile);
  } catch (err) {
    return prismaError('GET /api/profile', err, user.id);
  }
}

/**
 * PATCH /api/profile — update the current user's profile
 */
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();

    if (typeof body.name === 'string') {
      // Store the name without an honorific: the app adds "Dr." itself
      // wherever it greets the user, so "Dr. Chan" stored here would
      // render as "Dr. Dr. Chan".
      const name = stripHonorific(body.name) || null;
      await db.user.update({
        where: { id: user.id },
        data: { name },
      });
      // Keep the auth token's metadata in step so a fresh session (or
      // another Hippo app reading user_metadata) shows the same name.
      try {
        await createServiceRoleClient().auth.admin.updateUserById(user.id, {
          user_metadata: { name: name ?? '' },
        });
      } catch (metaErr) {
        console.warn('[hippo:profile] auth metadata name sync failed', metaErr);
      }
    }

    // Whitelist updatable profile fields
    const {
      roleType,
      specialty,
      subspecialty,
      institution,
      city,
      trainingCountry,
      pgyYear,
      trainingYearLabel,
      publicProfile,
      allowFriendRequests,
      allowLeaderboardParticipation,
      allowBenchmarkSharing,
      allowWeeklyDigest,
      bio,
      onboardingCompleted,
      tier,
      theme,
      expectedGraduation,
    } = body;

    // Validate theme — only accept the three known values, never trust
    // arbitrary client input. Anything else falls through to undefined.
    const safeTheme =
      theme === 'light' || theme === 'dark' || theme === 'system'
        ? theme
        : undefined;

    const updated = await db.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(roleType !== undefined && { roleType }),
        ...(specialty !== undefined && { specialty }),
        ...(subspecialty !== undefined && { subspecialty }),
        ...(institution !== undefined && { institution }),
        ...(city !== undefined && { city }),
        ...(trainingCountry !== undefined && { trainingCountry }),
        ...(pgyYear !== undefined && { pgyYear }),
        ...(trainingYearLabel !== undefined && { trainingYearLabel }),
        ...(publicProfile !== undefined && { publicProfile }),
        ...(allowFriendRequests !== undefined && { allowFriendRequests }),
        ...(allowLeaderboardParticipation !== undefined && { allowLeaderboardParticipation }),
        ...(allowBenchmarkSharing !== undefined && { allowBenchmarkSharing }),
        ...(allowWeeklyDigest !== undefined && { allowWeeklyDigest }),
        ...(bio !== undefined && { bio }),
        ...(onboardingCompleted !== undefined && { onboardingCompleted }),
        ...(tier !== undefined && { tier }),
        ...(expectedGraduation !== undefined && {
          expectedGraduation: expectedGraduation ? new Date(expectedGraduation) : null,
        }),
        ...(safeTheme && { theme: safeTheme }),
      },
      create: {
        userId: user.id,
        roleType,
        specialty,
        subspecialty,
        institution,
        city,
        trainingCountry,
        pgyYear,
        trainingYearLabel,
        publicProfile,
        allowFriendRequests,
        allowLeaderboardParticipation,
        allowBenchmarkSharing,
        allowWeeklyDigest: allowWeeklyDigest ?? true,
        bio,
        onboardingCompleted: onboardingCompleted ?? false,
        tier: tier ?? 'free',
        theme: safeTheme ?? 'dark',
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return prismaError('PATCH /api/profile', err, user.id);
  }
}

/**
 * Build a structured error payload with the Prisma error code if available.
 * Codes like P2022 ("column does not exist") immediately tell us which
 * migration is missing — gold for debugging schema drift.
 */
function prismaError(label: string, err: unknown, userId: string): NextResponse {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : undefined;
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
  console.error(`[hippo:${label}] userId=${userId} code=${code ?? '-'}`, message);
  return NextResponse.json(
    {
      error: message,
      code,
      hint:
        code === 'P2022'
          ? 'Schema drift — column referenced by Prisma client missing in DB. Run `prisma migrate deploy`.'
          : code === 'P2021'
            ? 'Schema drift — table missing in DB. Run `prisma migrate deploy`.'
            : undefined,
    },
    { status: 500 },
  );
}
