import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // If already authenticated and trying to access login/register, redirect to tournaments page
  const authRoutes = ['/auth/login', '/auth/register'];
  if (token && authRoutes.some((route) => path.startsWith(route))) {
    const tournamentsUrl = new URL('/tournaments', request.url);
    return NextResponse.redirect(tournamentsUrl);
  }

  // Routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/create',
    '/chat',
    '/friends',
    '/wallet',
    '/saved',
    '/settings',
  ];
  const needsAuth = protectedRoutes.some((route) => path.startsWith(route));

  // If no token and trying to access protected route, redirect to login
  if (!token && needsAuth) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && needsAuth) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
