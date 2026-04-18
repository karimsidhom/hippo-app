import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that don't need auth
// /install is public so the link works as a shareable "get the app" URL —
// no login required. The page itself handles already-installed / iOS /
// unsupported-browser states honestly.
// /offline is the service-worker fallback — if it requires auth the SW
// can't serve it to a logged-out user who lost connectivity.
const PUBLIC_ROUTES = new Set([
  '/', '/login', '/signup', '/onboarding', '/install', '/offline',
]);
const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/stripe/webhook',
  '/api/cron/',
  // Review route is a public token link emailed to attendings who may
  // not have a Hippo account. The API verifies the token.
  '/api/epa/review/',
];

// Public page prefixes.
//   /join/:token  — program invites
//   /review/:token — EPA review flow for attendings without accounts
//   /legal/*      — privacy / terms / PHIA / etc; must be publicly readable
const PUBLIC_PAGE_PREFIXES = ['/join/', '/review/', '/legal/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets + PWA manifest
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|json)$/)
  ) {
    return NextResponse.next();
  }

  // Public API routes
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  // Skip auth if Supabase isn't configured (build-time / missing env)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  // Build server Supabase client — syncs session cookies on every request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session (keeps tokens alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = !!user;
  const isPublicPage =
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith('/api/');

  // The invite-preview GET is token-secured and must be public so the join
  // page can render for logged-out users.
  const isInvitePreviewGet =
    isApiRoute && pathname.startsWith('/api/programs/invites/');

  // ── Protect API routes ─────────────────────────────────────────────────────
  if (isApiRoute && !isAuthed) {
    // Allow the GET-only invite preview through so the join page works for
    // logged-out users. The POST accept path re-checks auth at the route level.
    if (isInvitePreviewGet && request.method === 'GET') {
      return response;
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Redirect unauthenticated users away from app pages ────────────────────
  if (!isPublicPage && !isApiRoute && !isAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect authenticated users away from auth pages ─────────────────────
  if (isAuthed && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
