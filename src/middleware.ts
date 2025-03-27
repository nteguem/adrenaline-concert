// adrenaline-concert/src/middleware.ts
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
  const { pathname } = request.nextUrl;
  
  // Vérifier si la route doit être protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Si la route n'est pas protégée ou est publique, continuer
  if (!isProtectedRoute || isPublicRoute) {
    return NextResponse.next();
  }
  
  // Pour les routes protégées, vérifier l'authentification
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Si pas de token, rediriger vers la page de connexion
  if (!token) {
    // Pour les requêtes API, retourner une erreur 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      );
    }
    
    // Pour les pages web, rediriger vers login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Vérifier les permissions spécifiques (exemple: admin pour certaines routes)
  if (pathname.includes('/admin') && !token.isAdmin) {
    // Si la route est admin mais l'utilisateur n'est pas admin
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Accès refusé' }),
        { 
          status: 403, 
          headers: { 'content-type': 'application/json' } 
        }
      );
    }
    
    // Rediriger vers la page d'accueil
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // L'utilisateur est authentifié et autorisé
  return NextResponse.next();
}

// Configuration des chemins où le middleware sera appliqué
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*'
  ],
};