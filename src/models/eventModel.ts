// Interface pour la création
export interface EventCreateInput {
    tourId: string;
    city: string;
    venue: string;
    eventDate: Date;
    endDate: Date;
    status?: string;
    placement?: string[];
    meetTime: string;
    meetInstructions: string;
}

// Interface pour la mise à jour
export interface EventUpdateInput {
    city?: string;
    venue?: string;
    eventDate?: Date;
    endDate?: Date;
    status?: string;
    placement?: string[];
    meetTime: string;
    meetInstructions: string;
}

// Interface pour la pagination
export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
}

// Interface pour un participant
export interface Participant {
    id: string;
    nom: string;
    prenom: string;
    eventId: string;
    dateNaissance: Date;
    email: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    placement?: any;
    ticketUrl?: string;
    textInfo?: string;
}

// Interface pour un événement complet
export interface Event {
    id: string;
    tourId: string;
    city: string;
    venue: string;
    eventDate: Date;
    endDate: Date;
    status: string;
    placement: string[];
    createdAt: Date;
    meetTime: string;
    meetInstructions: string;
}

// Interface pour un événement avec participants
export interface EventWithParticipants extends Event {
    participants: Participant[];
    _count?: {
        participants: number;
    };
}

// Interface pour la réponse d'un événement
export interface EventResponse {
    event: EventWithParticipants;
    totalParticipants: number;
}

// Interface pour la réponse de la liste des événements
export interface EventListResponse {
    events: EventWithParticipants[];
    tour: {
        id: string;
        name: string;
        description: string;
        startDate: Date;
        endDate: Date;
        status: string;
    } | null;
    pagination: {
        total: number;
        pages: number;
        page: number;
        limit: number;
    };
}