// ---------------------------------------------------------------------------
// Hippo service worker — built with Serwist (Workbox fork maintained for
// Next.js App Router).
//
// The triple-slash directive below adds the "WebWorker" lib to THIS file's
// TypeScript context without pulling it into the main app tsconfig (which
// would conflict with window-DOM types like `Document`, `Event`, etc.).
/// <reference lib="webworker" />
//
// Scope is the whole origin (`/`). The withSerwist() wrapper in
// next.config.js compiles this file to /sw.js at build time and injects
// a pre-cache manifest of static assets so the app shell works offline.
//
// Runtime caching philosophy — ordered worst-pain-first:
//
//   1. Case logs + EPA submissions (mutations) — NEVER cache, NEVER queue
//      silently. These have their own background-sync fallback that we'll
//      wire in Phase 2 via a dedicated IndexedDB outbox. For now, any
//      POST/PATCH/DELETE falls straight through to network and surfaces
//      its failure so the UI can handle it explicitly.
//
//   2. Auth (/api/auth/*) — network-only. A stale /me response that says
//      "you're signed in" when you're not, or vice versa, is the worst
//      possible UX. No caching. Period.
//
//   3. Read-only /api/* GET — NetworkFirst with a 3s timeout + 24h cache
//      fallback. On poor hospital wifi, we spend 3 seconds trying fresh
//      data and fall back to the last successful response rather than
//      showing a blank screen. Cache is scoped per-URL so /api/cases for
//      user A can't leak to user B (though headers still vary the cache
//      entry by auth cookie).
//
//   4. Static app shell (JS, CSS, fonts, manifest) — StaleWhileRevalidate.
//      Old bundle boots instantly, new one downloads in background for
//      the next launch. This is what makes post-deploy loads feel native.
//
//   5. Images (icons, splash, avatars) — CacheFirst with 30-day expiry.
//      They almost never change; serving stale is free.
//
//   6. Google Fonts — CacheFirst with 1-year expiry on fonts, 7-day on
//      the stylesheet.
//
// A skipWaiting + clientsClaim pair lets a new SW take over immediately
// on deploy rather than waiting for all tabs to close. Fine for a
// single-tab PWA; would be riskier for a multi-tab desktop dashboard.
// ---------------------------------------------------------------------------

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // The precache manifest is injected at build time by @serwist/next.
  // Contains hashed chunk paths + static assets listed in public/.
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  // Order matters — first match wins. More specific patterns first.
  runtimeCaching: [
    // 1. Mutations → no cache. Fall through to network; app-level code
    //    handles offline queueing (Phase 2).
    {
      matcher: ({ request }) =>
        request.method !== "GET" && /^https?:\/\/.*\/api\//.test(request.url),
      handler: new NetworkOnly(),
    },

    // 2. Auth endpoints — never cache. Stale session state is dangerous.
    {
      matcher: /\/api\/auth\//,
      handler: new NetworkOnly(),
    },

    // 3. Stripe webhook + cron — server-to-server; SW shouldn't intercept.
    {
      matcher: /\/api\/(stripe\/webhook|cron)\//,
      handler: new NetworkOnly(),
    },

    // 4. Read-only API: cases, milestones, profile, EPAs, summaries, etc.
    //    NetworkFirst with 3s timeout + 24h cache for offline fallback.
    {
      matcher: ({ request, url }) =>
        request.method === "GET" && url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "hippo-api-get",
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },

    // 5. App shell JS / CSS from Next.js — stale-while-revalidate.
    //    The new bundle hash is in the URL, so stale responses are
    //    always the right stale response for that URL.
    {
      matcher: /^\/_next\/static\//,
      handler: new StaleWhileRevalidate({
        cacheName: "hippo-next-static",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 100 }),
        ],
      }),
    },

    // 6. Our own icons + splash + favicons — cache-first, 30 days.
    {
      matcher: /^\/(icons|splash)\/|\.(?:png|jpg|jpeg|webp|svg|ico)$/,
      handler: new CacheFirst({
        cacheName: "hippo-images",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },

    // 7. Google Fonts.
    {
      matcher: /^https:\/\/fonts\.googleapis\.com/,
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com/,
      handler: new CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          }),
        ],
      }),
    },

    // 8. Everything else — defer to Serwist's sensible defaults
    //    (NetworkFirst for documents, SWR for most other stuff).
    ...defaultCache,
  ],

  // Fallbacks — what to serve when every strategy above fails offline.
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// ── Push notification handler ────────────────────────────────────────
// Receives a web-push event from the server (createNotification → sendPushToUser)
// and renders an OS notification. Payload schema matches what the server
// produces in src/lib/notifications/push.ts:
//   { title, body, url, tag, data: { type, epaObservationId } }
//
// Known caveats:
//   - iOS does NOT honour `silent`, `vibrate`, `renotify`, or custom sounds.
//     We still set them because Android + desktop Chrome use them; iOS
//     just ignores and plays the user's default notification sound.
//   - On iOS, the notification only fires if the PWA is installed to the
//     home screen AND iOS 16.4+. Nothing we can do about that here.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json() as {
      title?: string;
      body?: string;
      url?: string;
      tag?: string;
      data?: Record<string, unknown>;
    };
    const title = payload.title ?? "Hippo";
    const options: NotificationOptions = {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      tag: payload.tag,
      // renotify: when a second push arrives with the same tag, still
      // vibrate + sound (on platforms that honour it) instead of silently
      // updating in place. Without this, repeated "EPA awaiting review"
      // pings feel invisible. TS's NotificationOptions doesn't expose
      // this field yet — cast around it.
      ...(payload.tag ? { renotify: true } : {}),
      // Don't require the user to dismiss — it's a notification, not a
      // dialog. The user will interact when they're ready.
      requireInteraction: false,
      data: {
        url: payload.url ?? "/notifications",
        ...(payload.data ?? {}),
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Malformed payload — show a generic notification so users still see
    // that something happened rather than silently dropping.
    event.waitUntil(
      self.registration.showNotification("Hippo", {
        body: "Open the app to see what's new.",
        icon: "/icons/icon-192.png",
        data: { url: "/notifications" },
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: string } | undefined;
  const url = data?.url ?? "/notifications";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Prefer the most-recently-focused existing window. On iOS PWAs,
      // `navigate()` is flaky — postMessage is more reliable. We send
      // the URL and let the client-side router handle the transition
      // with a proper in-SPA navigation (no full reload, no re-auth).
      for (const client of clients) {
        if ("focus" in client) {
          const windowClient = client as WindowClient;
          try {
            // Try postMessage first — the client listens for it and
            // routes inside the SPA. Falls through to navigate() if
            // nothing catches it.
            windowClient.postMessage({ type: "notification-click", url });
          } catch { /* no-op */ }
          try {
            await windowClient.navigate(url);
          } catch { /* navigate throws on cross-origin; ignore */ }
          return windowClient.focus();
        }
      }
      // No window open — spawn one.
      return self.clients.openWindow(url);
    })(),
  );
});

serwist.addEventListeners();
