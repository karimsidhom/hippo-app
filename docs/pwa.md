# Hippo PWA — Architecture & Operational Notes

This document covers the progressive web app layer: why each piece exists,
how to test it, and how to change it without breaking production users.

**Phase 1 (shipped)** — installable, offline app shell, iOS install prompt
**Phase 2 (next)** — offline case logging via IndexedDB + background sync
**Phase 3 (later)** — push notifications wired to real platform events

---

## Architecture at a glance

| Piece | Lives in | Purpose |
|---|---|---|
| Manifest | `public/manifest.json` | Declares name, icons, display mode, shortcuts |
| Icons | `public/icons/` + `public/apple-touch-icon.png` + `public/favicon-*` | Home-screen + browser-tab visuals |
| iOS splash | `public/splash/` | iOS Safari PWA launch splash per device |
| iOS meta | `src/app/layout.tsx` `appleWebApp` object | Legacy Apple-specific install metadata |
| Service worker | `src/app/sw.ts` (source) → `public/sw.js` (build output) | Cache strategies + offline fallback + push handlers |
| Offline page | `src/app/offline/page.tsx` | What the SW serves when a nav fails and no cache exists |
| Install prompt | `src/components/IOSInstallPrompt.tsx` | One-time iOS Add-to-Home-Screen explainer |
| Serwist config | `next.config.js` `withSerwist` wrap | Compiles sw.ts, injects precache manifest |

---

## Feature flag: kill the service worker remotely

A broken SW can brick returning users because browsers trust the cached
shell over a network refresh. You need an escape hatch.

Set the Vercel env var:

```
NEXT_PUBLIC_PWA_DISABLED=true
```

Redeploy. The `withSerwist` wrap in `next.config.js` will skip compiling
`sw.ts`, and the absence of `/sw.js` in the static output means the next
client fetch will see a 404 and the browser's SW registration will be
cleared on the next navigation.

Default: PWA is **enabled in production builds**, **disabled in `next dev`**
(the dev server bypasses the SW so local changes show up instantly).

---

## Cache strategies (the actual policies in `src/app/sw.ts`)

Ordered worst-pain-first — the first matcher wins:

1. **Mutations** (POST/PATCH/DELETE to `/api/*`) → `NetworkOnly`.
   No silent queueing. Phase 2 adds an explicit IndexedDB outbox so
   users see what's pending sync rather than discovering missing data
   later.
2. **Auth endpoints** (`/api/auth/*`) → `NetworkOnly`. A cached /me that
   says "you're signed in" when you're not is catastrophic.
3. **Webhook + cron** (`/api/stripe/webhook`, `/api/cron/*`) → `NetworkOnly`.
4. **Read-only API GETs** → `NetworkFirst`, 3s timeout, 24h cache fallback.
   Hospital-wifi-friendly: try fresh for 3s, serve stale on failure.
5. **Next static chunks** (`/_next/static/*`) → `StaleWhileRevalidate`.
   Stale is safe because URLs are content-hashed.
6. **Icons / splash / images** → `CacheFirst`, 30 days.
7. **Google Fonts** → standard split (stylesheet SWR 7d, fonts CacheFirst 1y).
8. **Everything else** → Serwist's `defaultCache`.

The `/offline` fallback is precached so it's available on the very first
offline navigation, not just after the user has visited it once.

---

## Testing offline mode

### Chrome DevTools (fastest feedback loop)

1. Production build: `npm run build && npm start` (SW only compiles in prod)
2. Open `http://localhost:3000` in Chrome
3. DevTools → **Application** tab → **Service Workers**
4. Verify "hippo" SW is `activated and is running`
5. DevTools → **Network** tab → **Offline** checkbox
6. Refresh. You should see cached content. Navigate to a route you
   haven't visited — you get the `/offline` page.
7. Try a POST (log a case) while offline — it should fail (NetworkOnly
   mutation policy). Phase 2 will turn this into a queued retry.

### iOS Safari

Only possible on the deployed site, not `localhost` (iOS blocks SW on
HTTP origins):

1. Visit `hippomedicine.com` in Safari on your iPhone
2. Let the PWA install prompt appear (after 4s)
3. Install via Share → Add to Home Screen
4. Airplane mode on
5. Launch from home screen. App should come up, cached routes work.

### Android Chrome

1. `hippomedicine.com` in Chrome on Android
2. Chrome shows its own native install banner — tap install
3. Settings → Network → Airplane mode
4. Launch. Works.

---

## Updating icons

The PNG icons in `public/icons/` are **rasterized from** `public/hippo-mark.svg`.
Regenerate when the source SVG changes:

```bash
# Install deps once — they're Homebrew, no Node impact
brew install librsvg imagemagick

# From repo root:
for size in 16 32 72 96 120 128 144 152 180 192 256 384 512; do
  rsvg-convert -w $size -h $size public/hippo-mark.svg -o public/icons/icon-$size.png
done

cp public/icons/icon-180.png public/apple-touch-icon.png
cp public/icons/icon-32.png public/favicon-32.png
cp public/icons/icon-16.png public/favicon-16.png

# Maskable icons (80% safe zone on solid bg)
for size in 192 512; do
  safe=$(( size * 80 / 100 ))
  magick -size ${size}x${size} xc:'#060d13' \
    \( public/icons/icon-${size}.png -resize ${safe}x${safe} \) \
    -gravity center -composite \
    public/icons/icon-${size}-maskable.png
done

# iOS splash screens (see /tmp/gen-pwa-assets.py or adapt the shell snippet)
```

After regenerating, update `public/manifest.json` if you added new sizes
and commit. No other code change needed — browsers pick up new icons on
the next install.

---

## Updating the manifest

`public/manifest.json` is the source of truth. When you change it:

- Installed users don't see changes until the browser fetches a fresh copy
  (usually on app launch after the 24h default, or when they force-refresh)
- The `name`, `short_name`, and `icons` fields are what the home-screen
  display uses
- Don't change `start_url` or `scope` without thinking — existing installs
  may get stuck on the old values depending on how the user installed
- Adding `shortcuts` entries is safe (long-press home-screen menu picks
  them up silently)

---

## Updating the service worker

Change `src/app/sw.ts` and rebuild. Serwist handles versioning
automatically — each build emits a new `/sw.js` with a new hash, and
the `skipWaiting: true` + `clientsClaim: true` settings make the new
SW take over immediately on the next page load.

If you shipped a buggy SW and want to clear it from a specific user:

```js
// Run in that user's browser DevTools Console:
await navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
```

For a fleet-wide kill, use the feature flag (`NEXT_PUBLIC_PWA_DISABLED=true`)
— it causes `/sw.js` to disappear from the server, and existing SWs will
self-unregister on their next update check.

---

## Push notification scaffold (Phase 3 prerequisite)

`src/app/sw.ts` already has a `push` + `notificationclick` handler. It
expects a JSON payload of `{ title, body, url, tag }`. No real pushes are
being sent yet — Phase 3 will add:

1. Client subscription flow (call `registration.pushManager.subscribe()`)
2. Backend `POST /api/push/subscriptions` to store the subscription
3. Trigger logic (e.g., "EPA submitted → push to attending's devices")
4. VAPID keys — we'll generate when wiring

---

## Lighthouse + CI checks

Locally:

```bash
npm run build
npm start
npx lighthouse http://localhost:3000/dashboard --only-categories=pwa,performance --view
```

Targets for Phase 1:
- **PWA score**: 100
- **Performance**: 90+ on desktop
- **Performance (mobile, throttled)**: ≥85

The standard "installable" checks Lighthouse looks for:
- ✅ Manifest with name, short_name, icons (192, 512), start_url, display
- ✅ Service worker registered
- ✅ Page responds with 200 when offline
- ✅ Viewport meta tag + HTTPS
- ✅ Themed address bar

---

## PWA privacy posture

Nothing in this layer introduces new PHI risk:

- SW caches API responses on the device only. Responses are stored in
  the browser's Cache API, which is scoped to the origin. They never
  leave the device.
- The SW does not intercept cookies — the browser attaches auth cookies
  to the underlying `fetch()` as usual
- Push subscriptions (when added) will contain an endpoint URL and two
  public keys, all non-PHI
- Offline data in IndexedDB (Phase 2) will follow the same PHIA rule set
  as the main app — no patient names, MRNs, or DOBs

---

## Known limitations

1. iOS Safari still has quirks. Notably, ~~**iOS 16.4+ is required for
   push notifications**~~ (we're well past this now). But the install
   flow still requires Safari — Chrome/Firefox/Edge on iOS all use
   WebKit under the hood but hide install behind their own menus.
2. **Standalone-mode redirects**. If a PWA user follows an external
   link to `hippomedicine.com/something`, iOS opens it in Safari, not
   the installed PWA. Android handles this gracefully; iOS doesn't.
3. **iCloud sync**. If the user has iCloud Safari tabs turned on, the
   PWA install is tied to THAT device — not synced across their other
   iPhones/iPads. Each device must install separately.

None of these are blockers for Phase 1 launch; they're just things to
remember when users complain.
