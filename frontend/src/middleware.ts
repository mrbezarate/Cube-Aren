import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/create'];
  const needsAuth = protectedRoutes.some((route) => path.startsWith(route));

  // If no token and trying to access protected route, redirect to login
  if (!token && needsAuth) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validate token if present
  if (token && needsAuth) {
    try {
      // Decode JWT token (simple base64 decode for payload)
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      
      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // Token is invalid, clear cookies and redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('refreshToken');
      return response;
    }
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
