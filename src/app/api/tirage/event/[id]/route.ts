
import { TirageService } from '@/services/tirageService';
import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
    request: NextRequest,
  { params }: { params: { id: string } }  // Changed from eventId to id to match the folder structure
) {
  const eventId = params.id;  // Changed to match the parameter name
  
  if (!eventId) {
    return errorResponse('Event ID is required', 400);
  }

  return TirageService.getTiragesByEventId(eventId);
}