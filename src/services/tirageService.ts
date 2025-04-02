// src/services/tirageService.ts
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, apiErrorHandler } from '@/lib/apiUtils';
import {
    TirageRequest,
    TirageCreateInput
} from '@/models/tirageModel';

import {
    VainqUpdateInput,
    VainqCreateInput
} from '@/models/vainqueurModel';
import { NextRequest } from 'next/server';
import { now } from 'mongoose';


export class TirageService {
  /**
   * Effectue un tirage au sort parmi les participants d'un événement
   * @param data Les données du tirage (eventId et nombreVainqueurs)
   * @returns Les résultats du tirage avec les vainqueurs sélectionnés
   */

  static async handleCreateTirage(request: NextRequest) {
        try{
            const body = await request.json();

            const tirageInput : TirageRequest = {
                eventId: body.eventId,
                nombreVainqueurs: body.nombreVainqueur,
                dateTirage: new Date()
              };

             
       const tirage = await this.faireTirage(tirageInput as TirageRequest);

       return successResponse(tirage, undefined, 201);
            

        } catch (error) {
            return apiErrorHandler(error);
          }
  }
  static async faireTirage(data: TirageRequest): Promise<{ [key: string]: any }> {
    try {
      // Validation des entrées

      console.log('=============> '+JSON.stringify(data));
      if (!data.eventId) {
        return errorResponse('ID de l\'événement requis', 400);
      }

      if (!data.nombreVainqueurs || data.nombreVainqueurs <= 0) {
        return errorResponse('Nombre de vainqueurs invalide', 400);
      }

      // 1. Vérifier que l'événement existe
      const event = await prisma.event.findUnique({
        where: { id: data.eventId }
      });

      if (!event) {
        return errorResponse('Événement non trouvé', 404);
      }

      // 2. Récupérer tous les participants de l'événement
      const participants = await prisma.participant.findMany({
        where: { eventId: data.eventId },
      });

      if (participants.length === 0) {
        return errorResponse('Aucun participant trouvé pour cet événement', 404);
      }

      // 3. Sélectionner aléatoirement les vainqueurs
      const vainqueurs = this.selectionnerVainqueurs(participants, data.nombreVainqueurs);

      // 4. Créer un enregistrement du tirage dans la base de données
      const tirageCreateData: TirageCreateInput = {
        eventId: data.eventId,
        nombreVainqueur: vainqueurs.length, // Le nombre réel de vainqueurs sélectionnés
        dateTirage: data.dateTirage,
      };

      // Utilisation de transaction pour garantir l'intégrité des données
      const result = await prisma.$transaction(async (tx) => {
        // Créer l'enregistrement du tirage
        const nouveauTirage = await tx.tirage.create({
          data: tirageCreateData,
        });

        // Créer les enregistrements des vainqueurs
        const vainqueursData: VainqCreateInput[] = vainqueurs.map((participant, index) => ({
          participantId: participant.id,
          email: participant.email,
          prenom_participant: participant.prenom,
          nom_participant: participant.nom,
          tirageid: nouveauTirage.id,
          rang: index + 1  // Le rang commence à 1
        }));

        // Créer les vainqueurs en base de données
        await tx.vainqueur.createMany({
          data: vainqueursData,
        });

        // Récupérer les vainqueurs avec plus de détails pour la réponse
        const vainqueursComplets = await tx.vainqueur.findMany({
          where: { tirageid: nouveauTirage.id },
          select: {
            id: true,
            prenom_participant: true,
            nom_participant: true,
            email: true,
        },
          orderBy: { rang: 'asc' }
        });

        return {
          tirage: nouveauTirage,
          vainqueurs: vainqueursComplets
        };
      });

      // 5. Renvoyer la réponse de succès avec les détails du tirage
      return successResponse({
        message: `${vainqueurs.length} vainqueurs ont été sélectionnés avec succès.`,
        tirage: result.tirage,
        vainqueurs: result.vainqueurs,
      });

    } catch (error) {
      console.error("Erreur lors du tirage au sort:", error);
      return apiErrorHandler(error);
    }
  }

  /**
   * Sélectionne aléatoirement des vainqueurs parmi une liste de participants
   * @param participants Liste des participants
   * @param nombreVainqueurs Nombre de vainqueurs à sélectionner
   * @returns Liste des vainqueurs sélectionnés
   */
  static selectionnerVainqueurs(participants: any[], nombreVainqueurs: number): any[] {
    // Créer une copie pour ne pas modifier l'original
    const participantsDisponibles = [...participants];
    const vainqueurs: any[] = [];

    // S'assurer que le nombre de vainqueurs ne dépasse pas le nombre de participants
    const nbVainqueursEffectif = Math.min(nombreVainqueurs, participantsDisponibles.length);

    // Algorithme de Fisher-Yates pour un mélange aléatoire efficace
    for (let i = participantsDisponibles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participantsDisponibles[i], participantsDisponibles[j]] = 
        [participantsDisponibles[j], participantsDisponibles[i]];
    }

    // Prendre les n premiers éléments du tableau mélangé
    return participantsDisponibles.slice(0, nbVainqueursEffectif);
  }

  /**
   * Récupère les résultats d'un tirage spécifique
   * @param tirageId ID du tirage à récupérer
   * @returns Les détails du tirage et ses vainqueurs
   */
 

  /**
   * Récupère tous les tirages pour un événement donné
   * @param eventId ID de l'événement
   * @returns Liste des tirages pour cet événement
   */

}

export default TirageService;