import { NextRequest } from 'next/server';
import { EventService } from '@/services/eventService';

export async function GET(request: NextRequest) {
  return EventService.handleGetAllEvent(request);
}

export async function POST(request: NextRequest) {
  return EventService.handleCreateEvent(request);
}
