
// Interface pour la création
export interface VainqCreateInput {
    tirageid?: string;
    participantId: string;
    rang: number;
    email: string;
    nom_participant: string;
    prenom_participant: string;
    ticketUrl?:     string
    ticketInfo?:    string
    porte?:         string
    place?:         string
}


// Interface pour la mise à jour
export interface VainqUpdateInput {
    tirageid?: string;
    participantId?: string;
    rang?: number;
    emai?: string;
    nom_participant?: string;
    prenom_participant?: string;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
  }