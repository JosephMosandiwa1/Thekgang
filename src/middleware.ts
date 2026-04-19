import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Middleware protects /admin/* (except /admin/login) and /portal/* (except /portal/login).
 * It also refreshes the Supabase auth session cookies so logged-in users
 * stay logged in across server-rendered navigations.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Short-circuit anything that isn't a protected section
  const isAdmin = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isPortal = pathname.startsWith('/portal') && !pathname.startsWith('/portal/login') && !pathname.startsWith('/portal/invoice/');
  const needsAuth = isAdmin || isPortal;

  // Build the response (may be rewritten if auth cookies refresh)
  let response = NextResponse.next({ request });

  // If Supabase creds aren't configured, let the request through -- dev convenience
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refresh session (writes cookies if token rotated)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) {
    const redirect = isAdmin ? '/admin/login' : '/portal/login';
    const url = request.nextUrl.clone();
    url.pathname = redirect;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     *   - Next internals (_next/static, _next/image)
     *   - public files (favicon.ico, images, etc.)
     *   - api routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$).*)',
  ],
};
