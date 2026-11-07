import { DEFAULT_STYLE_PROFILE, type StyleProfile } from "./profile";
import { isStyleProfile, mergeProfiles, safeProfile } from "./serialize";

// ---------------------------------------------------------------------------
// Style profile store — client-side facade over the server-backed API.
//
// History: v1 of this file persisted to localStorage only. v2 (this file)
// adds a durable Postgres backing store keyed by userId at
// `/api/dictation/style`, while keeping a synchronous in-memory + localStorage
// cache so the operative builder can still call `getStyleProfile()` without
// awaiting a network round trip.
//
// Read path:  in-memory cache → localStorage → DEFAULT_STYLE_PROFILE.
// Write path: update in-memory cache + localStorage immediately, then fire
//             a background PATCH to the server. Writes coalesce so a burst of
//             edits turns into at most one in-flight request at a time.
//
// Non-logged-in contexts (SSR, marketing pages, the operative builder running
// in a server component) degrade gracefully to the localStorage path — the
// server write is a no-op there and the API call simply never fires.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "hippo.dictation.styleProfile.v1";

// In-memory cache used by the synchronous getters.
let memoryProfile: StyleProfile | null = null;

// Most recent server-sync state so writers can decide whether to sync.
let lastServerSync: number = 0;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readFromLocalStorage(): StyleProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isStyleProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(profile: StyleProfile): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota or disabled — in-memory copy is still valid.
  }
}

/**
 * Synchronous read — returns the cached profile (memory → localStorage →
 * default). The server fetch that hydrates this cache is fired from
 * `hydrateStyleProfile()` on app mount; see `useStyleProfile` / the app
 * layout.
 */
export function getStyleProfile(): StyleProfile {
  if (memoryProfile) return memoryProfile;
  const fromStorage = readFromLocalStorage();
  if (fromStorage) {
    memoryProfile = fromStorage;
    return fromStorage;
  }
  return DEFAULT_STYLE_PROFILE;
}

/**
 * Synchronous write — updates the local cache immediately and schedules a
 * background PATCH so corrections feel instant.
 */
export function setStyleProfile(profile: StyleProfile): void {
  memoryProfile = profile;
  writeToLocalStorage(profile);
  scheduleServerSync("put", profile);
}

/**
 * Reset the profile back to DEFAULT_STYLE_PROFILE everywhere (memory,
 * localStorage, and server). Used by the settings page's "Reset" button.
 */
export function resetStyleProfile(): void {
  memoryProfile = DEFAULT_STYLE_PROFILE;
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  scheduleServerSync("delete", null);
}

/**
 * Shallow-merge new preferences into the stored profile and persist.
 */
export function mergeStyleProfile(patch: Partial<StyleProfile>): StyleProfile {
  const current = getStyleProfile();
  const next = mergeProfiles(current, patch);
  memoryProfile = next;
  writeToLocalStorage(next);
  scheduleServerSync("patch", patch);
  return next;
}

// ---------------------------------------------------------------------------
// Async hydration — called once on app mount to pull the server-side
// profile into the synchronous cache. If the user is not logged in (401),
// we silently stay on the localStorage path.
// ---------------------------------------------------------------------------

let hydratePromise: Promise<StyleProfile> | null = null;

/**
 * Pull the server-side StyleProfile into the cache. If there's no row yet
 * and we have a localStorage profile, upload it as the initial value so the
 * user's historic corrections survive the upgrade from v1 (localStorage-only)
 * to v2 (server-backed).
 */
export async function hydrateStyleProfile(): Promise<StyleProfile> {
  if (!isBrowser()) return getStyleProfile();
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const res = await fetch("/api/dictation/style", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        // Not logged in — stay on local-only path.
        return getStyleProfile();
      }
      if (!res.ok) {
        return getStyleProfile();
      }
      const remote = (await res.json()) as unknown;
      const remoteProfile = safeProfile(remote);

      // Migration: if the remote profile is the default and we have a
      // non-trivial local profile, upload the local one so pre-v2 users
      // don't lose what they've taught the app.
      const local = readFromLocalStorage();
      const remoteIsPristine =
        (remoteProfile.global.correctionCount ?? 0) === 0 &&
        remoteProfile.examples.length === 0;
      const localHasContent =
        !!local &&
        ((local.global.correctionCount ?? 0) > 0 || local.examples.length > 0);

      if (remoteIsPristine && localHasContent) {
        try {
          const put = await fetch("/api/dictation/style", {
            method: "PUT",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(local),
          });
          if (put.ok) {
            const migrated = (await put.json()) as unknown;
            const final = safeProfile(migrated);
            memoryProfile = final;
            writeToLocalStorage(final);
            lastServerSync = Date.now();
            return final;
          }
        } catch {
          // fall through and use the remote default
        }
      }

      memoryProfile = remoteProfile;
      writeToLocalStorage(remoteProfile);
      lastServerSync = Date.now();
      return remoteProfile;
    } catch {
      return getStyleProfile();
    } finally {
      // Allow re-hydration on navigation events.
      setTimeout(() => {
        hydratePromise = null;
      }, 0);
    }
  })();

  return hydratePromise;
}

// ---------------------------------------------------------------------------
// Background sync — coalesces writes so a burst of edits becomes a single
// in-flight PATCH.
// ---------------------------------------------------------------------------

type PendingSync =
  | { kind: "patch"; patch: Partial<StyleProfile> }
  | { kind: "put"; profile: StyleProfile }
  | { kind: "delete" };

let pending: PendingSync | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleServerSync(
  op: "patch" | "put" | "delete",
  payload: Partial<StyleProfile> | StyleProfile | null,
): void {
  if (!isBrowser()) return;

  // Coalesce: a DELETE wins, a PUT replaces any pending PATCH, a PATCH merges
  // into any existing pending PATCH.
  if (op === "delete") {
    pending = { kind: "delete" };
  } else if (op === "put") {
    pending = { kind: "put", profile: payload as StyleProfile };
  } else if (op === "patch") {
    const newPatch = payload as Partial<StyleProfile>;
    if (pending && pending.kind === "patch") {
      pending = { kind: "patch", patch: mergePatches(pending.patch, newPatch) };
    } else if (pending && pending.kind === "put") {
      // A pending full-profile PUT + a subsequent PATCH means we should
      // fold the patch into the PUT before sending.
      pending = {
        kind: "put",
        profile: mergeProfiles(pending.profile, newPatch),
      };
    } else {
      pending = { kind: "patch", patch: newPatch };
    }
  }

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 400);
}

function mergePatches(
  a: Partial<StyleProfile>,
  b: Partial<StyleProfile>,
): Partial<StyleProfile> {
  return {
    ...a,
    ...b,
    global: { ...(a.global ?? {}), ...(b.global ?? {}) },
    services: { ...(a.services ?? {}), ...(b.services ?? {}) },
    noteTypes: { ...(a.noteTypes ?? {}), ...(b.noteTypes ?? {}) },
    examples: [...(a.examples ?? []), ...(b.examples ?? [])],
  } as Partial<StyleProfile>;
}

async function flush(): Promise<void> {
  if (!isBrowser() || !pending) return;
  const op = pending;
  pending = null;
  flushTimer = null;

  try {
    if (op.kind === "delete") {
      const res = await fetch("/api/dictation/style", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const next = safeProfile(await res.json());
        memoryProfile = next;
        writeToLocalStorage(next);
        lastServerSync = Date.now();
      }
    } else if (op.kind === "put") {
      const res = await fetch("/api/dictation/style", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(op.profile),
      });
      if (res.ok) {
        lastServerSync = Date.now();
      }
    } else if (op.kind === "patch") {
      const res = await fetch("/api/dictation/style", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(op.patch),
      });
      if (res.ok) {
        lastServerSync = Date.now();
      }
    }
  } catch {
    // Network errors are non-fatal — the local cache is still correct.
    // The next successful write will bring the server back in sync.
  }
}

/** Used by tests / devtools. */
export function getLastServerSync(): number {
  return lastServerSync;
}

/** Force-flush pending writes before navigation away. */
export function flushStyleProfileWrites(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  return flush();
}
