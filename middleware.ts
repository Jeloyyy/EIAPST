// middleware.ts - Request middleware for security

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for public routes
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/register'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication on protected routes
  const token = request.cookies.get('authToken')?.value;
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect to login if no token
  if (!token && (isDashboard || isApiRoute)) {
    if (isDashboard) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
