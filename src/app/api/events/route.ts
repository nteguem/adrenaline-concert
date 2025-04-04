import { NextRequest } from 'next/server';
import { EventService } from '@/services/eventService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/options';
import { errorResponse } from '@/lib/apiUtils';


export async function GET(request: NextRequest) {
  return EventService.handleGetAllEvent(request);
}

export async function POST(request: NextRequest) {

 
  
  return EventService.handleCreateEvent(request);
}
