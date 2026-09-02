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
  const last = lastNameOf(name);
  return last ? `Dr. ${last}` : fallback;
}
