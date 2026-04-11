import {
  DEFAULT_STYLE_PROFILE,
  type StyleProfile,
} from "./profile";

// ---------------------------------------------------------------------------
// Pure helpers for validating and merging StyleProfile blobs.
//
// These are separated from `./store.ts` because `store.ts` has side effects
// (localStorage) and can't be imported from an API route. The helpers here
// are pure functions shared between the server-side API handler and the
// client-side store wrapper.
// ---------------------------------------------------------------------------

/**
 * Shape-check a value to decide if it's a plausible StyleProfile. We don't
 * validate every nested field — the schema is forgiving by design — but we
 * reject obvious garbage (null, strings, missing `global`, wrong version).
 */
export function isStyleProfile(value: unknown): value is StyleProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<StyleProfile>;
  if (v.version !== 1) return false;
  if (!v.global || typeof v.global !== "object") return false;
  if (!v.services || typeof v.services !== "object") return false;
  if (!v.noteTypes || typeof v.noteTypes !== "object") return false;
  if (!Array.isArray(v.examples)) return false;
  return true;
}

/**
 * Shallow-merge a patch into a StyleProfile, matching the semantics of
 * `mergeStyleProfile()` in store.ts. Pure — returns a new object.
 */
export function mergeProfiles(
  current: StyleProfile,
  patch: Partial<StyleProfile>,
): StyleProfile {
  return {
    ...current,
    ...patch,
    version: 1,
    global: { ...current.global, ...(patch.global ?? {}) },
    services: { ...current.services, ...(patch.services ?? {}) },
    noteTypes: { ...current.noteTypes, ...(patch.noteTypes ?? {}) },
    examples: [...current.examples, ...(patch.examples ?? [])],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * A guaranteed-valid StyleProfile — useful as a fallback when the stored
 * value fails `isStyleProfile` (corrupt localStorage, schema drift, etc.).
 */
export function safeProfile(value: unknown): StyleProfile {
  return isStyleProfile(value) ? value : DEFAULT_STYLE_PROFILE;
}
