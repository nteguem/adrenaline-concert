import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        code: 400,
        message: "Email et mot de passe requis"
      }, { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        code: 401,
        message: "Utilisateur non trouvé"
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        code: 401,
        message: "Mot de passe incorrect"
      }, { status: 401 });
    }

    // Get the JWT token
    const token = await encode({
      token: {
        id: user.id,  // Required by NextAuth JWT type
        jti: crypto.randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        username: user.username
      },
      secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key-min-32-chars',
    });

    return NextResponse.json({
      success: true,
      code: 200,
      message: 'Authentification réussie',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.prenom} ${user.nom}`,
        isAdmin: user.isAdmin,
        username: user.username
      },
      accessToken: token,
      expiresIn: 24 * 60 * 60
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json({
      success: false,
      code: 500,
      message: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}