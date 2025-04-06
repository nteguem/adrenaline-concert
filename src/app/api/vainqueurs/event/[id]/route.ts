import { NextRequest } from 'next/server';
import { TirageService } from '@/services/tirageService';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id;
  
  if (!eventId) {
    return errorResponse('Event ID is required', 400);
  }

  return TirageService.getWinnersByEventId(eventId);
}