// src/app/api/participants_bo/[id]/route.ts
import { NextRequest } from 'next/server';
import { ParticipantService } from '@/services/participantService';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return ParticipantService.handleGetParticipantById(request, { params });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return ParticipantService.handleUpdateParticipant(request, { params });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return ParticipantService.handleDeleteParticipant(request, { params });
}