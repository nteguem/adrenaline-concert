import { NextResponse } from 'next/server';

// Types de réponse API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// Type pour les erreurs
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

// Fonction pour créer une réponse de succès
export function successResponse<T>(data: T, pagination?: ApiResponse['pagination'], status = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return NextResponse.json(response, { status });
}

// Fonction pour créer une réponse d'erreur
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

// Gestionnaire d'erreurs global pour les API
export function apiErrorHandler(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  // Erreur avec message personnalisé
  if (error instanceof Error) {
    const apiError = error as ApiError;
    const statusCode = apiError.statusCode || 400;
    return errorResponse(apiError.message, statusCode);
  }
  
  // Erreur Prisma (gérée dans db.ts)
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
    return errorResponse('Erreur de base de données', 500);
  }
  
  // Erreur sous forme de chaîne
  if (typeof error === 'string') {
    return errorResponse(error, 400);
  }
  
  // Erreur inconnue
  return errorResponse('Une erreur inattendue est survenue', 500);
}

// Validation des entrées
export function validateRequiredFields(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      return `Le champ "${field}" est requis`;
    }
  }
  
  return null;
}

// Validation d'email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation de date
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}