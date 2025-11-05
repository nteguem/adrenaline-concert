export interface ParticipantCreateInput {
    nom: string;
    prenom: string;
    email: string;
    eventId: string;
    dateNaissance: Date;
    phone?: string; 
    placementValues?: { [key: string]: string };
    ticketUrl?: string;
    textInfo?: string;
    accepteInfos?: boolean;
}

export interface ParticipantUpdateInput {
    nom?: string;
    prenom?: string;
    email?: string;
    dateNaissance?: Date;
    phone?: string;
    placementValues?: { [key: string]: string };
    ticketUrl?: string;
    textInfo?: string;
    accepteInfos?: boolean;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
}