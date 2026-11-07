"use client";

// Hippo Clinic — Reference add-on settings hook.
//
// localStorage-backed so the setting follows the device without requiring
// another Profile column on the shared HippoVFinal database. The cost: a
// new device starts with the feature off until the clinician opts in.
//
// Stored keys are prefixed `hippo.clinic.references.*` so they cluster
// in DevTools and so a future migration to a server-stored setting can
// scan for this prefix.

import { useCallback, useEffect, useState } from "react";

export type ReferenceRegion = "US" | "CA" | "EU" | "INT";

const KEY_ENABLED = "hippo.clinic.references.enabled";
const KEY_REGIONS = "hippo.clinic.references.regions";

const DEFAULT_REGIONS: ReferenceRegion[] = ["US", "CA", "EU"];

export interface ReferenceSettings {
  enabled: boolean;
  regions: ReferenceRegion[];
  setEnabled: (v: boolean) => void;
  setRegions: (v: ReferenceRegion[]) => void;
  /** True until the localStorage hydration completes — avoids SSR/CSR flicker. */
  hydrated: boolean;
}

export function useReferenceSettings(): ReferenceSettings {
  const [enabled, setEnabledRaw] = useState(false);
  const [regions, setRegionsRaw] = useState<ReferenceRegion[]>(DEFAULT_REGIONS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const e = localStorage.getItem(KEY_ENABLED);
      if (e === "true") setEnabledRaw(true);
      const r = localStorage.getItem(KEY_REGIONS);
      if (r) {
        const parsed = JSON.parse(r) as unknown;
        if (Array.isArray(parsed)) {
          const validated = parsed.filter((v): v is ReferenceRegion =>
            v === "US" || v === "CA" || v === "EU" || v === "INT");
          if (validated.length > 0) setRegionsRaw(validated);
        }
      }
    } catch { /* localStorage may be blocked; default-off is fine */ }
    setHydrated(true);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledRaw(v);
    try { localStorage.setItem(KEY_ENABLED, String(v)); } catch { /* ignore */ }
  }, []);

  const setRegions = useCallback((v: ReferenceRegion[]) => {
    const cleaned = v.length > 0 ? v : DEFAULT_REGIONS;
    setRegionsRaw(cleaned);
    try { localStorage.setItem(KEY_REGIONS, JSON.stringify(cleaned)); } catch { /* ignore */ }
  }, []);

  return { enabled, regions, setEnabled, setRegions, hydrated };
}
