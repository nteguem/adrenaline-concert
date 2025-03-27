import { NextRequest } from 'next/server';
import { ParticipantService } from '@/services/participantService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { errorResponse } from '@/lib/apiUtils';


export async function GET(request: NextRequest) {
  return ParticipantService.handleGetAllParticipants(request);
}

export async function POST(request: NextRequest) {

  const session = await getServerSession(authOptions);
  
  // Double vérification des permissions (admin uniquement)
  if (!session || !session.user.isAdmin) {
    return errorResponse('Vous devez être administrateur pour créer un événement', 403);
  }
  return ParticipantService.handleCreateParticipant(request);
}
