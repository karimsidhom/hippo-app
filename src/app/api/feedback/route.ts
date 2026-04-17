import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// POST /api/feedback
//
// User-submitted feedback for the developer. Routes the message to Karim's
// personal inbox so signal from real users never hits a shared support
// address queue during the founder phase. Also writes an AuditLog entry
// so we can see feedback history per user without needing to dig through
// email.
//
// Body: { message: string, category?: "bug" | "idea" | "general" }
//
// Rate limit: 1 submission per 15 seconds per user. Prevents accidental
// double-submits and trivial abuse; real rate-limiting lives in the
// Resend account anyway.
// ---------------------------------------------------------------------------

const DEVELOPER_EMAIL = "karimsidhom@outlook.com";
const MAX_MESSAGE_LENGTH = 4_000;
const MIN_INTERVAL_MS = 15_000;

interface FeedbackBody {
  message?: unknown;
  category?: unknown;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: FeedbackBody;
  try {
    body = (await req.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body.message === "string" ? body.message.trim() : "";
  if (!raw) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 },
    );
  }
  if (raw.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit` },
      { status: 413 },
    );
  }

  const rawCategory =
    typeof body.category === "string" ? body.category.toLowerCase() : "general";
  const category: "bug" | "idea" | "general" =
    rawCategory === "bug" || rawCategory === "idea" ? rawCategory : "general";

  // Simple rate limit — look for a recent feedback log entry by this user.
  const recent = await db.auditLog.findFirst({
    where: {
      userId: user.id,
      action: "feedback.submit",
      createdAt: { gte: new Date(Date.now() - MIN_INTERVAL_MS) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json(
      { error: "Please wait a few seconds before sending another message." },
      { status: 429 },
    );
  }

  // Load profile context so the email has enough info for Karim to reply
  // without hunting through the DB.
  const [dbUser, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    }),
    db.profile.findUnique({
      where: { userId: user.id },
      select: {
        roleType: true,
        specialty: true,
        institution: true,
        trainingYearLabel: true,
      },
    }),
  ]);

  const displayName = dbUser?.name ?? user.email;
  const roleLine = [
    profile?.roleType,
    profile?.trainingYearLabel,
    profile?.specialty,
    profile?.institution,
  ]
    .filter(Boolean)
    .join(" · ");

  const subject = `[Hippo feedback · ${category}] ${displayName}`;
  const plain = `From: ${displayName} <${user.email}>
User ID: ${user.id}
${roleLine ? `Role: ${roleLine}` : ""}
Category: ${category}
Submitted: ${new Date().toISOString()}

Message:
${raw}

---
Reply directly to ${user.email} to respond.
`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; max-width: 640px; margin: 0 auto; padding: 24px;">
  <div style="border-left: 3px solid #0EA5E9; padding-left: 14px; margin-bottom: 18px;">
    <div style="font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #0EA5E9;">Hippo feedback · ${escapeHtml(category)}</div>
    <div style="font-size: 17px; font-weight: 600; margin-top: 3px;">${escapeHtml(displayName)}</div>
    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${escapeHtml(user.email)}${roleLine ? ` · ${escapeHtml(roleLine)}` : ""}</div>
  </div>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(raw)}</div>
  <div style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
    User ID: <code>${user.id}</code><br />
    Submitted: ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}<br />
    Reply directly to <a href="mailto:${escapeHtml(user.email)}" style="color: #0EA5E9;">${escapeHtml(user.email)}</a> to respond.
  </div>
</body>
</html>`;

  const sent = await sendEmail({
    to: DEVELOPER_EMAIL,
    subject,
    html,
    text: plain,
  });

  if (!sent) {
    // Keep the error opaque to the user but log the real cause server-side.
    console.error("[feedback] Resend send failed for user", user.id);
    return NextResponse.json(
      { error: "Could not send your message right now. Please try again in a moment." },
      { status: 502 },
    );
  }

  // Record the feedback so we can rate-limit + audit. We store the body in
  // the audit log intentionally — it's the user's own message, not PHI.
  await db.auditLog
    .create({
      data: {
        userId: user.id,
        action: "feedback.submit",
        entityType: "Feedback",
        entityId: null,
        metadata: {
          category,
          length: raw.length,
          preview: raw.slice(0, 140),
        },
      },
    })
    .catch((err: unknown) => {
      console.warn("[feedback] audit log failed:", err);
    });

  return NextResponse.json({ ok: true });
}
