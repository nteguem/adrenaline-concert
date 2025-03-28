// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/services/eventService';

// Plus explicite sur le type du contexte
interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    return await EventService.handleGetEventById(request, context);
  } catch (error) {
    console.error('Error in GET /api/events/[id]:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de l\'événement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    return await EventService.handleUpdateEvent(request, context);
  } catch (error) {
    console.error('Error in PUT /api/events/[id]:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de l\'événement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    return await EventService.handleDeleteEvent(request, context);
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression de l\'événement' },
      { status: 500 }
    );
  }
}