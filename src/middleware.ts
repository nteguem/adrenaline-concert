import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configuration des routes à protéger
const protectedRoutes = [
  '/api/events',
  '/api/users',
  '/api/participants_bo',
  // Ajoutez d'autres routes à protéger
];

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/api/auth',
  '/login',
  '/register'
];

export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*', // Or specify your allowed origins
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }

  // Add CORS headers to all responses
  const response = await handleRequest(request);
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or specify your allowed origins
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

// Move the main request handling logic to a separate function
async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute || isPublicRoute) {
    return NextResponse.next();
  }
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      );
    }
    
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  if (pathname.includes('/admin') && !token.isAdmin) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Accès refusé' }),
        { 
          status: 403, 
          headers: { 'content-type': 'application/json' } 
        }
      );
    }
    
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configuration des chemins où le middleware sera appliqué
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*'
  ],
};