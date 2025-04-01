// src/app/api/auth/logout/route.ts (pour App Router)
// ou src/pages/api/auth/logout.ts (pour Pages Router)

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Créer une réponse
  const response = NextResponse.json({
    success: true,
    message: 'Déconnexion réussie',
  });

  // Supprimer les cookies d'authentification
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token',
  ];

  cookiesToClear.forEach(cookieName => {
    response.cookies.set({
      name: cookieName,
      value: '',
      expires: new Date(0),
      path: '/',
    });
  });

  return response;
}