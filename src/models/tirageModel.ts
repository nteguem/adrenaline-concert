// Définition des interfaces
export interface TirageRequest {
    eventId: string;
    nombreVainqueurs: number;
    dateTirage: Date;
  }
  

// Interface pour la création
export interface TirageCreateInput {
    eventId: string;
    nombreVainqueur: number;
    dateTirage: Date;
}


// Interface pour la mise à jour
export interface TirageUpdateInput {
    eventId?: string;
    nombreVainqueur?: number;
    dateTirage?: Date;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
  }