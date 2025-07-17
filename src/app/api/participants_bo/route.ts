import { NextRequest } from 'next/server';
import { ParticipantService } from '@/services/participantService';



export async function GET(request: NextRequest) {
  return ParticipantService.handleGetAllParticipants(request);
}

export async function POST(request: NextRequest) {

  return ParticipantService.handleCreateParticipant(request);
}
