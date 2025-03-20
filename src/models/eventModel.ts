import { Event as PrismaEvent } from '@prisma/client';



// Interface pour la création
export interface EventCreateInput {
    tourId: string;
    city:   string;
    venue:  string;
    eventDate:  Date;
    status: string;
}

// Interface pour la mise à jour
export interface EventUpdateInput {
    tourId: string;
    city:   string;
    venue:  string;
    eventDate:  Date;
    status?: string;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
  }