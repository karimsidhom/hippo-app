import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { POLICY_KEYS, POLICY_VERSIONS, type PolicyKey } from "@/lib/legal";

/**
 * POST /api/legal/accept
 *
 * Body: { acceptances: { policyKey: PolicyKey; version: string }[] }
 *
 * Records one row per acceptance. Idempotent via the (userId, policyKey,
 * version) unique constraint — re-submitting the same acceptance is a no-op.
 *
 * The request's IP and user-agent are captured as part of the legal
 * evidence trail.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: { acceptances?: { policyKey?: string; version?: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const acceptances = Array.isArray(body.acceptances) ? body.acceptances : [];
  if (acceptances.length === 0) {
    return NextResponse.json({ error: "No acceptances provided" }, { status: 400 });
  }

  // Validate every entry. Refuse the whole batch if any one is malformed —
  // partial acceptance would leave a misleading audit trail.
  const validated: { policyKey: PolicyKey; version: string }[] = [];
  for (const a of acceptances) {
    if (!a.policyKey || !a.version) {
      return NextResponse.json({ error: "Missing policyKey or version" }, { status: 400 });
    }
    if (!POLICY_KEYS.includes(a.policyKey as PolicyKey)) {
      return NextResponse.json({ error: `Unknown policyKey: ${a.policyKey}` }, { status: 400 });
    }
    const key = a.policyKey as PolicyKey;
    if (a.version !== POLICY_VERSIONS[key]) {
      return NextResponse.json(
        { error: `Version mismatch for ${key}: expected ${POLICY_VERSIONS[key]}` },
        { status: 400 },
      );
    }
    validated.push({ policyKey: key, version: a.version });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;

  await db.$transaction(
    validated.map((v) =>
      db.legalAcceptance.upsert({
        where: {
          userId_policyKey_version: {
            userId: user.id,
            policyKey: v.policyKey,
            version: v.version,
          },
        },
        create: {
          userId: user.id,
          policyKey: v.policyKey,
          version: v.version,
          ipAddress,
          userAgent,
        },
        update: {}, // idempotent no-op on repeat
      }),
    ),
  );

  return NextResponse.json({ ok: true, recorded: validated.length });
}

/**
 * GET /api/legal/accept
 *
 * Returns the current user's acceptance status against every active policy.
 * Used by the onboarding gate to know which policies still need acceptance.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const rows = await db.legalAcceptance.findMany({
    where: { userId: user.id },
    select: { policyKey: true, version: true, acceptedAt: true },
  });

  const status = POLICY_KEYS.map((key) => {
    const current = POLICY_VERSIONS[key];
    const accepted = rows.find((r) => r.policyKey === key && r.version === current);
    return {
      policyKey: key,
      currentVersion: current,
      accepted: Boolean(accepted),
      acceptedAt: accepted?.acceptedAt ?? null,
    };
  });

  return NextResponse.json({ status });
}
