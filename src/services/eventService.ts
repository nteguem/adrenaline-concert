import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { 
    EventUpdateInput, 
    EventCreateInput,
  PaginationOptions
} from '@/models/eventModel';

import { 
    successResponse, 
    errorResponse, 
    apiErrorHandler 
  } from '@/lib/apiUtils';

export class EventService {

  // Créer un nouveau event
  static async createEvent(data: EventCreateInput): Promise<{ [key: string]: any }> {
    const newEvent = await prisma.Event.create({
      data: {
        tourId: data.tourId,         
        city: data.city,  
        venue: data.venue,    
        eventDate: new Date(data.eventDate),       
        status: data.status,
      },

    });
    
    return {
        ...newEvent,
        name: `${newEvent.venue}`,
        message: 'success'
      };
  }

  // Gérer la création d'un nouveau event
  static async handleCreateEvent(request: NextRequest) {
    try {
      const body = await request.json();
      
      // Validation des champs requis
      const requiredFields: (keyof EventCreateInput)[] = ['tourId', 'city', 'venue', 'eventDate', 'status'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }
      
      const userInput: EventCreateInput = {
        tourId: body.tourId,
        city: body.city,
        venue: body.venue,
        eventDate: body.eventDate,
        status: body.status,
      };
      
      const event = await this.createEvent(userInput);
      
      return successResponse(event, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  static async getEvent(options: PaginationOptions = {}): Promise<{
    
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    }
  }> {
    const {
      page = 1,
      limit = 10,
      search = '',
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Construire la condition de recherche pour MongoDB
    const whereCondition: Prisma.EventWhereInput = search
      ? {
          OR: [
            { city: { contains: search, mode: 'insensitive' } },
            { venue:  { contains: search, mode: 'insensitive' } },
            { status: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    
    // Récupérer les utilisateurs avec pagination
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
        eventDate: 'desc',
        },
      }),
      prisma.event.count({
        where: whereCondition,
      }),
    ]);
    
    return {
        events: events,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    }
  


    // Récupérer tous les utilisateurs
    static async handleGetAllEvent(request: NextRequest) {
        try {
          const { searchParams } = new URL(request.url);
          const limit = parseInt(searchParams.get('limit') || '10');
          const page = parseInt(searchParams.get('page') || '1');
          const search = searchParams.get('search') || '';
          
          const result = await this.getEvent({ page, limit, search });
          
          return successResponse(result.events, result.pagination);
        } catch (error) {
          return apiErrorHandler(error);
        }
      }
}