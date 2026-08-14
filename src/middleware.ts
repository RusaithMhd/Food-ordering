import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const path = request.nextUrl.pathname;

  // Paths that require authentication
  const isProtectedPath = 
    path.startsWith('/admin') || 
    path.startsWith('/kitchen') || 
    path.startsWith('/delivery') ||
    path.startsWith('/account') ||
    path.startsWith('/orders');

  // If attempting to access a protected route without a session
  if (isProtectedPath && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Note: Detailed RBAC checking (e.g., is user an ADMIN?) shouldn't happen 
  // in the Edge middleware because Edge doesn't support the full Node.js Firebase Admin SDK.
  // We handle role-specific checks at the Server Component or Server Action level.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
