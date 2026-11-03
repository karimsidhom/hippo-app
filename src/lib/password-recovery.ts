interface RecoverySessionAuth {
  initialize: () => Promise<{ error: unknown | null }>;
  getSession: () => Promise<{
    data: { session: unknown | null };
    error?: unknown | null;
  }>;
}

interface RecoveryPasswordAuth {
  updateUser: (attributes: { password: string }) => Promise<{
    error: { message: string } | null;
  }>;
}

function hasParameters(url: string, names: readonly string[]): boolean {
  const parsed = new URL(url);
  const fragment = new URLSearchParams(parsed.hash.slice(1));
  return names.some((name) => parsed.searchParams.has(name) || fragment.has(name));
}

const REDIRECT_ERRORS = ["error", "error_code", "error_description"];
const RECOVERY_CREDENTIALS = ["code", "access_token", "refresh_token", "token_hash"];

/** Wait for Supabase's automatic PKCE exchange and surface redirect errors.
 * getSession alone can return an older login even after a failed recovery link.
 * Unconsumed codes/tokens mean this browser could not complete the exchange.
 */
export async function verifyRecoverySession(
  auth: RecoverySessionAuth,
  readUrl: () => string,
): Promise<boolean> {
  try {
    if (hasParameters(readUrl(), REDIRECT_ERRORS)) return false;
    const { error: initializationError } = await auth.initialize();
    if (initializationError) return false;
    const currentUrl = readUrl();
    if (hasParameters(currentUrl, REDIRECT_ERRORS) || hasParameters(currentUrl, RECOVERY_CREDENTIALS)) return false;
    const { data, error } = await auth.getSession();
    return !error && !!data.session;
  } catch {
    return false;
  }
}

export async function updateRecoveredPassword(
  auth: RecoveryPasswordAuth,
  password: string,
  confirmation: string,
): Promise<{ ok: boolean; error: string }> {
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirmation) {
    return { ok: false, error: "Passwords do not match." };
  }
  try {
    const { error } = await auth.updateUser({ password });
    return error ? { ok: false, error: error.message } : { ok: true, error: "" };
  } catch {
    return { ok: false, error: "Connection failed. Please try again." };
  }
}
