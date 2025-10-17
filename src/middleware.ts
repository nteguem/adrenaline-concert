import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
// import { cookies } from 'next/headers';

const protectedRoutes = ['/api/events', '/api/tirage', '/api/users', '/api/vainqueurs'];
const publicRoutes = ['/api/auth', '/login', '/register','/api/tours','/api/participants_fo', '/api/participants_bo'];

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

  // const cookie = (await cookies()).get("session")?.value;
  // // const session = { userId: cookie };

  // if (isProtectedRoute && !cookie) {
  //   return NextResponse.redirect(new URL("/login", request.nextUrl));
  // }
  
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

  // Check token expiration with proper type checking
  const currentDate = new Date();

  currentDate.setMinutes(currentDate.getMinutes());
  const currenDate = Math.floor(currentDate.getTime() / 60000); 
    const expTime = token.expiration as number | undefined;
  
  if (expTime) {
    const timeLeft = expTime - currenDate;
    if(timeLeft<0){
      return NextResponse.json({
        success: false,
        code: 401,
        message: 'Token expiré'
      }, { status: 401 });
    }
  }
  
  if (pathname.includes('/admin') && !token.isAdmin) {
    return NextResponse.json({
      success: false,
      code: 403,
      message: 'Accès refusé'
    }, { status: 403 });
  }

  // Ajouter headers CORS à toutes les réponses
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};