import { NextRequest } from 'next/server';
import { EventService } from '@/services/eventService';

export async function GET(request: NextRequest) {
    return EventService.handleGetEventsWithParticipants(request);
}
