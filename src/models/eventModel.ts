// Interface pour la création
export interface EventCreateInput {
    tourId: string;
    city: string;
    venue: string;
    eventDate: Date;
    endDate: Date;
    status?: string; // Maintenant optionnel
    placement?: string[]; // Nouveau champ optionnel pour le placement
}

// Interface pour la mise à jour
export interface EventUpdateInput {
    city?: string;
    venue?: string;
    eventDate?: Date;
    endDate?: Date;
    status?: string;
    placement?: string[]; // Nouveau champ optionnel pour le placement
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
}