#!/usr/bin/env node
/**
 * node-smoke.mjs — lightweight smoke test for Hippo without k6.
 *
 * Hits a handful of public routes in parallel and reports status +
 * latency. Exits non-zero if any 5xx, any timeout, or any unexpected
 * response. Use as a pre-deploy gate.
 *
 * Usage:
 *   node scripts/loadtest/node-smoke.mjs                         # localhost:3000
 *   node scripts/loadtest/node-smoke.mjs https://preview.vercel.app
 *   CONCURRENCY=5 node scripts/loadtest/node-smoke.mjs <url>      # 5 parallel hits each
 */

const target = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const concurrency = Number(process.env.CONCURRENCY || 1);

const ROUTES = [
  { path: "/",                         expect: [200, 301, 302, 307] },
  { path: "/login",                    expect: [200] },
  { path: "/signup",                   expect: [200] },
  { path: "/install",                  expect: [200] },
  { path: "/offline",                  expect: [200] },
  { path: "/legal/privacy",            expect: [200] },
  { path: "/manifest.json",            expect: [200] },
  { path: "/icons/icon-192.png",       expect: [200] },
  { path: "/apple-touch-icon.png",     expect: [200] },
  // 401 is the expected happy path for the unauthenticated API — we just
  // want it to respond fast, not to succeed.
  { path: "/api/notifications",        expect: [401, 200] },
];

console.log(`\n=== Hippo node-smoke ===`);
console.log(`target:      ${target}`);
console.log(`concurrency: ${concurrency}`);
console.log(`routes:      ${ROUTES.length}`);
console.log("");

const results = [];

async function hit(path, expected) {
  const start = Date.now();
  try {
    const res = await fetch(`${target}${path}`, {
      redirect: "manual",
      headers: { "user-agent": "hippo-node-smoke/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    const ms = Date.now() - start;
    const ok = expected.includes(res.status);
    return { path, status: res.status, ms, ok };
  } catch (err) {
    return {
      path,
      status: 0,
      ms: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function run() {
  for (let i = 0; i < concurrency; i++) {
    const batch = await Promise.all(
      ROUTES.map(r => hit(r.path, r.expect)),
    );
    results.push(...batch);
  }

  // Report
  const maxPathLen = Math.max(...ROUTES.map(r => r.path.length));
  let failures = 0;
  let maxLatency = 0;
  let totalLatency = 0;

  for (const r of results) {
    const status = String(r.status).padStart(3);
    const ms = String(r.ms).padStart(5);
    const ok = r.ok ? "✓" : "✗";
    const color = r.ok ? "\x1b[32m" : "\x1b[31m";
    console.log(`  ${color}${ok}\x1b[0m  ${r.path.padEnd(maxPathLen)}  ${status}  ${ms}ms${r.error ? `  ${r.error}` : ""}`);
    if (!r.ok) failures += 1;
    if (r.ms > maxLatency) maxLatency = r.ms;
    totalLatency += r.ms;
  }

  const avg = Math.round(totalLatency / results.length);
  console.log("");
  console.log(`total: ${results.length} | failures: ${failures} | avg: ${avg}ms | max: ${maxLatency}ms`);

  if (failures > 0) {
    console.error(`\n\x1b[31mFAILED\x1b[0m — ${failures} route(s) returned unexpected status`);
    process.exit(1);
  }
  if (maxLatency > 5000) {
    console.warn(`\n\x1b[33mSLOW\x1b[0m — max latency ${maxLatency}ms exceeds 5000ms warning`);
  }
  console.log("\n\x1b[32mOK\x1b[0m");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
