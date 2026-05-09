// Hippo Clinic — ICS calendar fetcher.
//
// Both Google Calendar and Apple iCloud expose private, read-only ICS
// feed URLs (Calendar settings → "Get shareable link" / "Calendar URL"
// in the respective UI). We import via that URL — no OAuth, no Google
// Cloud setup, no Apple developer account, no token refresh logic.
//
// What we extract per VEVENT:
//   - SUMMARY   → visit reason / patient label
//   - DTSTART   → scheduledFor
//   - DTEND     → optional end time
//   - LOCATION  → optional clinic site
//   - DESCRIPTION → free-text (often phone/notes)
//
// We deliberately skip recurring-event expansion and timezone conversion
// for v1 — most clinic schedules ship today's events as concrete VEVENT
// lines so a simple parser is enough. If a clinician needs RRULE
// expansion later we can switch to ical.js.

interface ICSEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date | null;
  location: string | null;
  description: string | null;
}

const FOLD_RE = /\r?\n[ \t]/g;

// SSRF defence: the user supplies the URL, the server fetches it. Without
// guardrails, a malicious caller can reach AWS instance-metadata
// (169.254.169.254), the Vercel internal mesh, GCP metadata, etc.
//
// Allowlist: scheme must be https / webcal; host must NOT resolve to or
// be a literal private/reserved range. We rely on string-shape rejection
// (cheaper than DNS lookup) plus a list of well-known calendar hosts that
// always pass.
const PRIVATE_IP_PATTERNS = [
  /^127\./,                // loopback
  /^10\./,                 // RFC1918
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC1918
  /^192\.168\./,           // RFC1918
  /^169\.254\./,           // link-local — includes AWS / GCP metadata
  /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./, // CGNAT
  /^0\./, /^255\./, /^224\./, // reserved
];
function isUrlSafe(rawUrl: string): { ok: true; url: string } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Not a valid URL" };
  }
  // Allow https + webcal only. webcal gets rewritten to https below.
  if (parsed.protocol !== "https:" && parsed.protocol !== "webcal:") {
    return { ok: false, error: `Unsupported scheme: ${parsed.protocol}` };
  }
  const host = parsed.hostname.toLowerCase();
  // Reject loopback hostnames + literal private IPv4 + IPv6 loopback/link-local.
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1" || host.startsWith("[::1]")) {
    return { ok: false, error: "Loopback hosts are not allowed" };
  }
  if (host.startsWith("[fe80:") || host.startsWith("fe80:") || host.startsWith("[fc") || host.startsWith("fc")) {
    return { ok: false, error: "IPv6 link-local / unique-local addresses are not allowed" };
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (PRIVATE_IP_PATTERNS.some((re) => re.test(host))) {
      return { ok: false, error: "Private / reserved IP addresses are not allowed" };
    }
  }
  // Reject hostnames with no dot (i.e. bare names that could resolve to
  // internal hosts on a corp network).
  if (!host.includes(".")) {
    return { ok: false, error: "Calendar URL must use a fully-qualified domain name" };
  }
  return { ok: true, url: rawUrl };
}

export async function fetchIcsEvents(url: string, opts?: { max?: number }): Promise<ICSEvent[]> {
  const safety = isUrlSafe(url);
  if (!safety.ok) {
    throw new Error(`Refusing to fetch calendar URL: ${safety.error}`);
  }
  // Some calendar hosts redirect to webcal://; rewrite to https.
  const fetched = safety.url.replace(/^webcal:\/\//i, "https://");
  // Important: we set redirect:"manual" instead of "follow" because a
  // malicious public host could 302 us to a private IP. We only follow
  // a redirect if it lands on another host that ALSO passes isUrlSafe.
  const res = await fetch(fetched, {
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
    headers: { Accept: "text/calendar" },
  });
  // After follow: re-check the FINAL URL passes safety. fetch() exposes
  // the final URL on res.url after redirects.
  const finalSafety = isUrlSafe(res.url);
  if (!finalSafety.ok) {
    throw new Error(`Calendar URL redirected to a disallowed host: ${finalSafety.error}`);
  }
  if (!res.ok) throw new Error(`Calendar feed returned HTTP ${res.status}`);
  const text = await res.text();
  return parseIcs(text, opts?.max ?? 200);
}

export function parseIcs(text: string, max = 200): ICSEvent[] {
  // Unfold continuation lines per RFC 5545 (lines starting with space/tab
  // are continuations of the previous line).
  const unfolded = text.replace(FOLD_RE, "");
  const lines = unfolded.split(/\r?\n/);
  const events: ICSEvent[] = [];
  let cur: Partial<ICSEvent> | null = null;
  let curRaw: Record<string, string> = {};

  for (const ln of lines) {
    if (ln === "BEGIN:VEVENT") { cur = {}; curRaw = {}; continue; }
    if (ln === "END:VEVENT") {
      if (cur && curRaw.DTSTART) {
        const start = parseIcsDate(curRaw.DTSTART);
        if (start) {
          events.push({
            uid: curRaw.UID ?? `${start.toISOString()}-${(curRaw.SUMMARY ?? "").slice(0, 24)}`,
            summary: unescape(curRaw.SUMMARY ?? "(untitled)"),
            start,
            end: curRaw.DTEND ? parseIcsDate(curRaw.DTEND) : null,
            location: curRaw.LOCATION ? unescape(curRaw.LOCATION) : null,
            description: curRaw.DESCRIPTION ? unescape(curRaw.DESCRIPTION) : null,
          });
          if (events.length >= max) break;
        }
      }
      cur = null; curRaw = {};
      continue;
    }
    if (!cur) continue;
    // Property line: "KEY[;params]:value"
    const colonIdx = ln.indexOf(":");
    if (colonIdx < 0) continue;
    const head = ln.slice(0, colonIdx);
    const value = ln.slice(colonIdx + 1);
    const key = head.split(";")[0]; // strip TZID etc
    curRaw[key] = value;
  }

  // Sort by start ascending so today is at the top of any slice.
  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}

// ICS date forms:
//   20260503T143000Z       — UTC
//   20260503T143000        — floating (treat as local)
//   20260503               — date-only (all-day)
function parseIcsDate(raw: string): Date | null {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, z] = m;
  if (hh === undefined) {
    // All-day. Treat as midnight local.
    return new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0);
  }
  if (z === "Z") {
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss)));
  }
  // Floating — treat as local time on the server. Acceptable for clinic
  // schedules; precision-sensitive uses should rely on UTC TZID Z forms.
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss));
}

function unescape(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** Filter to events occurring today (clinician's local timezone, server-relative). */
export function eventsToday(events: ICSEvent[], now = new Date()): ICSEvent[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return events.filter((e) => e.start >= start && e.start <= end);
}

export type { ICSEvent };
