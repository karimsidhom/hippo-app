// ---------------------------------------------------------------------------
// Email sending utility — uses Resend
// ---------------------------------------------------------------------------

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Hippo <noreply@hippomedicine.com>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend.
 * Returns true on success, false on failure (never throws).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }

    console.log(`[email] Sent to ${opts.to}: ${opts.subject}`);
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// EPA review notification email
// ---------------------------------------------------------------------------

export interface EpaReviewEmailData {
  assessorName: string;
  assessorEmail: string;
  residentName: string;
  epaId: string;
  epaTitle: string;
  procedureName: string;
  caseDate: string;
  reviewUrl: string;
}

export function buildEpaReviewEmail(data: EpaReviewEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `EPA Sign-off Request: ${data.epaId} — ${data.procedureName}`;

  const text = `Hi Dr. ${data.assessorName},

${data.residentName} is requesting your sign-off on an EPA observation.

EPA: ${data.epaId} — ${data.epaTitle}
Procedure: ${data.procedureName}
Date: ${data.caseDate}

Please review and sign off here:
${data.reviewUrl}

This link does not require a login.

— Hippo (hippomedicine.com)`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e1520;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:24px;font-weight:700;color:#e2e8f0;letter-spacing:-0.5px;">
        🦛 Hippo
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">EPA Sign-off Request</div>
    </div>

    <!-- Card -->
    <div style="background:#141c28;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;">
      <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi Dr. ${escapeHtml(data.assessorName)},
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        <strong style="color:#e2e8f0;">${escapeHtml(data.residentName)}</strong> is requesting your sign-off on an EPA observation.
      </p>

      <!-- EPA details -->
      <div style="background:#0e1520;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:700;color:#0ea5e9;background:rgba(14,165,233,0.12);padding:2px 8px;border-radius:4px;font-family:monospace;">
            ${escapeHtml(data.epaId)}
          </span>
          <span style="font-size:13px;font-weight:600;color:#e2e8f0;">${escapeHtml(data.epaTitle)}</span>
        </div>
        <div style="font-size:13px;color:#94a3b8;line-height:1.5;">
          <strong>Procedure:</strong> ${escapeHtml(data.procedureName)}<br>
          <strong>Date:</strong> ${escapeHtml(data.caseDate)}
        </div>
      </div>

      <!-- CTA button -->
      <a href="${escapeHtml(data.reviewUrl)}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
        Review &amp; Sign Off
      </a>

      <p style="color:#64748b;font-size:12px;text-align:center;margin:14px 0 0;line-height:1.5;">
        This link does not require a login.<br>
        You can review the observation, provide feedback, and sign off directly.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#475569;font-size:11px;margin:0;">
        Sent via <a href="https://hippomedicine.com" style="color:#64748b;">Hippo</a> — surgical education, simplified.
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
