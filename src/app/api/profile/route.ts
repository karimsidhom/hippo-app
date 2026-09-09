import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { stripHonorific } from '@/lib/names';
import { trainingYearLabelFor } from '@/lib/training-year';

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
      shareCasesWithFriends,
      bio,
      onboardingCompleted,
      tier,
      theme,
      expectedGraduation,
      residencyStartDate,
    } = body;

    // Validate theme — only accept the three known values, never trust
    // arbitrary client input. Anything else falls through to undefined.
    const safeTheme =
      theme === 'light' || theme === 'dark' || theme === 'system'
        ? theme
        : undefined;

    // Validate pgyYear — must be a whole number 1..10, or explicitly null
    // to clear it (e.g. switching to a STAFF role). Anything else (NaN,
    // strings, floats, out-of-range) is a client bug, not silently coerced.
    let safePgyYear: number | null | undefined;
    if (pgyYear === undefined) {
      safePgyYear = undefined;
    } else if (pgyYear === null) {
      safePgyYear = null;
    } else if (Number.isInteger(pgyYear) && pgyYear >= 1 && pgyYear <= 10) {
      safePgyYear = pgyYear;
    } else {
      return NextResponse.json(
        { error: 'pgyYear must be a whole number between 1 and 10, or null.' },
        { status: 400 },
      );
    }

    // Root cause of "training year cannot be changed": the label displayed
    // everywhere (dashboard, PD cohort view, exports, this profile header)
    // is a separate stored column that was only ever written once at
    // onboarding. If the caller updates pgyYear but doesn't explicitly send
    // a trainingYearLabel, derive it here so the two never drift apart
    // again. roleType comes from the request if present, otherwise from
    // the existing stored profile (a pgyYear-only edit shouldn't require
    // resending roleType).
    let derivedTrainingYearLabel: string | null | undefined;
    if (safePgyYear !== undefined && trainingYearLabel === undefined) {
      let effectiveRoleType: string | null | undefined = roleType;
      if (effectiveRoleType === undefined) {
        const existing = await db.profile.findUnique({
          where: { userId: user.id },
          select: { roleType: true },
        });
        effectiveRoleType = existing?.roleType;
      }
      derivedTrainingYearLabel = trainingYearLabelFor(effectiveRoleType, safePgyYear);
    }

    const updated = await db.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(roleType !== undefined && { roleType }),
        ...(specialty !== undefined && { specialty }),
        ...(subspecialty !== undefined && { subspecialty }),
        ...(institution !== undefined && { institution }),
        ...(city !== undefined && { city }),
        ...(trainingCountry !== undefined && { trainingCountry }),
        ...(safePgyYear !== undefined && { pgyYear: safePgyYear }),
        ...(trainingYearLabel !== undefined && { trainingYearLabel }),
        ...(trainingYearLabel === undefined &&
          derivedTrainingYearLabel !== undefined && {
            trainingYearLabel: derivedTrainingYearLabel,
          }),
        ...(publicProfile !== undefined && { publicProfile }),
        ...(allowFriendRequests !== undefined && { allowFriendRequests }),
        ...(allowLeaderboardParticipation !== undefined && { allowLeaderboardParticipation }),
        ...(allowBenchmarkSharing !== undefined && { allowBenchmarkSharing }),
        ...(allowWeeklyDigest !== undefined && { allowWeeklyDigest }),
        ...(shareCasesWithFriends !== undefined && { shareCasesWithFriends }),
        ...(bio !== undefined && { bio }),
        ...(onboardingCompleted !== undefined && { onboardingCompleted }),
        ...(tier !== undefined && { tier }),
        ...(expectedGraduation !== undefined && {
          expectedGraduation: expectedGraduation ? new Date(expectedGraduation) : null,
        }),
        ...(residencyStartDate !== undefined && {
          residencyStartDate: residencyStartDate ? new Date(residencyStartDate) : null,
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
        pgyYear: safePgyYear,
        trainingYearLabel: trainingYearLabel !== undefined ? trainingYearLabel : derivedTrainingYearLabel,
        publicProfile,
        allowFriendRequests,
        allowLeaderboardParticipation,
        allowBenchmarkSharing,
        allowWeeklyDigest: allowWeeklyDigest ?? true,
        shareCasesWithFriends,
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
