import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes = ['/api/events', '/api/tirage', '/api/users', '/api/participants_bo','/api/tirage'];
const publicRoutes = ['/api/auth', '/login', '/register','/api/tours','/api/participants_fo'];

export async function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute || isPublicRoute) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({
      success: false,
      code: 401,
      message: 'Token Bearer manquant'
    }, { status: 401 });
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({
      success: false,
      code: 401,
      message: 'Token invalide'
    }, { status: 401 });
  }

  if (pathname.includes('/admin') && !token.isAdmin) {
    return NextResponse.json({
      success: false,
      code: 403,
      message: 'Accès refusé'
    }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};