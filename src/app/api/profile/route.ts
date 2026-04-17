import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/profile — fetch the current user's profile
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    // Create a default profile if missing
    const created = await db.profile.create({
      data: { userId: user.id, onboardingCompleted: false },
    });
    return NextResponse.json(created);
  }

  return NextResponse.json(profile);
}

/**
 * PATCH /api/profile — update the current user's profile
 */
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  // Display name lives on the User model, not Profile.
  // Handle it separately so it's saved properly.
  if (typeof body.name === 'string') {
    await db.user.update({
      where: { id: user.id },
      data: { name: body.name.trim() || null },
    });
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
  } = body;

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
    },
  });

  return NextResponse.json(updated);
}
