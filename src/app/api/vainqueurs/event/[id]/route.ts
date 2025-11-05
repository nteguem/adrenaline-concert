import { NextRequest, NextResponse } from 'next/server';
import { TirageService } from '@/services/tirageService';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;

    if (!params?.id) {
      return errorResponse('Invalid event ID', 400);
    }

    // getWinnersByEventId retourne déjà un NextResponse avec successResponse()
    const result = await TirageService.getWinnersByEventId(params.id);
    
    // Ajouter headers CORS à la réponse existante
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return result;
  } catch (error) {
    console.error('Error in GET winners:', error);
    return errorResponse('Internal server error', 500);
  }
}
