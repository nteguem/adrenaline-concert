import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "@/lib/apiUtils";
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';

// Type pour l'utilisateur personnalisé
interface CustomUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  username: string;
  image?: string;
}

// Déclaration pour étendre les types de session et token
declare module "next-auth" {
  interface User extends CustomUser {}
  
  interface Session {
    user: CustomUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    username: string;
  }
}

// Définir les options mais ne pas les exporter directement (déplacé de export const à const)
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "API Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        try {
          await connectToDB();
          
          // Recherche de l'utilisateur par email
          const dbUser = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          if (!dbUser) {
            throw new Error('Utilisateur non trouvé');
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, dbUser.password);
          
          if (!isPasswordValid) {
            throw new Error('Mot de passe incorrect');
          }
          
          // Transformation explicite en CustomUser pour le typage correct
          const user: CustomUser = {
            id: dbUser.id,
            name: `${dbUser.prenom} ${dbUser.nom}`,
            email: dbUser.email,
            isAdmin: dbUser.isAdmin,
            username: dbUser.username
          };
          
          return user;
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          throw new Error(error instanceof Error ? error.message : "Erreur d'authentification");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60, // 24h
  },
  callbacks: {
    async jwt({ token, user }) {
      // L'objet user est disponible seulement lors de la connexion initiale
      if (user) {
        // Maintenant user est correctement typé comme CustomUser
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      // Transférer les informations du token à la session
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.username = token.username as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Pour les appels API, retournez simplement l'URL de base
      return baseUrl;
    },
  },
  jwt: {
    maxAge: 1 * 24 * 60 * 60, // 24h
  },
  secret: process.env.NEXTAUTH_SECRET || "default-secret-for-development-only",
  debug: process.env.NODE_ENV === 'development',
};

// Créer le handler avec les options
const handler = NextAuth(authOptions);

// Exporter les fonctions GET et POST
export const GET = handler;
export const POST = handler;

