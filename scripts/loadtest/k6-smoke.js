// k6 smoke + soak test for Hippo.
//
// Run with:
//   k6 run -e TARGET=http://localhost:3000 scripts/loadtest/k6-smoke.js
//   k6 run -e TARGET=https://preview.vercel.app -e VUS=100 -e DURATION=3m scripts/loadtest/k6-smoke.js
//
// Scope: unauthenticated, read-only endpoints only. See README for why.

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const TARGET = __ENV.TARGET || 'http://localhost:3000';
const VUS = Number(__ENV.VUS || 20);
const DURATION = __ENV.DURATION || '30s';

// Custom metrics so we can break down latency by endpoint category.
const pagesLatency = new Trend('page_latency_ms', true);
const apiLatency   = new Trend('api_latency_ms', true);
const assetLatency = new Trend('asset_latency_ms', true);
const errors = new Rate('app_errors');

export const options = {
  scenarios: {
    ramped_soak: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s',      target: Math.min(5, VUS) },
        { duration: '15s',      target: VUS },
        { duration: DURATION,   target: VUS },
        { duration: '10s',      target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    // 3% is generous for a smoke test. Tighten for staging.
    http_req_failed:   ['rate<0.03'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    page_latency_ms:   ['p(95)<1200'],
    api_latency_ms:    ['p(95)<800'],
    asset_latency_ms:  ['p(95)<400'],
    app_errors:        ['rate<0.05'],
  },
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  // Verify the target is reachable before we ramp up.
  const res = http.get(`${TARGET}/`);
  if (res.status >= 500) {
    throw new Error(`Target ${TARGET} returned ${res.status} on / — aborting`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n=== Hippo load test ===`);
  // eslint-disable-next-line no-console
  console.log(`target: ${TARGET}`);
  // eslint-disable-next-line no-console
  console.log(`VUs:    ${VUS}`);
  // eslint-disable-next-line no-console
  console.log(`soak:   ${DURATION}`);
  return {};
}

/**
 * One virtual user's behaviour: land on the marketing page, bounce
 * between install / login / signup, grab the manifest + SW the way a
 * freshly-loaded tab would, and hit the public API once to establish
 * 401 latency. Small sleep between to avoid being pathologically fast.
 */
export default function () {
  group('pages', () => {
    const pages = ['/', '/install', '/login', '/signup', '/offline', '/legal/privacy'];
    for (const path of pages) {
      const r = http.get(`${TARGET}${path}`, { tags: { name: path } });
      pagesLatency.add(r.timings.duration);
      const ok = check(r, { [`${path} 2xx/3xx`]: x => x.status >= 200 && x.status < 400 });
      if (!ok) errors.add(1);
    }
  });

  group('assets', () => {
    const assets = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.ico'];
    for (const path of assets) {
      const r = http.get(`${TARGET}${path}`, { tags: { name: path } });
      assetLatency.add(r.timings.duration);
      const ok = check(r, { [`${path} 200`]: x => x.status === 200 });
      if (!ok) errors.add(1);
    }
    // sw.js is emitted by the build — skip if missing on dev.
    const sw = http.get(`${TARGET}/sw.js`, { tags: { name: '/sw.js' } });
    assetLatency.add(sw.timings.duration);
  });

  group('api', () => {
    // Unauthenticated API hit — we expect 401, the point is latency.
    const r = http.get(`${TARGET}/api/notifications`, { tags: { name: '/api/notifications' } });
    apiLatency.add(r.timings.duration);
    check(r, { '/api/notifications 401 or 200': x => x.status === 401 || x.status === 200 });
  });

  // 100-600ms think time between iterations so we don't melt the target.
  sleep(0.1 + Math.random() * 0.5);
}
