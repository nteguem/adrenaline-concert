import { PrismaClient } from '@prisma/client';

// Éviter de créer plusieurs instances de Prisma Client en développement
// à cause du hot-reloading de Next.js
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Fonction utilitaire pour vérifier si un ID est un ObjectId MongoDB valide
export function isValidObjectId(id: string): boolean {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
}

// Définir un type pour les erreurs Prisma
interface PrismaError {
  code?: string;
  meta?: {
    target?: string | string[];
  };
  message?: string;
}

// Fonction pour gérer les erreurs courantes de Prisma
export function handlePrismaError(error: PrismaError): { message: string; statusCode: number } {
  console.error('Prisma error:', error);
  
  // Erreurs spécifiques à Prisma
  if (error.code) {
    switch (error.code) {
      case 'P2002': // Violation de contrainte unique
        return {
          message: `La valeur '${error.meta?.target}' existe déjà.`,
          statusCode: 400,
        };
      case 'P2025': // Enregistrement non trouvé
        return {
          message: 'L\'enregistrement demandé n\'existe pas.',
          statusCode: 404,
        };
      case 'P2003': // Violation de contrainte de clé étrangère
        return {
          message: 'Cette opération viole une relation entre les données.',
          statusCode: 400,
        };
      default:
        return {
          message: 'Une erreur est survenue lors de l\'opération en base de données.',
          statusCode: 500,
        };
    }
  }
  
  // Erreur générique
  return {
    message: 'Une erreur inattendue est survenue.',
    statusCode: 500,
  };
}