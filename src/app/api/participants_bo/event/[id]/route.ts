import { NextRequest } from 'next/server';
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
  const limit = parseInt(searchParams.get('limit') || '100');

  return ParticipantService.getParticipantsByEventId(eventId, {
    page,
    limit
  });
}