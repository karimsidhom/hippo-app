"use client";

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// useNotifications — single hook that owns the in-app notification state.
//
// Responsibilities:
//   - Fetch the current list + unreadCount from /api/notifications.
//   - Poll loosely (30s) so the bell badge stays fresh without being
//     chatty. When the page is hidden, polling pauses.
//   - Expose markRead(id) and markAllRead().
//   - Expose refresh() for after a user action that the server will
//     have generated a notification from.
//
// Not responsible for:
//   - Web-push subscription — that's enablePush() in lib/notifications/client.
//   - Rendering — any UI (bell, page, sheet) consumes from this hook.
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  epaObservationId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000;

export function useNotifications(options: { limit?: number } = {}): UseNotificationsResult {
  const { limit = 30 } = options;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?limit=${limit}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        // 401 is expected briefly during the auth boot cycle; don't treat
        // as an error we surface to the UI.
        if (res.status === 401) {
          setError(null);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Initial load + polling. Pauses when the tab is hidden.
  useEffect(() => {
    void fetchList();

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => { void fetchList(); }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchList(); // refresh immediately on return
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchList]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic — unread -> read in the UI before the server confirms.
    setNotifications(prev =>
      prev.map(n => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      }
    } catch {
      // Server will still have us mark-read on the next refresh; not
      // worth rolling back the optimistic UI for a transient failure.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic
    setNotifications(prev =>
      prev.map(n => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
    );
    setUnreadCount(0);
    try {
      await fetch(`/api/notifications/read-all`, { method: "POST" });
    } catch {
      /* non-fatal */
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchList,
    markRead,
    markAllRead,
  };
}
