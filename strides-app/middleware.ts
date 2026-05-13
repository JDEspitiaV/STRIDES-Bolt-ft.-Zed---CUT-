import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth'; // Using firebase-admin for server-side auth
import { app } from './lib/firebase-admin'; // We'll create this file

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value; // Assuming session cookie

  if (!token) {
    // Redirect to login if no session token
    if (request.nextUrl.pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const decodedToken = await getAuth(app).verifyIdToken(token);
    const role = decodedToken.role as 'athlete' | 'coach' | undefined;

    // Attach decoded token and role to request headers for downstream use
    const headers = new Headers(request.headers);
    headers.set('x-decoded-token', JSON.stringify(decodedToken));
    if (role) {
      headers.set('x-user-role', role);
    }

    // Protect /app/athlete and /app/coach routes
    if (request.nextUrl.pathname.startsWith('/app/athlete') && role !== 'athlete') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (request.nextUrl.pathname.startsWith('/app/coach') && role !== 'coach') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next({
      request: {
        headers: headers,
      },
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    // Clear invalid session cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('__session');
    return response;
  }
}

export const config = {
  matcher: ['/app/:path*', '/api/:path*'], // Apply middleware to /app and /api routes
};
