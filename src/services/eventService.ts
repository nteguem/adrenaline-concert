import { prisma } from '@/lib/db';
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
          status: data.status,
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
      const body = await request.json();
      
      // Validation des champs requis (sans tourId car il sera récupéré automatiquement)
      const requiredFields: (keyof Omit<EventCreateInput, 'tourId'>)[] = ['city', 'venue', 'eventDate', 'status'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }
      
      const userInput: Omit<EventCreateInput, 'tourId'> = {
        city: body.city,
        venue: body.venue,
        eventDate: body.eventDate,
        status: body.status,
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
    const {
      page = 1,
      limit = 10,
      search = '',
    } = options;
    
    const skip = (page - 1) * limit;
    
    try {
      // Construire la condition de recherche
      const whereCondition: Prisma.EventWhereInput = search
        ? {
            OR: [
              { city: { contains: search, mode: 'insensitive' } },
              { venue: { contains: search, mode: 'insensitive' } },
              { status: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};
      
      // Récupérer les événements avec pagination
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: {
            eventDate: 'desc',
          },
          select: {
            id: true,
            city: true,
            venue: true,
            eventDate: true,
            status: true,
          }
        }),
        prisma.event.count({
          where: whereCondition,
        }),
      ]);
      
      // Récupérer les informations de tour (si le modèle Tour existe)
      let tour = null;
      try {
        // Vérifier si le modèle Tour existe dans votre schéma Prisma
        if ('tour' in prisma) {
          // @ts-ignore - Ignorer l'erreur TypeScript si le modèle Tour n'est pas reconnu
          tour = await prisma.tour.findFirst({
            orderBy: {
              createdAt: 'desc'
            },
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
        // Ne pas faire échouer la requête principale si tour n'existe pas
      }
      
      return {
        events,
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
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
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
      
      // Mettre à jour l'événement
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          city: true,
          venue: true,
          eventDate: true,
          status: true
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
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }
      
      const body = await request.json();
      
      // Validation de base - au moins un champ à mettre à jour doit être présent
      const updateFields = ['city', 'venue', 'eventDate', 'status'];
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
      
      const updatedEvent = await this.updateEvent(id, updateInput);
      
      return successResponse(updatedEvent);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }
  
  // Obtenir un événement par son ID
  static async getEventById(id: string): Promise<{ [key: string]: any }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        select: {
          id: true,
          city: true,
          venue: true,
          eventDate: true,
          status: true
        }
      });
      
      if (!event) {
        throw new Error(`Événement avec l'ID ${id} non trouvé`);
      }
      
      // Récupérer les informations de tour (si le modèle Tour existe)
      let tour = null;
      try {
        // Vérifier si le modèle Tour existe dans votre schéma Prisma
        if ('tour' in prisma) {
          // @ts-ignore - Ignorer l'erreur TypeScript si le modèle Tour n'est pas reconnu
          tour = await prisma.tour.findFirst({
            orderBy: {
              createdAt: 'desc'
            },
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
        event,
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
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de l\'événement manquant');
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
}