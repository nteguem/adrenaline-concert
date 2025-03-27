// Interface pour la création
export interface ParticipantCreateInput {
    nom: string;
    prenom: string;
    dateNaissance: Date;
    email: string;
}


// Interface pour la mise à jour
export interface ParticipantUpdateInput {
    nom?: string;
    prenom?: string;
    dateNaissance?: Date;
    email?: Date;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    search?: string;
  }