import { prisma, ensurePrismaConnected, isValidObjectId } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
    EventCreateInput,
    PaginationOptions,
    EventUpdateInput
} from '@/models/eventModel';

import { 
    successResponse, 
    errorResponse, 
    apiErrorHandler 
} from '@/lib/apiUtils';

export class EventService {

  // Créer un nouveau event
  static async createEvent(data: EventCreateInput): Promise<{ [key: string]: any }> {
    try {
      // Récupérer l'unique tour de la base de données
      const tour = await prisma.tour.findFirst({
        orderBy: {
          createdAt: 'desc' // Prendre le plus récent si plusieurs existent
        }
      });
      
      if (!tour) {
        throw new Error("Aucune tour n'a été trouvée dans la base de données");
      }
      
      // Utiliser l'ID de la tour récupérée
      const newEvent = await prisma.event.create({
        data: {
          tourId: tour.id, // Utiliser l'ID de la tour récupérée          
          city: data.city, 
          venue: data.venue,    
          eventDate: new Date(data.eventDate),       
          endDate: new Date(data?.endDate),       
          status: data.status || 'en_attente', // Valeur par défaut si status n'est pas fourni
          placement: data.placement || [], // Ajouter le champ placement avec valeur par défaut
        },
      });
      
      return {
        ...newEvent,
        name: `${newEvent.venue}`,
        message: 'success',
        tourName: tour.name // Inclure le nom de la tour pour référence
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  }

  // Gérer la création d'un nouveau event
  static async handleCreateEvent(request: NextRequest) {
    try {
      await ensurePrismaConnected();
      const body = await request.json();
      
      // Validation des champs requis (sans tourId car il sera récupéré automatiquement)
      // status et placement sont maintenant optionnels
      const requiredFields: (keyof Omit<EventCreateInput, 'tourId' | 'status' | 'placement'>)[] = ['city', 'venue','eventDate', 'endDate'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }
      
      const userInput: Omit<EventCreateInput, 'tourId'> = {
        city: body.city,
        venue: body.venue,
        eventDate: body.eventDate,
        endDate: body?.endDate,
        status: body.status, // Optionnel
        placement: body.placement, // Optionnel
      };
      
      // Le tourId sera récupéré automatiquement dans createEvent
      const event = await this.createEvent(userInput as EventCreateInput);
      
      return successResponse(event, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Récupérer tous les événements avec pagination et recherche
static async getEvents(options: PaginationOptions = {}): Promise<{
    events: any[];
    tour: any | null;
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    }
}> {
    const { page = 1, limit = 10, search = '' } = options;
    const skip = (page - 1) * limit;
    
    try {
      const whereCondition: Prisma.EventWhereInput = search
        ? {
            OR: [
              { city: { contains: search, mode: 'insensitive' } },
              { venue: { contains: search, mode: 'insensitive' } },
              { status: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};
      
      // Récupérer les événements sans _count pour éviter le $lookup MongoDB coûteux
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: {
            eventDate: 'asc',
          },
          select: {
            id: true,
            city: true,
            venue: true,
            eventDate: true,
            endDate: true,
            status: true,
            placement: true,
          }
        }),
        prisma.event.count({
          where: whereCondition,
        }),
      ]);

      // Compter les participants séparément pour chaque événement
      // Cela évite le problème de $lookup qui charge tous les documents
      const eventIds = events.map(e => e.id);
      const participantCounts = await prisma.participant.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: eventIds }
        },
        _count: {
          id: true
        }
      });

      // Créer un map pour un accès rapide aux counts
      const countMap = new Map(
        participantCounts.map(pc => [pc.eventId, pc._count.id])
      );

      const eventsWithCount = events.map(event => ({
        ...event,
        totalParticipants: countMap.get(event.id) || 0
      }));
      
      let tour = null;
      try {
        if ('tour' in prisma) {
          tour = await prisma.tour.findFirst({
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              description: true,
              startDate: true,
              endDate: true,
              status: true
            }
          });
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération des informations de tour:', error);
      }
      
      return {
        events: eventsWithCount,
        tour,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw error;
    }
}
  
  
  // Gérer la récupération de tous les événements
  // Gérer la récupération de tous les événements
  static async handleGetAllEvent(request: NextRequest) {
    try {
      await ensurePrismaConnected();
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '100');
      const page = parseInt(searchParams.get('page') || '1');
      const search = searchParams.get('search') || '';
      
      const result = await this.getEvents({ page, limit, search });
      
      // Restructurer la réponse pour avoir events et tour comme propriétés distinctes
      return successResponse({
        events: result.events,
        tour: result.tour
      }, result.pagination);
    } catch (error) {
      console.error('Erreur dans handleGetAllEvent:', error);
      return apiErrorHandler(error);
    }
  }

  // Mettre à jour un événement existant
  static async updateEvent(id: string, data: EventUpdateInput): Promise<{ [key: string]: any }> {
    try {
      // Vérifier si l'événement existe
      const existingEvent = await prisma.event.findUnique({
        where: { id }
      });
      
      if (!existingEvent) {
        throw new Error(`Événement avec l'ID ${id} non trouvé`);
      }
      
      // Préparer les données à mettre à jour
      const updateData: Prisma.EventUpdateInput = {};
      
      // Ajouter uniquement les champs qui sont définis
      if (data.city !== undefined) updateData.city = data.city;
      if (data.venue !== undefined) updateData.venue = data.venue;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
      if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
      if (data.placement !== undefined) updateData.placement = data.placement; // Ajouter placement
      
      // Mettre à jour l'événement
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          city: true,
          venue: true,
          eventDate: true,
          endDate: true,
          status: true,
          placement: true, // Inclure placement dans la réponse
        }
      });
      
      return {
        ...updatedEvent,
        message: 'Événement mis à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw error;
    }
  }
  
  // Gérer la mise à jour d'un événement
  static async handleUpdateEvent(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      await ensurePrismaConnected();
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }
      
      const body = await request.json();
      
      // Validation de base - au moins un champ à mettre à jour doit être présent
      const updateFields = ['city', 'venue', 'eventDate', 'status','endDate', 'placement'];
      const hasUpdateFields = updateFields.some(field => body[field] !== undefined);
      
      if (!hasUpdateFields) {
        return errorResponse('Aucun champ à mettre à jour fourni');
      }
      
      // Préparer les données de mise à jour
      const updateInput: EventUpdateInput = {};
      
      if (body.city !== undefined) updateInput.city = body.city;
      if (body.venue !== undefined) updateInput.venue = body.venue;
      if (body.eventDate !== undefined) updateInput.eventDate = body.eventDate;
      if (body.status !== undefined) updateInput.status = body.status;
      if (body.endDate !== undefined) updateInput.endDate = body.endDate;
      if (body.placement !== undefined) updateInput.placement = body.placement; // Ajouter placement
      
      const updatedEvent = await this.updateEvent(id, updateInput);
      
      return successResponse(updatedEvent);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }
  
  // Obtenir un événement par son ID
  static async getEventById(id: string): Promise<{ [key: string]: any }> {
  try {
    await ensurePrismaConnected();
    if (!isValidObjectId(id)) {
      throw Object.assign(new Error('ID de l\'événement invalide'), { statusCode: 400 });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        city: true,
        venue: true,
        eventDate: true,
        endDate: true,
        status: true,
        placement: true,
      }
    });
    
    if (!event) {
      throw new Error(`Événement avec l'ID ${id} non trouvé`);
    }
    
    // Compter les participants séparément
    const participantCount = await prisma.participant.count({
      where: { eventId: id }
    });
    
    let tour = null;
    try {
      if ('tour' in prisma) {
        tour = await prisma.tour.findFirst({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            status: true
          }
        });
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des informations de tour:', error);
    }
    
    return {
      event: {
        ...event,
        totalParticipants: participantCount
      },
      tour
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    throw error;
  }
}
  
  // Gérer la récupération d'un événement par ID
  static async handleGetEventById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      await ensurePrismaConnected();
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }
      if (!isValidObjectId(id)) {
        return errorResponse('ID de l\'événement invalide', 400);
      }
      
      const result = await this.getEventById(id);
      
      return successResponse(result);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }
  

  // Supprimer un événement
  static async deleteEvent(id: string): Promise<void> {
    try {
      // Vérifier si l'événement existe
      const existingEvent = await prisma.event.findUnique({
        where: { id }
      });
      
      if (!existingEvent) {
        throw new Error(`Événement avec l'ID ${id} non trouvé`);
      }
      
      // Supprimer l'événement
      await prisma.event.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      throw error;
    }
  }

  // Gérer la suppression d'un événement
  static async handleDeleteEvent(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      await ensurePrismaConnected();
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }
      
      await this.deleteEvent(id);
      
      return successResponse({ message: 'Événement supprimé avec succès' });
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

static async getEventsWithParticipants(): Promise<{ [key: string]: any }> {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        eventDate: 'asc'
      },
      select: {
        id: true,
        tourId: true,
        city: true,
        venue: true,
        eventDate: true,
        endDate: true,
        status: true,
        placement: true,
        createdAt: true,
      }
    });

    // Compter les participants pour tous les événements en une seule requête
    const eventIds = events.map(e => e.id);
    const participantCounts = await prisma.participant.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: eventIds }
      },
      _count: {
        id: true
      }
    });

    // Créer un map pour un accès rapide aux counts
    const countMap = new Map(
      participantCounts.map(pc => [pc.eventId, pc._count.id])
    );

    const eventsWithCount = events.map(event => ({
      ...event,
      totalParticipants: countMap.get(event.id) || 0
    }));

    return {
      events: eventsWithCount,
      message: 'Events retrieved successfully'
    };
  } catch (error) {
    console.error('Error fetching events with participants:', error);
    throw error;
  }
}
  static async handleGetEventsWithParticipants(request: NextRequest) {
    try {
      await ensurePrismaConnected();
      const result = await this.getEventsWithParticipants();
      return successResponse(result);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }
  
}