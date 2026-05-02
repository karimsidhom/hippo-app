import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// /auth/callback
//
// OAuth round-trip terminus for Google / Apple / Microsoft (Azure) sign-in.
//
// Flow:
//   1. Supabase Auth redirects the browser back here with `?code=...` after
//      the user consents at the provider.
//   2. We exchange the code for a Supabase session (sets cookies via SSR).
//   3. We upsert the corresponding row in our Prisma `User` table so all
//      downstream FK references resolve (`ensureDbUser`).
//   4. We route the user to /onboarding (first-time) or /dashboard (returning),
//      preserving an optional `?next=...` redirect target.
//
// Errors land back at /login?error=... so the user sees a recoverable message.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const nextParam = url.searchParams.get("next");

  // Provider-side error (user clicked Cancel, denied scopes, etc.) →
  // Supabase forwards `?error=...&error_description=...`. Surface it.
  if (errorParam) {
    const msg = encodeURIComponent(errorDescription || errorParam);
    return NextResponse.redirect(new URL(`/login?error=${msg}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Missing+OAuth+code", req.url),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const msg = encodeURIComponent(error?.message || "Sign-in failed");
    return NextResponse.redirect(new URL(`/login?error=${msg}`, req.url));
  }

  // Pull the freshest user info — Supabase populates user_metadata.full_name
  // from Google/Apple/Azure on first sign-in.
  const { id, email, user_metadata } = data.user;
  const safeEmail = email ?? `${id}@hippomedicine.local`;
  const inferredName =
    (user_metadata?.full_name as string | undefined) ??
    (user_metadata?.name as string | undefined) ??
    ([user_metadata?.given_name, user_metadata?.family_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
      safeEmail.split("@")[0]);

  // Sync to Prisma User. ensureDbUser is idempotent — it'll create on first
  // SSO login and just return the existing row on subsequent ones.
  try {
    await ensureDbUser({ id, email: safeEmail });

    // Patch the user row's name + image if Supabase has fresher data than
    // what we currently store. Cheap idempotent update.
    const avatar =
      (user_metadata?.avatar_url as string | undefined) ??
      (user_metadata?.picture as string | undefined) ??
      null;

    await db.user.update({
      where: { id },
      data: {
        name: inferredName || undefined,
        image: avatar ?? undefined,
      },
    });
  } catch (err) {
    // Sync failure should not strand the user — they'll be signed in on the
    // Supabase side either way; downstream code can heal the DB row.
    console.error("[auth/callback] DB sync failed", err);
  }

  // Decide where to send them. Trust `?next` only if it's a same-origin
  // relative path — never a full URL (open-redirect safety).
  let target = "/dashboard";
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    target = nextParam;
  } else {
    const profile = await db.profile.findUnique({ where: { userId: id } });
    target = profile?.onboardingCompleted ? "/dashboard" : "/onboarding";
  }

  return NextResponse.redirect(new URL(target, req.url));
}
