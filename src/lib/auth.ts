// ---------------------------------------------------------------------------
// Hippo local auth layer — works out of the box with zero setup.
// All data is stored in localStorage, namespaced per user.
// To upgrade to Supabase: replace the functions below with Supabase calls
// and keep every call-site identical.
// ---------------------------------------------------------------------------

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // base64 — replace with bcrypt via Supabase
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  expiresAt: string; // ISO date
}

const ACCOUNTS_KEY = 'hippo_accounts';
const SESSION_KEY  = 'hippo_session';
const PROFILE_PREFIX   = 'hippo_profile_';
const CASES_PREFIX     = 'hippo_cases_';
const MILESTONES_PREFIX = 'hippo_milestones_';

// ── Simple hash (demo-grade). Replace with Supabase Auth in production. ────
function hashPassword(pw: string): string {
  return btoa(encodeURIComponent(pw + '_st_salt_2024'));
}

function checkPassword(pw: string, hash: string): boolean {
  return hashPassword(pw) === hash;
}

function uid(): string {
  return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Account store ────────────────────────────────────────────────────────────
function getAccounts(): Record<string, AuthAccount> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); } catch { return {}; }
}

function saveAccounts(accounts: Record<string, AuthAccount>) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ── Session ──────────────────────────────────────────────────────────────────
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

function createSession(account: AuthAccount): AuthSession {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30-day session
  const session: AuthSession = {
    userId: account.id,
    email:  account.email,
    name:   account.name,
    expiresAt: expires.toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

// ── Auth operations ──────────────────────────────────────────────────────────
export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export function signUp(name: string, email: string, password: string): AuthResult {
  const accounts = getAccounts();
  const key = email.toLowerCase().trim();
  if (accounts[key]) return { ok: false, error: 'An account with this email already exists.' };
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!name.trim()) return { ok: false, error: 'Please enter your name.' };

  const account: AuthAccount = {
    id: uid(),
    name: name.trim(),
    email: key,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  accounts[key] = account;
  saveAccounts(accounts);
  return { ok: true, session: createSession(account) };
}

export function signIn(email: string, password: string): AuthResult {
  const accounts = getAccounts();
  const key = email.toLowerCase().trim();
  const account = accounts[key];
  if (!account) return { ok: false, error: 'No account found with this email.' };
  if (!checkPassword(password, account.passwordHash)) return { ok: false, error: 'Incorrect password.' };
  return { ok: true, session: createSession(account) };
}

export function signOut() {
  clearSession();
}

// ── Per-user data storage ────────────────────────────────────────────────────
export function getUserProfile(userId: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(PROFILE_PREFIX + userId) || 'null'); } catch { return null; }
}

export function saveUserProfile(userId: string, profile: Record<string, unknown>) {
  localStorage.setItem(PROFILE_PREFIX + userId, JSON.stringify(profile));
}

export function getUserCases(userId: string): unknown[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CASES_PREFIX + userId) || '[]'); } catch { return []; }
}

export function saveUserCases(userId: string, cases: unknown[]) {
  localStorage.setItem(CASES_PREFIX + userId, JSON.stringify(cases));
}

export function getUserMilestones(userId: string): unknown[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(MILESTONES_PREFIX + userId) || '[]'); } catch { return []; }
}

export function saveUserMilestones(userId: string, milestones: unknown[]) {
  localStorage.setItem(MILESTONES_PREFIX + userId, JSON.stringify(milestones));
}

export function deleteUserData(userId: string) {
  localStorage.removeItem(PROFILE_PREFIX + userId);
  localStorage.removeItem(CASES_PREFIX + userId);
  localStorage.removeItem(MILESTONES_PREFIX + userId);
}
