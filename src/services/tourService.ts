import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { 
  TourCreateInput,
  TourUpdateInput,
  PaginationOptions
} from '@/models/tourModel';

import { 
  successResponse, 
  errorResponse, 
  apiErrorHandler 
} from '@/lib/apiUtils';

export class TourService {

  // Créer un nouveau tour
  static async createTour(data: TourCreateInput): Promise<{ [key: string]: any }> {
    try {
      const newTour = await prisma.tour.create({
        data: {
          name: data.name,         
          description: data.description,  
          startDate: new Date(data.startDate),    
          endDate: new Date(data.endDate),       
          status: data.status,
        },
      });
      
      return {
        ...newTour,
        message: 'Tournée créée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la création de la tournée:', error);
      throw error;
    }
  }

  // Gérer la création d'un nouveau tour
  static async handleCreateTour(request: NextRequest) {
    try {
      const body = await request.json();
      
      // Validation des champs requis
      const requiredFields: (keyof TourCreateInput)[] = ['name', 'description', 'startDate', 'endDate', 'status'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }
      
      const tourInput: TourCreateInput = {
        name: body.name,
        description: body.description,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
      };
      
      const tour = await this.createTour(tourInput);
      
      return successResponse(tour, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Mettre à jour une tournée existante
  static async updateTour(id: string, data: TourUpdateInput): Promise<{ [key: string]: any }> {
    try {
      // Vérifier si la tournée existe
      const existingTour = await prisma.tour.findUnique({
        where: { id }
      });
      
      if (!existingTour) {
        throw new Error(`Tournée avec l'ID ${id} non trouvée`);
      }
      
      // Préparer les données à mettre à jour
      const updateData: Prisma.TourUpdateInput = {};
      
      // Ajouter uniquement les champs qui sont définis
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
      
      // Mettre à jour la tournée
      const updatedTour = await prisma.tour.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          status: true,
          createdAt: true
        }
      });
      
      return {
        ...updatedTour,
        message: 'Tournée mise à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tournée:', error);
      throw error;
    }
  }
  
  // Gérer la mise à jour d'une tournée
  static async handleUpdateTour(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de la tournée manquant');
      }
      
      const body = await request.json();
      
      // Validation de base - au moins un champ à mettre à jour doit être présent
      const updateFields = ['name', 'description', 'startDate', 'endDate', 'status'];
      const hasUpdateFields = updateFields.some(field => body[field] !== undefined);
      
      if (!hasUpdateFields) {
        return errorResponse('Aucun champ à mettre à jour fourni');
      }
      
      // Préparer les données de mise à jour
      const updateInput: TourUpdateInput = {};
      
      if (body.name !== undefined) updateInput.name = body.name;
      if (body.description !== undefined) updateInput.description = body.description;
      if (body.startDate !== undefined) updateInput.startDate = body.startDate;
      if (body.endDate !== undefined) updateInput.endDate = body.endDate;
      if (body.status !== undefined) updateInput.status = body.status;
      
      const updatedTour = await this.updateTour(id, updateInput);
      
      return successResponse(updatedTour);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Récupérer une tournée par son ID
  static async getTourById(id: string): Promise<{ [key: string]: any }> {
    try {
      const tour = await prisma.tour.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          status: true,
          createdAt: true
        }
      });
      
      if (!tour) {
        throw new Error(`Tournée avec l'ID ${id} non trouvée`);
      }
      
      return tour;
    } catch (error) {
      console.error('Erreur lors de la récupération de la tournée:', error);
      throw error;
    }
  }
  
  // Gérer la récupération d'une tournée par ID
  static async handleGetTourById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = params.id;
      
      if (!id) {
        return errorResponse('ID de la tournée manquant');
      }
      
      const tour = await this.getTourById(id);
      
      return successResponse(tour);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  static async getToursWithEvents() {
    try {
      const tours = await prisma.tour.findMany({
        orderBy: {
          startDate: 'desc'
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

      // Get events for each tour and sort them
      const toursWithEvents = await Promise.all(
        tours.map(async (tour) => {
          const events = await prisma.event.findMany({
            where: {
              tourId: tour.id,
              eventDate: {
                gte: new Date() // Only future events
              }
            },
            orderBy: {
              eventDate: 'asc' // Closest dates first
            },
            select: {
              id: true,
              city: true,
              venue: true,
              eventDate: true,
              endDate: true,
              status: true
            }
          });

          return {
            ...tour,
            events
          };
        })
      );

      // Filter out tours with no upcoming events if needed
      const toursWithUpcomingEvents = toursWithEvents.filter(tour => tour.events.length > 0);

      return successResponse({
        message: `${toursWithUpcomingEvents.length} tours trouvés`,
        tours: toursWithUpcomingEvents
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des tours:", error);
      return apiErrorHandler(error);
    }
  }


  // Récupérer toutes les tournées avec pagination et recherche
  static async getTours(options: PaginationOptions = {}): Promise<{
    tours: any[];
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
      const whereCondition: Prisma.TourWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { status: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};
      
      // Récupérer les tournées avec pagination
      const [tours, total] = await Promise.all([
        prisma.tour.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: {
            startDate: 'desc',
          },
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.tour.count({
          where: whereCondition,
        }),
      ]);
      
      return {
        tours,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des tournées:', error);
      throw error;
    }
  }

  // Récupérer toutes les tournées
  static async handleGetAllTour(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const page = parseInt(searchParams.get('page') || '1');
      const search = searchParams.get('search') || '';
      
      const result = await this.getTours({ page, limit, search });
      
      return successResponse(result.tours, result.pagination);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }
}