/**
 * Name helpers shared by the client and the API.
 *
 * Users type honorifics into the name field ("Dr. Justin Chan") and the app
 * then adds its own "Dr." in greetings, producing "Dr. Dr.". The stored name
 * is therefore always honorific-free, and anything that wants "Dr." adds it
 * through `doctorName` below.
 */

const HONORIFIC = /^\s*(?:dr|doctor|prof|professor|mr|mrs|ms|mx)\.?\s+/i;

/** "Dr. Justin Chan" -> "Justin Chan". Collapses inner whitespace. */
export function stripHonorific(name?: string | null): string {
  if (!name) return "";
  let out = name.trim();
  // Loop so "Dr. Dr. Chan" also comes out clean.
  while (HONORIFIC.test(out)) out = out.replace(HONORIFIC, "");
  return out.replace(/\s+/g, " ").trim();
}

export function firstNameOf(name?: string | null, fallback = ""): string {
  const clean = stripHonorific(name);
  return clean ? clean.split(" ")[0] : fallback;
}

export function lastNameOf(name?: string | null, fallback = ""): string {
  const clean = stripHonorific(name);
  if (!clean) return fallback;
  const parts = clean.split(" ");
  return parts[parts.length - 1];
}

/**
 * "Justin Chan" -> "Dr. Chan"; "Karim" -> "Dr. Karim"; empty -> fallback.
 * The fallback is returned as-is (it is the whole greeting word).
 */
export function doctorName(name?: string | null, fallback = "Doctor"): string {
  if (looksLikeHandle(name)) return fallback;
  const last = lastNameOf(name);
  if (!last) return fallback;
  // "karim sidhom" greets as "Dr. Sidhom"; mixed case ("McLeod") is kept.
  const shown = last === last.toLowerCase() ? last.charAt(0).toUpperCase() + last.slice(1) : last;
  return `Dr. ${shown}`;
}

/**
 * True when the stored name is really an email or a username rather than a
 * person's name. Accounts created before onboarding captured a name were
 * seeded with the email's local part ("karimsidhom"), and "Dr. karimsidhom"
 * reads as a bug. Such names fall back to the caller's greeting word. The
 * stored value is left untouched (the DB stays the source of truth).
 */
export function looksLikeHandle(name?: string | null): boolean {
  const clean = stripHonorific(name);
  if (!clean) return false;
  if (/[@_\d]/.test(clean)) return true;
  // A single all-lowercase token ("karimsidhom") is a handle, not a name.
  return !clean.includes(" ") && clean === clean.toLowerCase();
}
