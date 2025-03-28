import { NextRequest } from 'next/server';
import { EventService } from '@/services/eventService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/options';
import { errorResponse } from '@/lib/apiUtils';


export async function GET(request: NextRequest) {
  return EventService.handleGetAllEvent(request);
}

export async function POST(request: NextRequest) {

  const session = await getServerSession(authOptions);
  
  // Double vérification des permissions (admin uniquement)
  if (!session || !session.user.isAdmin) {
    return errorResponse('Vous devez être administrateur pour créer un événement', 403);
  }
  return EventService.handleCreateEvent(request);
}
