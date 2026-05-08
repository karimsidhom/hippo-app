// ---------------------------------------------------------------------------
// Shared digest-email scaffolding.
//
// Every Hippo digest email (resident weekly, attending weekly, PD weekly,
// CC meeting prep) is rendered with the same brand chrome — Hippo word-
// mark + dark canvas + single primary CTA + dim footer with the unsub
// link. Building these inline in each route led to drift; this module is
// the single source of truth.
// ---------------------------------------------------------------------------

export interface DigestEmail {
  subject: string;
  html: string;
  text: string;
}

export interface DigestSection {
  /** Section title, e.g. "EPAs awaiting your sign-off" */
  heading: string;
  /** Lead line under the heading (optional). */
  intro?: string;
  /** Bulleted lines — rendered as a tight list. */
  bullets: string[];
  /** When set, renders a deep-link button under this section. */
  cta?: { label: string; href: string };
}

export interface BuildDigestArgs {
  /** Subject prefix and visible eyebrow ("Your week on Hippo") */
  eyebrow: string;
  /** Greeting line — "Hi Dr. {firstName}" */
  greeting: string;
  /** Page-level subject — used in the email subject and the lead paragraph. */
  subjectLead: string;
  /** Body sections, rendered top to bottom. */
  sections: DigestSection[];
  /** The single most-important CTA — rendered prominently at the bottom. */
  primaryCta: { label: string; href: string };
  /** Settings deep-link for the unsubscribe footer. */
  unsubscribeUrl: string;
  /** Plain-language reason, e.g. "you opted into weekly resident digests". */
  unsubscribeReason: string;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000'
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://hippomedicine.com';

/**
 * Build a brand-aware digest email. Caller supplies the body sections;
 * we wrap them in the standard Hippo chrome so every digest looks like
 * it came from the same product.
 */
export function buildDigestEmail(args: BuildDigestArgs): DigestEmail {
  const subject = `${args.subjectLead}`;
  const text = buildText(args);
  const html = buildHtml(args);
  return { subject, html, text };
}

function buildText(args: BuildDigestArgs): string {
  const lines: string[] = [args.greeting, ''];
  for (const section of args.sections) {
    lines.push(section.heading);
    if (section.intro) lines.push(section.intro);
    for (const bullet of section.bullets) lines.push(`  • ${bullet}`);
    if (section.cta) lines.push(`  ${section.cta.label}: ${absoluteUrl(section.cta.href)}`);
    lines.push('');
  }
  lines.push(`${args.primaryCta.label}: ${absoluteUrl(args.primaryCta.href)}`);
  lines.push('');
  lines.push('---');
  lines.push(`You're receiving this because ${args.unsubscribeReason}.`);
  lines.push(`Manage notifications: ${absoluteUrl(args.unsubscribeUrl)}`);
  lines.push('');
  lines.push('— Hippo');
  return lines.join('\n');
}

function buildHtml(args: BuildDigestArgs): string {
  const sections = args.sections
    .map((s) => renderSection(s))
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(args.subjectLead)}</title>
</head>
<body style="margin:0;padding:0;background:#060d13;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;-webkit-font-smoothing:antialiased;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;color:#0EA5E9;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:6px;">
        ${escape(args.eyebrow)}
      </div>
      <div style="font-size:26px;font-weight:700;color:#e2e8f0;letter-spacing:-0.6px;">
        Hippo
      </div>
    </div>

    <div style="background:rgba(14,165,233,0.015);border:1px solid rgba(255,255,255,0.04);border-radius:18px;padding:28px 22px;">
      <p style="font-size:15px;line-height:1.55;color:#e2e8f0;margin:0 0 8px;">
        ${escape(args.greeting)}
      </p>
      <p style="font-size:14px;line-height:1.55;color:rgba(226,232,240,0.65);margin:0 0 22px;">
        ${escape(args.subjectLead)}
      </p>

      ${sections}

      <a href="${escape(absoluteUrl(args.primaryCta.href))}" style="display:block;text-align:center;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#ffffff;font-size:14px;font-weight:600;padding:13px 22px;border-radius:12px;text-decoration:none;letter-spacing:0.01em;margin-top:24px;box-shadow:0 4px 24px -4px rgba(14,165,233,0.35);">
        ${escape(args.primaryCta.label)}
      </a>
    </div>

    <div style="text-align:center;margin-top:22px;">
      <p style="color:rgba(226,232,240,0.32);font-size:11px;line-height:1.6;margin:0;">
        You're receiving this because ${escape(args.unsubscribeReason)}.<br>
        <a href="${escape(absoluteUrl(args.unsubscribeUrl))}" style="color:rgba(226,232,240,0.45);">Manage notifications</a>
      </p>
      <p style="color:rgba(226,232,240,0.32);font-size:11px;margin:8px 0 0;">
        <a href="${APP_URL}" style="color:rgba(226,232,240,0.45);">Hippo</a> — surgical education, simplified.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function renderSection(section: DigestSection): string {
  const bullets = section.bullets
    .map(
      (b) =>
        `<li style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-size:13px;line-height:1.55;color:rgba(226,232,240,0.78);">${escape(b)}</li>`,
    )
    .join('');

  const sectionCta = section.cta
    ? `<a href="${escape(absoluteUrl(section.cta.href))}" style="display:inline-block;font-size:12px;color:#38bdf8;text-decoration:none;margin-top:8px;">${escape(section.cta.label)} →</a>`
    : '';

  const intro = section.intro
    ? `<p style="font-size:12px;line-height:1.55;color:rgba(226,232,240,0.55);margin:0 0 8px;">${escape(section.intro)}</p>`
    : '';

  return `
      <div style="margin-bottom:18px;">
        <div style="font-size:10px;font-weight:600;color:rgba(226,232,240,0.45);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">
          ${escape(section.heading)}
        </div>
        ${intro}
        <ul style="list-style:none;padding:0;margin:0;">
          ${bullets}
        </ul>
        ${sectionCta}
      </div>`;
}

function absoluteUrl(href: string): string {
  if (/^https?:/i.test(href)) return href;
  if (href.startsWith('/')) return `${APP_URL}${href}`;
  return `${APP_URL}/${href}`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
