import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import bcrypt from 'bcrypt';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { email: emailInput, password } = body;

    if (!emailInput || !password) {
      console.log("[POST /api/auth/login] Email ou mot de passe manquant");
      return NextResponse.json({
        success: false,
        code: 400,
        message: "Email et mot de passe requis"
      }, { status: 400 });
    }

    // Normaliser l'email en minuscules pour la recherche
    const email = String(emailInput).toLowerCase().trim();
    console.log("[POST /api/auth/login] Recherche utilisateur avec email:", email);

    // Find user in database
    const user = await db.collection('User').findOne({
      email
    });

    console.log("[POST /api/auth/login] Utilisateur trouvé:", user ? "Oui" : "Non");

    if (!user) {
      console.log("[POST /api/auth/login] Utilisateur non trouvé pour:", email);
      return NextResponse.json({
        success: false,
        code: 401,
        message: "Utilisateur non trouvé"
      }, { status: 401 });
    }

    // Verify password
    console.log("[POST /api/auth/login] Vérification du mot de passe...");
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log("[POST /api/auth/login] Mot de passe incorrect pour:", email);
      return NextResponse.json({
        success: false,
        code: 401,
        message: "Mot de passe incorrect"
      }, { status: 401 });
    }

    console.log("[POST /api/auth/login] Authentification réussie pour:", email);



    const currentDate = new Date();

// 2. Ajouter 2 minutes
    currentDate.setMinutes(currentDate.getMinutes() + 720);

    // 3. Afficher la nouvelle date et la convertir en minutes
    const expirationInMinutes = Math.floor(currentDate.getTime() / 60000);

    const token = await encode({
      token: {
        id: user.id,  // Required by NextAuth JWT type
        jti: crypto.randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: expirationInMinutes,
        expiration: expirationInMinutes,
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
      expiresIn: expirationInMinutes
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    const message = (error as any)?.statusCode === 503 ? 'Base de données indisponible' : 'Erreur interne du serveur';
    const code = (error as any)?.statusCode === 503 ? 503 : 500;
    return NextResponse.json({
      success: false,
      code,
      message
    }, { status: code });
  }
}