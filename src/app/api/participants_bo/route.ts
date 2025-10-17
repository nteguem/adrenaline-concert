import { NextRequest, NextResponse } from 'next/server';
import { ParticipantService } from '@/services/participantService';

export async function GET(request: NextRequest) {
  const result = await ParticipantService.handleGetAllParticipants(request);
  
  // Ajouter headers CORS à la réponse existante
  if (result instanceof NextResponse) {
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return result;
  }
  
  // Fallback si ce n'est pas une NextResponse
  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function POST(request: NextRequest) {
  const result = await ParticipantService.handleCreateParticipant(request);
  
  // Ajouter headers CORS à la réponse
  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
