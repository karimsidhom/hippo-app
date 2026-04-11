import { DEFAULT_STYLE_PROFILE, type StyleProfile } from "./profile";

// ---------------------------------------------------------------------------
// Style profile persistence.
//
// For the first landing we persist to localStorage (client-only). The store
// degrades gracefully to an in-memory copy when run in a non-browser context
// so server-side imports of the operative builder don't crash.
//
// TODO: migrate to a server-backed store (Prisma `UserDictationStyle` table)
// so the profile follows the user across devices.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "hippo.dictation.styleProfile.v1";

let memoryProfile: StyleProfile | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStyleProfile(): StyleProfile {
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StyleProfile;
        if (parsed.version === 1) return parsed;
      }
    } catch {
      // fall through to default
    }
  }
  return memoryProfile ?? DEFAULT_STYLE_PROFILE;
}

export function setStyleProfile(profile: StyleProfile): void {
  memoryProfile = profile;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // localStorage may be full or unavailable; memory copy still valid
    }
  }
}

export function resetStyleProfile(): void {
  memoryProfile = null;
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Shallow-merge new preferences into the stored profile and persist.
 */
export function mergeStyleProfile(patch: Partial<StyleProfile>): StyleProfile {
  const current = getStyleProfile();
  const next: StyleProfile = {
    ...current,
    ...patch,
    global: { ...current.global, ...(patch.global ?? {}) },
    services: { ...current.services, ...(patch.services ?? {}) },
    noteTypes: { ...current.noteTypes, ...(patch.noteTypes ?? {}) },
    examples: [...current.examples, ...(patch.examples ?? [])],
    updatedAt: new Date().toISOString(),
  };
  setStyleProfile(next);
  return next;
}
