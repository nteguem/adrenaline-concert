import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { 
  TourCreateInput,
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
    const newTour = await prisma.Tour.create({
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
        name: `${newTour.name}`,
        message: 'success'
      };
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
      
      const userInput: TourCreateInput = {
        name: body.name,
        description: body.description,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
      };
      
      const tour = await this.createTour(userInput);
      
      return successResponse(tour, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  static async getTours(options: PaginationOptions = {}): Promise<{
    
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
    const whereCondition: Prisma.TourWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { status: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    
    // Récupérer les utilisateurs avec pagination
    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          startDate: 'desc',
        },
      }),
      prisma.tour.count({
        where: whereCondition,
      }),
    ]);
    
    return {
        tours: tours,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    }
  


    // Récupérer tous les utilisateurs
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