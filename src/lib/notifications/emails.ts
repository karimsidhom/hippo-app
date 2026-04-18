import { db } from "@/lib/db";
import {
  sendEmail,
  buildEpaVerifiedEmail,
  buildEpaReturnedEmail,
} from "@/lib/email";

// ---------------------------------------------------------------------------
// sendResidentOutcomeEmail — emails the resident when their EPA transitions
// PENDING_REVIEW → SIGNED or RETURNED.
//
// Separate from createNotification() because the email channel has its own
// opt-out (emailEnabled), its own failure mode (Resend rate limits,
// bounces), and its own content (full HTML vs. push title/body).
//
// This is fire-and-forget: wrap call sites in `void`. The EPA sign itself
// must succeed even if Resend is down.
// ---------------------------------------------------------------------------

interface OutcomeInput {
  residentId: string;
  kind: "verified" | "returned";
  assessorName: string;
  epaId: string;
  epaTitle: string;
  /** Attending's comment on return. Ignored for verified. */
  reason?: string | null;
}

export async function sendResidentOutcomeEmail(input: OutcomeInput): Promise<void> {
  try {
    // Respect the per-user opt-out. Defaults to on for new users — if
    // they never visited /settings/notifications we assume they want
    // to know about academic-record-changing events.
    const prefs = await db.userNotificationPreferences.findUnique({
      where: { userId: input.residentId },
      select: {
        emailEnabled: true,
        notifyOnEpaVerified: true,
        notifyOnEpaReturned: true,
      },
    }).catch(() => null);

    if (prefs) {
      if (!prefs.emailEnabled) return;
      if (input.kind === "verified" && !prefs.notifyOnEpaVerified) return;
      if (input.kind === "returned" && !prefs.notifyOnEpaReturned) return;
    }

    const resident = await db.user.findUnique({
      where: { id: input.residentId },
      select: { email: true, name: true },
    });
    if (!resident?.email) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hippomedicine.com";

    const buildData = {
      residentName: resident.name || "there",
      residentEmail: resident.email,
      assessorName: input.assessorName,
      epaId: input.epaId,
      epaTitle: input.epaTitle,
      appUrl,
      reason: input.reason,
    };

    const email = input.kind === "verified"
      ? buildEpaVerifiedEmail(buildData)
      : buildEpaReturnedEmail(buildData);

    await sendEmail({
      to: resident.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[emails] sendResidentOutcomeEmail failed (non-fatal):", err);
  }
}
