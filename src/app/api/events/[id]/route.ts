// src/app/api/events/[id]/route.ts
import { NextRequest } from 'next/server';
import { EventService } from '@/services/eventService';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return EventService.handleGetEventById(request, { params });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return EventService.handleUpdateEvent(request, { params });
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  return EventService.handleDeleteEvent(request, { params });
}