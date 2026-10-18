/**
 * Hippo ID: one session and one profile across the Hippo Suite.
 *
 * This file is copied byte-identical into every suite repo (Cases, Handover,
 * Research, Study). Change it in one repo, copy it to the others, and check
 * with `shasum`. Its tests live in Handover (tests/hippo-id.test.ts).
 *
 * No Next or React imports, so it runs in middleware, on the server and in
 * the browser.
 *
 * Spec: apps/hippo-handover/docs/superpowers/specs/2026-10-16-hippo-id-design.md
 */

export const HIPPO_PARENT_DOMAIN = ".hippomedicine.com";
/** Host-only marker: "this host has had its auth cookies migrated". */
export const HIPPO_MARKER = "hippo-id";
/** 400 days, the longest lifetime browsers accept. */
const MAX_AGE = 400 * 24 * 60 * 60;

// ─── Suite registry ──────────────────────────────────────────────────────────

export type SuiteAppId = "cases" | "pulse" | "research" | "handover" | "study";

export interface SuiteApp {
  id: SuiteAppId;
  name: string;
  /** Where the dock sends you. */
  url: string;
  /** Served from each app's own public/suite folder. */
  icon: string;
  blurb: string;
}

export const HIPPO_SUITE_APPS: SuiteApp[] = [
  { id: "cases", name: "Cases", url: "https://hippomedicine.com/dashboard", icon: "/suite/cases.png", blurb: "Case log and EPAs" },
  { id: "pulse", name: "Pulse", url: "https://pulse.hippomedicine.com/today", icon: "/suite/pulse.png", blurb: "Daily edition and colleagues" },
  { id: "research", name: "Research", url: "https://research.hippomedicine.com", icon: "/suite/research.png", blurb: "Papers in your field" },
  { id: "handover", name: "Handover", url: "https://handover.hippomedicine.com/teams", icon: "/suite/handover.png", blurb: "Shared patient lists" },
  { id: "study", name: "Study", url: "https://study.hippomedicine.com", icon: "/suite/study.png", blurb: "Royal College questions" },
];

/** Where a profile is edited. Cases owns identity. */
export const HIPPO_PROFILE_URL = "https://hippomedicine.com/profile";

// ─── Hosts and cookie options ────────────────────────────────────────────────

function bareHost(host?: string | null): string {
  if (!host) return "";
  return host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/** hippomedicine.com or any subdomain of it. localhost and *.vercel.app are not. */
export function isHippoHost(host?: string | null): boolean {
  const h = bareHost(host);
  return h === "hippomedicine.com" || h.endsWith(".hippomedicine.com");
}

/**
 * Cookie options for every Supabase client in the suite. On a Hippo host the
 * auth cookie goes on the parent domain so one sign-in covers every app; any
 * other host (localhost, previews) keeps the host-only default.
 */
export function hippoCookieOptions(host?: string | null): { domain?: string; secure?: boolean } {
  return isHippoHost(host) ? { domain: HIPPO_PARENT_DOMAIN, secure: true } : {};
}

/** "https://abc.supabase.co" -> "abc". */
export function supabaseRef(url?: string | null): string {
  try {
    return new URL(url ?? "").hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

function authBase(ref: string): string {
  return `sb-${ref}-auth-token`;
}

function isAuthCookie(name: string, base: string): boolean {
  if (name === base) return true;
  if (!name.startsWith(base + ".")) return false;
  return /^\d+$/.test(name.slice(base.length + 1));
}

/** Parse a Cookie header (or document.cookie) in order, keeping duplicates. */
export function parseCookieHeader(header?: string | null): [string, string][] {
  const out: [string, string][] = [];
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (name) out.push([name, part.slice(i + 1).trim()]);
  }
  return out;
}

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function unique<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

// ─── Session selection ───────────────────────────────────────────────────────

/**
 * The stored sessions a set of cookie values could hold: the contiguous
 * chunks .0..n, and the unchunked cookie. Normally only one exists; a
 * browser that holds both is mid-migration.
 */
function sessionsIn(values: Map<string, string>, base: string): [string, string][][] {
  const chunks: [string, string][] = [];
  for (let i = 0; values.has(`${base}.${i}`); i++) chunks.push([`${base}.${i}`, values.get(`${base}.${i}`)!]);
  const whole = values.get(base);
  const out: [string, string][][] = [];
  if (chunks.length) out.push(chunks);
  if (whole !== undefined) out.push([[base, whole]]);
  return out;
}

function decodeBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** expires_at (unix seconds) of a stored session, or null if it does not decode. */
export function sessionExpiry(chunks: [string, string][]): number | null {
  if (!chunks.length) return null;
  try {
    let raw = safeDecode(chunks.map(([, v]) => v).join(""));
    if (raw.startsWith("base64-")) raw = decodeBase64Url(raw.slice("base64-".length));
    const session = JSON.parse(raw) as { expires_at?: unknown } | null;
    return typeof session?.expires_at === "number" ? session.expires_at : null;
  } catch {
    return null;
  }
}

/**
 * The session that expires last. A later candidate wins ties, and when
 * nothing decodes the last candidate wins, so callers list the preferred
 * fallback last.
 */
function freshest(candidates: [string, string][][]): [string, string][] {
  let best: [string, string][] = [];
  let bestExpiry: number | null = null;
  let picked = false;
  for (const c of candidates) {
    const e = sessionExpiry(c);
    if (!picked || (e !== null && (bestExpiry === null || e >= bestExpiry)) || (e === null && bestExpiry === null)) {
      best = c;
      bestExpiry = e;
      picked = true;
    }
  }
  return best;
}

/** Duplicate names, or an unchunked cookie beside chunks: never a settled state. */
function unsettled(auth: [string, string][], base: string): boolean {
  const names = unique(auth.map(([n]) => n));
  return names.length !== auth.length || (names.includes(base) && names.length > 1);
}

// ─── Server migration (middleware / proxy) ───────────────────────────────────

export interface CookieMigrationPlan {
  /** The one session to keep, as [cookie name, raw value]. Empty when signed out. */
  keep: [string, string][];
  /** Every auth cookie name the browser sent, in any scope. */
  seen: string[];
}

/**
 * Decide whether this request needs the one-time move of host-only auth
 * cookies to the parent domain. Returns null in the steady state (marker
 * present, no duplicate names) and on any non-Hippo host.
 *
 * A request does not say which scope a cookie came from, and a browser can
 * hold a host-only and a parent-domain cookie with the same name at once.
 * Every session the cookies could hold is tried and the later-expiring one
 * wins.
 */
export function planCookieMigration(
  host: string | null | undefined,
  cookieHeader: string | null | undefined,
  ref: string,
): CookieMigrationPlan | null {
  if (!ref || !isHippoHost(host)) return null;
  const pairs = parseCookieHeader(cookieHeader);
  const base = authBase(ref);
  const auth = pairs.filter(([n]) => isAuthCookie(n, base));
  const seen = unique(auth.map(([n]) => n));
  const marked = pairs.some(([n, v]) => n === HIPPO_MARKER && v === "1");
  if (marked && !unsettled(auth, base)) return null;
  if (!auth.length) return { keep: [], seen: [] };

  const first = new Map<string, string>();
  const last = new Map<string, string>();
  for (const [n, v] of auth) {
    if (!first.has(n)) first.set(n, v);
    last.set(n, v);
  }
  // Last occurrences last, unchunked last: what Supabase itself would read.
  const keep = freshest([...sessionsIn(first, base), ...sessionsIn(last, base)]);
  return { keep, seen };
}

/**
 * Point the incoming request at the kept session, so Supabase in the
 * middleware and every route handler after it read the same value.
 * `cookies` is Next's RequestCookies (or anything with set and delete).
 */
export function normaliseRequestCookies(
  cookies: { set(name: string, value: string): unknown; delete(name: string): unknown },
  plan: CookieMigrationPlan,
): void {
  for (const n of plan.seen) cookies.delete(n);
  for (const [n, v] of plan.keep) cookies.set(n, safeDecode(v));
}

function splitSetCookie(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[^;,=\s]+=)/).map((s) => s.trim()).filter(Boolean);
}

function setCookieName(c: string): string {
  return c.slice(0, c.indexOf("=")).trim();
}

/**
 * Finish a response: write raw Set-Cookie headers that Next's
 * response.cookies cannot express (it is keyed by name, and here one name
 * needs a host-only expiry and a parent-domain set). Call it LAST, after
 * every response.cookies.set, or those calls will drop these headers.
 *
 * Order: host-only expiries first, then whatever the app already set, then
 * the kept session on the parent domain (skipped if Supabase already wrote
 * a refreshed one in this response), parent-domain chunks that are not part
 * of the kept session, and the marker.
 */
export function applyCookieMigration(headers: Headers, plan: CookieMigrationPlan): void {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  const existing = typeof h.getSetCookie === "function" ? h.getSetCookie() : splitSetCookie(headers.get("set-cookie"));
  const written = new Set(existing.map(setCookieName));
  const parent = `Domain=${HIPPO_PARENT_DOMAIN}; Path=/; SameSite=Lax; Secure`;

  headers.delete("set-cookie");
  for (const n of plan.seen) headers.append("set-cookie", `${n}=; Path=/; Max-Age=0; SameSite=Lax; Secure`);
  for (const c of existing) headers.append("set-cookie", c);

  const keepNames = new Set(plan.keep.map(([n]) => n));
  const refreshed = plan.keep.some(([n]) => written.has(n));
  if (!refreshed) {
    for (const [n, v] of plan.keep) headers.append("set-cookie", `${n}=${v}; ${parent}; Max-Age=${MAX_AGE}`);
  }
  for (const n of plan.seen) {
    if (!keepNames.has(n) && !written.has(n)) headers.append("set-cookie", `${n}=; ${parent}; Max-Age=0`);
  }
  headers.append("set-cookie", `${HIPPO_MARKER}=1; Path=/; SameSite=Lax; Secure; Max-Age=${MAX_AGE}`);
}

// ─── Browser migration (apps without middleware) ─────────────────────────────

/**
 * The browser version, for Research and Study, which have no middleware.
 * Run it before the Supabase browser client is created. Unlike the server,
 * the browser can tell scopes apart: deleting the host-only copies leaves
 * only the parent-domain ones in document.cookie.
 */
export function migrateBrowserCookies(
  ref: string,
  doc: { cookie: string } | undefined = typeof document !== "undefined" ? document : undefined,
  host: string = typeof location !== "undefined" ? location.hostname : "",
): void {
  if (!doc || !ref || !isHippoHost(host)) return;
  const base = authBase(ref);
  const before = parseCookieHeader(doc.cookie);
  const auth = before.filter(([n]) => isAuthCookie(n, base));
  const seen = unique(auth.map(([n]) => n));
  const marked = before.some(([n, v]) => n === HIPPO_MARKER && v === "1");
  if (marked && !unsettled(auth, base)) return;

  const parentAttrs = `Domain=${HIPPO_PARENT_DOMAIN}; Path=/; SameSite=Lax; Secure`;
  if (auth.length) {
    for (const n of seen) doc.cookie = `${n}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    const parentMap = new Map(parseCookieHeader(doc.cookie).filter(([n]) => isAuthCookie(n, base)));
    // What was host-only: for each name, the value that is not the parent's.
    const hostMap = new Map<string, string>();
    for (const n of seen) {
      const values = auth.filter(([m]) => m === n).map(([, v]) => v);
      const p = parentMap.get(n);
      const other = p === undefined ? values[values.length - 1] : values.find((v) => v !== p);
      if (other !== undefined) hostMap.set(n, other);
    }
    // Parent candidates last: on a tie the suite-wide session stays.
    const keep = freshest([...sessionsIn(hostMap, base), ...sessionsIn(parentMap, base)]);
    const keepNames = new Set(keep.map(([n]) => n));
    if (!keep.every(([n, v]) => parentMap.get(n) === v)) {
      for (const [n, v] of keep) doc.cookie = `${n}=${v}; ${parentAttrs}; Max-Age=${MAX_AGE}`;
    }
    for (const n of parentMap.keys()) {
      if (!keepNames.has(n)) doc.cookie = `${n}=; ${parentAttrs}; Max-Age=0`;
    }
  }
  doc.cookie = `${HIPPO_MARKER}=1; Path=/; SameSite=Lax; Secure; Max-Age=${MAX_AGE}`;
}

// ─── Names ───────────────────────────────────────────────────────────────────

const HONORIFIC = /^\s*(?:dr|doctor|prof|professor|mr|mrs|ms|mx)\.?\s+/i;

/** "Dr. Justin Chan" -> "Justin Chan". Same rule as Cases' src/lib/names.ts. */
export function stripHonorific(name?: string | null): string {
  if (!name) return "";
  let out = name.trim();
  while (HONORIFIC.test(out)) out = out.replace(HONORIFIC, "");
  return out.replace(/\s+/g, " ").trim();
}

/** First non-empty candidate, honorific stripped. The hub name goes first. */
export function pickDisplayName(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    const clean = stripHonorific(c);
    if (clean) return clean;
  }
  return "";
}

/** "Justin Chan" -> "JC"; "" with "k@x.com" -> "K"; nothing -> "?". */
export function initialsOf(name?: string | null, email?: string | null): string {
  const clean = stripHonorific(name);
  if (clean) {
    const parts = clean.split(" ");
    const a = parts[0][0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
    return (a + b).toUpperCase();
  }
  return (email?.trim()[0] ?? "?").toUpperCase();
}

// ─── Profiles ────────────────────────────────────────────────────────────────

/** The columns any signed-in user may read (column grants enforce it). */
export const HUB_PUBLIC_COLUMNS = "user_id,handle,display_name,specialties,program,level,avatar_url";

export interface HubProfile {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  specialties: string[] | null;
  program: string | null;
  level: string | null;
  avatar_url: string | null;
}

export interface HippoUser {
  id: string;
  email: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  specialties: string[];
  program: string | null;
  level: string | null;
  /** True when the name comes from hub_profiles (so it is edited in Cases). */
  hasHubName: boolean;
}

/* The supabase-js client types are deep generics that differ by version
   across the suite; a structural "anything with auth and from" keeps this
   file identical everywhere. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { auth: any; from: (table: string) => any };

/** hub_profiles rows for these users, keyed by user id. Empty on any error. */
export async function getHubProfiles(supabase: SupabaseLike, userIds: string[]): Promise<Map<string, HubProfile>> {
  const ids = unique(userIds.filter(Boolean));
  if (!ids.length) return new Map();
  try {
    const { data, error } = await supabase.from("hub_profiles").select(HUB_PUBLIC_COLUMNS).in("user_id", ids);
    if (error || !Array.isArray(data)) return new Map();
    return new Map((data as HubProfile[]).map((r) => [r.user_id, r]));
  } catch {
    return new Map();
  }
}

/**
 * The signed-in user with their shared profile, or null when signed out.
 * Works with a server or a browser client. `verify: false` reads the local
 * session without a round trip to the auth server; use it only for display.
 */
export async function getHippoUser(
  supabase: SupabaseLike,
  opts: { verify?: boolean } = {},
): Promise<HippoUser | null> {
  type AuthUser = { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null };
  let user: AuthUser | null = null;
  try {
    if (opts.verify === false) {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user ?? null;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    }
  } catch {
    return null;
  }
  if (!user) return null;

  const hub = (await getHubProfiles(supabase, [user.id])).get(user.id) ?? null;
  const meta = user.user_metadata ?? {};
  const email = user.email ?? "";
  const hubName = stripHonorific(hub?.display_name);
  const displayName = pickDisplayName(hubName, meta.name as string | undefined, meta.full_name as string | undefined);
  return {
    id: user.id,
    email,
    displayName,
    initials: initialsOf(displayName, email),
    avatarUrl: hub?.avatar_url ?? null,
    specialties: hub?.specialties ?? [],
    program: hub?.program ?? null,
    level: hub?.level ?? null,
    hasHubName: Boolean(hubName),
  };
}
