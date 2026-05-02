"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_DICTATION_PREFERENCES,
  type DictationPreferences,
} from "./preferences";

// ---------------------------------------------------------------------------
// useDictationPreferences()
//
// Client-side hook that loads the current user's dictation preferences and
// keeps them in memory for as long as the component is mounted.
// Cached in a module-level variable so the second mount inside the same
// browser session is instant.
//
// Falls back to DEFAULT_DICTATION_PREFERENCES on error.
// ---------------------------------------------------------------------------

let cached: DictationPreferences | null = null;
let inFlight: Promise<DictationPreferences> | null = null;

async function loadPreferences(): Promise<DictationPreferences> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = fetch("/api/dictation/preferences")
    .then(async (r) => {
      if (!r.ok) return DEFAULT_DICTATION_PREFERENCES;
      const j = (await r.json()) as DictationPreferences;
      cached = j;
      return j;
    })
    .catch(() => DEFAULT_DICTATION_PREFERENCES)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function clearDictationPreferencesCache() {
  cached = null;
}

export function useDictationPreferences(): {
  preferences: DictationPreferences;
  loading: boolean;
} {
  const [prefs, setPrefs] = useState<DictationPreferences>(
    cached ?? DEFAULT_DICTATION_PREFERENCES,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) {
      setPrefs(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadPreferences()
      .then((p) => {
        if (!cancelled) setPrefs(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { preferences: prefs, loading };
}
