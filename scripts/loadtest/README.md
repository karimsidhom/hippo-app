# Hippo Load Testing

Smoke-and-soak tests for the public API surface. Two tools:

1. **k6 script (`k6-smoke.js`)** — hammers a target URL with N virtual users,
   reports p50 / p95 / p99 / error rate. Use this when you want real load
   numbers.
2. **Node smoke test (`node-smoke.mjs`)** — simpler, no k6 dependency.
   Just verifies the public routes return 2xx/3xx on a baseline hit. Use
   this in CI or as a pre-deploy check.

## Ground rules

**Never run these against production.** The test URL defaults to
`http://localhost:3000` and every invocation prints the target URL at
the top so you can't silently hit the wrong environment. Vercel preview
URLs are the right target for realistic load numbers.

If you genuinely need to run against production for a one-off capacity
check:
1. Scale the test DOWN (e.g. 10 VUs for 30s, not 100 for 5min).
2. Only hit read-only endpoints — no subscribes, no notification
   creation, no EPA submissions.
3. Do it off-hours.
4. Let the team know.

## Install k6

```
brew install k6          # macOS
# or
docker run -i grafana/k6 run - < scripts/loadtest/k6-smoke.js
```

## Run it

### Against a local dev server

```
# Terminal 1
npm run dev

# Terminal 2
k6 run -e TARGET=http://localhost:3000 scripts/loadtest/k6-smoke.js
```

### Against a Vercel preview

```
k6 run -e TARGET=https://hippo-git-your-branch.vercel.app scripts/loadtest/k6-smoke.js
```

### 100-user ramped soak

```
k6 run -e TARGET=https://your-preview.vercel.app \
       -e VUS=100 -e DURATION=3m \
       scripts/loadtest/k6-smoke.js
```

## What it tests

The script hits a curated list of **public, read-only** endpoints — no
auth, no writes. What's in scope:

| Endpoint | Why |
|---|---|
| `GET /` | Landing page / marketing shell |
| `GET /login` | Sign-in page SSR |
| `GET /signup` | Sign-up page SSR |
| `GET /install` | Public install page (our shareable link) |
| `GET /offline` | Service-worker fallback |
| `GET /manifest.json` | PWA manifest |
| `GET /sw.js` | Service worker bundle |
| `GET /icons/icon-192.png` | Icon delivery |
| `GET /api/notifications` | Expected to 401 (unauth) — we verify the response time |
| `GET /legal/privacy` | A representative static-ish legal page |

What's **not** in scope (on purpose):
- Any authenticated endpoint (needs a real Supabase JWT, creates write side-effects).
- EPA submit / sign / return (writes real rows and sends real emails).
- Push subscription (creates fake subscriptions that would fan out to your devices).

If we need auth'd load testing, the right approach is a separate test
account + a seed script + a JWT helper; that's deliberately not in
scope of this smoke test.

## Reading the results

After the run, k6 prints a table of metrics. The two numbers that
matter:

| Metric | Good | Warning | Bad |
|---|---|---|---|
| `http_req_duration p(95)` | < 400ms | 400-800ms | > 800ms |
| `http_req_failed rate` | < 1% | 1-3% | > 3% |

If p95 is over 800ms under 100 VUs, something needs investigation —
most likely Prisma connection pool exhaustion (Supabase pgbouncer has
finite sockets). Check the Vercel function logs for `connection
exhausted` errors.

## Thresholds (auto-fail)

The script declares thresholds so k6 exits non-zero if things go
sideways. Current thresholds:

- `http_req_failed < 3%`
- `http_req_duration p(95) < 1500ms` (lenient because Vercel cold
  starts on preview can spike the first request)

Tighten these for staging/production smoke; keep lenient for preview.
