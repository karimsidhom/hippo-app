/**
 * A post-sign-in destination taken from ?next=, accepted only when it is a
 * path on this site ("/log?handoff=..."), never another origin or a
 * protocol-relative URL. Returns null otherwise.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (typeof next !== 'string' || next.length > 512) return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (/[\u0000-\u001f]/.test(next)) return null;
  if (next === '/login' || next.startsWith('/login?') || next === '/signup' || next.startsWith('/signup?')) return null;
  return next;
}
