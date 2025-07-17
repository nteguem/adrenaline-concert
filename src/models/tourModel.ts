// Interface pour la création
export interface TourCreateInput {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: string;
}

// Interface pour la mise à jour
export interface TourUpdateInput {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string; // Format ISO 8601
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
  }
  