'use client';

import { useCallback, useEffect, useState } from 'react';
import type { InboxItem } from '@/lib/link/types';

/**
 * Hippo Link inbox: pending handoffs for this user. Fetches on mount, then
 * every `pollMs` while the tab is visible, and again when it comes back into
 * view. Polling is the Phase 2 delivery; realtime can replace it later.
 */
export function useLinkInbox({ pollMs = 60_000, enabled = true }: { pollMs?: number; enabled?: boolean } = {}) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/link/inbox', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: InboxItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Offline or signed out: keep what we have.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const visible = () => document.visibilityState === 'visible';
    const timer = window.setInterval(() => { if (visible()) void refresh(); }, pollMs);
    const onVisible = () => { if (visible()) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, pollMs, refresh]);

  /** Drop an item locally after Log or Dismiss, without waiting for the next poll. */
  const remove = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  return { items, count: items.length, loaded, refresh, remove };
}
