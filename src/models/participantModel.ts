// Interface pour la création
export interface ParticipantCreateInput {
    nom: string;
    prenom: string;
    dateNaissance: Date;
    email: string;
    eventId: string;
    rang ?: string;
    place ?: string;
    porte ?: string;
    bloc ?:  string
    gradin ?: string
    chaise ?:  string
    siege  ?:  string
    entree ?:  string
    niveau ?:  string
    parterre ?: string
    ticketUrl  ?: string
    tribune?: string
}


// Interface pour la mise à jour
export interface ParticipantUpdateInput {
    nom?: string;
    prenom?: string;
    dateNaissance?: Date;
    email?: string;
    eventId?: string;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
  }