import { NextRequest, NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/crypto';

// Define protected routes that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/settings',
  // Add other protected routes as needed
];

// Define public API routes that don't require rate limiting
const publicApiRoutes = [
  '/api/device/register',
  '/api/auth/challenge',
  '/api/auth/verify',
  '/api/auth/refresh',
  '/api/auth/logout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internal routes and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    return handleApiRoute(request);
  }

  // Handle protected page routes
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    return handleProtectedRoute(request);
  }

  return NextResponse.next();
}

async function handleApiRoute(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to auth endpoints
  if (publicApiRoutes.includes(pathname)) {
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  // For /api/me and other protected API routes, verify session
  if (pathname === '/api/me') {
    const sessionResult = await verifySession(request);
    if (!sessionResult.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

async function handleProtectedRoute(request: NextRequest) {
  const sessionResult = await verifySession(request);

  if (!sessionResult.valid) {
    // Redirect to login/auth page
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

async function verifySession(request: NextRequest) {
  try {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET environment variable is not set');
    }

    // Get session cookie
    const signedCookie = request.cookies.get('sid')?.value;
    if (!signedCookie) {
      return { valid: false };
    }

    // Verify and extract session ID
    const sessionId = await verifySessionCookie(signedCookie, sessionSecret);
    if (!sessionId) {
      return { valid: false };
    }

    // Without access to the database in Edge runtime we cannot
    // validate the session further. Assume it is valid if the
    // HMAC signature matches.
    return { valid: true, sessionId };
  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false };
  }
}

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function applyRateLimit(request: NextRequest) {
  const ip =
    (request as unknown as { ip?: string }).ip ||
    request.headers.get('x-forwarded-for') ||
    'unknown';
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (current.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        },
      },
    );
  }

  current.count++;
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
