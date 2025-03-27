// src/app/api/events/[id]/route.ts
import { NextRequest } from 'next/server';
import { ParticipantService } from '@/services/participantService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ParticipantService.handleGetParticipantById(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ParticipantService.handleUpdateParticipant(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ParticipantService.handleDeleteParticipant(request, { params });
}