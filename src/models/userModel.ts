import { User as PrismaUser } from '@prisma/client'

// Interface pour la création d'un utilisateur
export interface UserCreateInput {
  nom: string;
  prenom: string;
  email: string;
  username: string;
  password: string;
  isAdmin?: boolean; 
  dateNaissance: string; // Format ISO 8601
}

// Interface pour la mise à jour d'un utilisateur
export interface UserUpdateInput {
  nom?: string;
  prenom?: string;
  email?: string;
  dateNaissance?: string; // Format ISO 8601
  username?: string;
}

// Interface pour la pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}

// Interface pour un utilisateur sans données sensibles
export interface UserPublic extends Partial<Omit<PrismaUser, 'createdAt' | 'updatedAt'>> {
  fullName?: string;
  age?: number;
}

// Fonction de validation d'email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}