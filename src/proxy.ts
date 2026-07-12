import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that don't need auth
// /install is public so the link works as a shareable "get the app" URL —
// no login required. The page itself handles already-installed / iOS /
// unsupported-browser states honestly.
// /offline is the service-worker fallback — if it requires auth the SW
// can't serve it to a logged-out user who lost connectivity.
const PUBLIC_ROUTES = new Set([
  '/', '/pricing', '/login', '/signup', '/onboarding', '/install', '/offline',
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

// Renamed from `middleware` to `proxy` per Next 16's deprecation of the
// `middleware` file convention. Exported function name is `proxy`; the
// Next runtime calls this on every matched request before any route
// handler. Behaviour and matcher are unchanged.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Hippo Clinic landing override ──────────────────────────────────────
  // When NEXT_PUBLIC_DEFAULT_MODULE=clinic is set on a deployment (e.g. the
  // dedicated v0-heidi-clone Vercel project for Hippo Clinic), we redirect
  // the root and the Log dashboard to /clinic so the URL surface defaults
  // to the clinic experience. Other deployments (e.g. surgitrack →
  // hippomedicine.com) don't set this var, so their behaviour is unchanged.
  // The check is intentionally early — happens before auth — so the
  // unauthenticated landing also goes straight to /clinic where the auth
  // gate will then redirect to /login as usual.
  if (process.env.NEXT_PUBLIC_DEFAULT_MODULE === "clinic") {
    if (pathname === "/" || pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      url.pathname = "/clinic";
      return NextResponse.redirect(url);
    }
  }

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

  // Keep public pages available when the backend is not configured, but do
  // not let private pages fall through into a provider crash.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const publicPage = PUBLIC_ROUTES.has(pathname) || PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
    if (publicPage) return response;
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    return NextResponse.redirect(new URL("/", request.url));
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

  // CORS preflight for the Chrome extension hits the API host without
  // cookies — let the route handler's OPTIONS run so it can echo back
  // the Access-Control-Allow-* headers. Without this the middleware's
  // 401 short-circuits the preflight and the extension can't even
  // attempt the authed GET.
  const isExtensionApi = pathname.startsWith("/api/clinic/extension/");
  if (isExtensionApi && request.method === "OPTIONS") {
    return response;
  }

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
