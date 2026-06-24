import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If maintenance mode is enabled, redirect most requests to the maintenance page.
  const maintenanceOn = (process.env.MAINTENANCE_MODE || '').toLowerCase() === '1' ||
    (process.env.MAINTENANCE_MODE || '').toLowerCase() === 'true';

  // Allow health checks, API, static assets, next internals, and the maintenance page itself.
  const exemptPaths = [
    '/api/',
    '/_next/',
    '/static/',
    '/favicon.ico',
    '/robots.txt',
    '/maintenance',
  ];

  const isExempt = exemptPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (maintenanceOn && !isExempt) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https: *.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.live; connect-src 'self' https: *.supabase.co *.vercel.live; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
