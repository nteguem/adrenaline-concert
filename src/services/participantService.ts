// adrenaline-concert/src/services/participantService.ts
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
    ParticipantCreateInput,
    ParticipantUpdateInput,
    PaginationOptions
} from '@/models/participantModel';

import { 
    successResponse, 
    errorResponse, 
    apiErrorHandler 
} from '@/lib/apiUtils';

export class ParticipantService {
    /**
     * Créer un nouveau participant
     * @param data Données du participant à créer
     * @returns Le participant créé avec un message de succès
     */
    static async createParticipant(data: ParticipantCreateInput): Promise<{ [key: string]: any }> {
        try {
            // Création du participant avec les données fournies
            const newParticipant = await prisma.participant.create({
                data: {
                    nom: data.nom,          
                    prenom: data.prenom, 
                    eventId: data.eventId, 
                    email: data.email,    
                    dateNaissance: new Date(data.dateNaissance),
                },
            });

            return {
                ...newParticipant,
                name: `${newParticipant.nom} ${newParticipant.prenom}`, // Format complet du nom
                message: 'success',
            };
        } catch (error) {
            console.error('Erreur lors de la création du participant:', error);
            throw error;
        }
    }

    /**
     * Gérer la création d'un nouveau participant depuis une requête API
     * @param request Requête entrante
     * @returns Réponse avec le participant créé ou message d'erreur
     */
    static async handleCreateParticipant(request: NextRequest) {
        try {
            const body = await request.json();
            
            // Validation des champs requis pour un participant
            const requiredFields: (keyof ParticipantCreateInput)[] = ['nom', 'prenom', 'email', 'dateNaissance'];
            const missingFields = requiredFields.filter(field => !body[field]);
            
            if (missingFields.length > 0) {
                return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
            }

            // Préparation des données du participant
            const participantInput: ParticipantCreateInput = {
                nom: body.nom,
                eventId: body.eventId,
                prenom: body.prenom,
                email: body.email,
                dateNaissance: body.dateNaissance,
            };
            
            // Création du participant
            const participant = await this.createParticipant(participantInput);
            return successResponse(participant, undefined, 201);
        } catch (error) {
            return apiErrorHandler(error);
        }
    }

    /**
     * Récupérer tous les participants avec pagination et recherche
     * @param options Options de pagination et de recherche
     * @returns Liste des participants et informations de pagination
     */
    static async getParticipants(options: PaginationOptions = {}): Promise<{
        participants: any[];
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
        
        try {
            // Construire la condition de recherche
            const whereCondition: Prisma.participantWhereInput = search
                ? {
                    OR: [
                        { nom: { contains: search, mode: 'insensitive' } },
                        { prenom: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {};
            
            // Récupérer les participants avec pagination
            const [participants, total] = await Promise.all([
                prisma.participant.findMany({
                    where: whereCondition,
                    skip,
                    take: limit,
                    orderBy: {
                        nom: 'asc',
                    },
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        dateNaissance: true,
                    }
                }),
                prisma.participant.count({
                    where: whereCondition,
                }),
            ]);
            
            return {
                participants,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    page,
                    limit,
                },
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des participants:', error);
            throw error;
        }
    }
    
    /**
     * Gérer la récupération de tous les participants
     * @param request Requête entrante
     * @returns Réponse avec la liste des participants
     */
    static async handleGetAllParticipants(request: NextRequest) {
        try {
            const { searchParams } = new URL(request.url);
            const limit = parseInt(searchParams.get('limit') || '10');
            const page = parseInt(searchParams.get('page') || '1');
            const search = searchParams.get('search') || '';
            
            const result = await this.getParticipants({ page, limit, search });
            
            return successResponse({
                participants: result.participants,
            }, result.pagination);
        } catch (error) {
            console.error('Erreur dans handleGetAllParticipants:', error);
            return apiErrorHandler(error);
        }
    }

    /**
     * Mettre à jour un participant existant
     * @param id Identifiant du participant à mettre à jour
     * @param data Données à mettre à jour
     * @returns Participant mis à jour
     */
    static async updateParticipant(id: string, data: ParticipantUpdateInput): Promise<{ [key: string]: any }> {
        try {
            // Vérifier si le participant existe
            const existingParticipant = await prisma.participant.findUnique({
                where: { id }
            });
            
            if (!existingParticipant) {
                throw new Error(`Participant avec l'ID ${id} non trouvé`);
            }
            
            // Préparer les données à mettre à jour
            const updateData: Prisma.participantWhereInput = {};
            
            // Ajouter uniquement les champs qui sont définis
            if (data.nom !== undefined) updateData.nom = data.nom;
            if (data.prenom !== undefined) updateData.prenom = data.prenom;
            if (data.email !== undefined) updateData.email = data.email;
            if (data.dateNaissance !== undefined) updateData.dateNaissance = new Date(data.dateNaissance);
            
            // Mettre à jour le participant
            const updatedParticipant = await prisma.participant.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    email: true,
                    eventId: true,
                    dateNaissance: true
                }
            });
            
            return {
                ...updatedParticipant,
                message: 'Participant mis à jour avec succès'
            };
        } catch (error) {
            console.error('Erreur lors de la mise à jour du participant:', error);
            throw error;
        }
    }
    
    /**
     * Gérer la mise à jour d'un participant
     * @param request Requête entrante
     * @param params Paramètres de la route
     * @returns Réponse avec le participant mis à jour
     */
    static async handleUpdateParticipant(request: NextRequest, { params }: { params: { id: string } }) {
        try {
            const id = params.id;
            
            if (!id) {
                return errorResponse('ID du participant manquant');
            }
            
            const body = await request.json();
            
            // Validation de base - au moins un champ à mettre à jour doit être présent
            const updateFields = ['nom', 'prenom', 'email', 'dateNaissance','eventId'];
            const hasUpdateFields = updateFields.some(field => body[field] !== undefined);
            
            if (!hasUpdateFields) {
                return errorResponse('Aucun champ à mettre à jour fourni');
            }
            
            // Préparer les données de mise à jour
            const updateInput: ParticipantUpdateInput = {};
            
            if (body.nom !== undefined) updateInput.nom = body.nom;
            if (body.prenom !== undefined) updateInput.prenom = body.prenom;
            if (body.email !== undefined) updateInput.email = body.email;
            if (body.dateNaissance !== undefined) updateInput.dateNaissance = body.dateNaissance;
            
            const updatedParticipant = await this.updateParticipant(id, updateInput);
            
            return successResponse(updatedParticipant);
        } catch (error) {
            return apiErrorHandler(error);
        }
    }
    
    /**
     * Obtenir un participant par son ID
     * @param id Identifiant du participant
     * @returns Données du participant
     */
    static async getParticipantById(id: string): Promise<{ [key: string]: any }> {
        try {
            const participant = await prisma.participant.findUnique({
                where: { id },
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    eventId: true,
                    email: true,
                    dateNaissance: true
                }
            });
            
            if (!participant) {
                throw new Error(`Participant avec l'ID ${id} non trouvé`);
            }
            
            return {
                participant
            };
        } catch (error) {
            console.error('Erreur lors de la récupération du participant:', error);
            throw error;
        }
    }
    
    /**
     * Gérer la récupération d'un participant par ID
     * @param request Requête entrante
     * @param params Paramètres de la route
     * @returns Réponse avec les données du participant
     */
    static async handleGetParticipantById(request: NextRequest, { params }: { params: { id: string } }) {
        try {
            const id = params.id;
            
            if (!id) {
                return errorResponse('ID du participant manquant');
            }
            
            const result = await this.getParticipantById(id);
            
            return successResponse(result);
        } catch (error) {
            return apiErrorHandler(error);
        }
    }
    
    /**
     * Supprimer un participant
     * @param id Identifiant du participant à supprimer
     */
    static async deleteParticipant(id: string): Promise<void> {
        try {
            // Vérifier si le participant existe
            const existingParticipant = await prisma.participant.findUnique({
                where: { id }
            });
            
            if (!existingParticipant) {
                throw new Error(`Participant avec l'ID ${id} non trouvé`);
            }
            
            // Supprimer le participant
            await prisma.participant.delete({
                where: { id }
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du participant:', error);
            throw error;
        }
    }

    /**
     * Gérer la suppression d'un participant
     * @param request Requête entrante
     * @param params Paramètres de la route
     * @returns Réponse de confirmation de suppression
     */
    static async handleDeleteParticipant(request: NextRequest, { params }: { params: { id: string } }) {
        try {
            const id = params.id;
            
            if (!id) {
                return errorResponse('ID du participant manquant');
            }
            
            await this.deleteParticipant(id);
            
            return successResponse({ message: 'Participant supprimé avec succès' });
        } catch (error) {
            return apiErrorHandler(error);
        }
    }
}