import { NextRequest, NextResponse } from 'next/server';
import { ParticipantService } from '@/services/participantService';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const eventId = params.id;
  
  if (!eventId) {
    return errorResponse('Event ID is required', 400);
  }

  // Extraire les paramètres de pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50000');

  const result = await ParticipantService.getParticipantsByEventId(eventId, {
    page,
    limit
  });

  // ✅ CORRECTION CORS : Ajouter headers CORS si result est NextResponse
  if (result instanceof NextResponse) {
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return result;
  }

  // ✅ CORRECTION CORS : Ajouter headers CORS si result est un objet
  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}