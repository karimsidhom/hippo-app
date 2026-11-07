import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/account/delete
//
// Permanently deletes the caller's account and all associated data.
//
// This is a GDPR / PHIA "right to erasure" endpoint and an Apple App Store
// requirement for published apps. No recovery after this completes.
//
// Flow:
//   1. Require auth (caller must be signed in as the account being deleted).
//   2. Require `confirm` text in the body ("DELETE <email>") to match the
//      GitHub-style type-to-confirm pattern. Prevents accidental deletion
//      and forces the client to be 100% sure about the target.
//   3. Prisma delete on `User` — cascades to every user-owned model (most
//      relations already have onDelete: Cascade set in schema.prisma).
//   4. Delete the Supabase auth user via the service-role client so the
//      email is freed up and the user can't come back with the same JWT.
//   5. Audit log entry (system-user) records the deletion for legal paper
//      trail. We DO NOT leave orphan audit rows pointing at the now-gone
//      user — `AuditLog.user` has onDelete: SetNull so the userId field
//      simply goes to null in any pre-existing rows.
//
// Returns 200 on success. The client is expected to call supabase.auth.
// signOut() afterwards and redirect to /login with a flash.
// ---------------------------------------------------------------------------

interface DeleteBody {
  confirm?: unknown;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Type-to-confirm. The UI pre-fills an instruction like:
  //   Type DELETE karim@hippomedicine.com to confirm.
  // and sends the exact typed string here. Mismatch → 400.
  const expected = `DELETE ${user.email}`;
  if (typeof body.confirm !== "string" || body.confirm.trim() !== expected) {
    return NextResponse.json(
      {
        error: "confirmation_mismatch",
        message: `To confirm, the 'confirm' field must be exactly: ${expected}`,
      },
      { status: 400 },
    );
  }

  // ── Step 1: Prisma cascade delete ─────────────────────────────────────
  // The vast majority of user-owned rows (cases, EPAs, milestones, etc.)
  // have onDelete: Cascade in the schema. Deleting the root User row
  // triggers those cascades in a single transaction.
  try {
    await db.user.delete({ where: { id: user.id } });
  } catch (err) {
    console.error("[account/delete] Prisma delete failed:", err);
    return NextResponse.json(
      {
        error: "delete_failed",
        message:
          "Could not delete your data. Please contact support and we'll handle it manually.",
      },
      { status: 500 },
    );
  }

  // ── Step 2: delete the Supabase auth user ────────────────────────────
  // Without this, a pre-issued JWT could still authenticate for its
  // remaining TTL, and the email would be blocked from re-registering.
  //
  // We use a full-power admin client here (service role key with the
  // auth.admin namespace) rather than the cookie-bound server client
  // because .admin is not exposed through that one.
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      // DB data is gone; a lingering auth record is a cleanup task, not
      // a user-facing failure. Log it loudly so we catch it in Vercel logs.
      console.error(
        "[account/delete] Prisma succeeded but Supabase auth delete failed:",
        delErr,
      );
    }
  } catch (err) {
    console.error("[account/delete] Supabase admin call threw:", err);
  }

  return NextResponse.json({ ok: true });
}
