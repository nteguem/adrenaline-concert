// src/app/api/events/[id]/route.ts
import { NextRequest } from 'next/server';
import { EventService } from '@/services/eventService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return EventService.handleGetEventById(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return EventService.handleUpdateEvent(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return EventService.handleDeleteEvent(request, { params });
}