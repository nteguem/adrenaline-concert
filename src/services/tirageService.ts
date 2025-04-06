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


export class TirageService {
  /**
   * Effectue un tirage au sort parmi les participants d'un événement
   * @param data Les données du tirage (eventId et nombreVainqueurs)
   * @returns Les résultats du tirage avec les vainqueurs sélectionnés
   */

  static async handleCreateTirage(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.eventId || !body.nombreVainqueur) {
            return errorResponse('eventId and nombreVainqueur are required', 400);
        }

        const tirageInput: TirageRequest = {
            eventId: body.eventId,
            nombreVainqueurs: Number(body.nombreVainqueur),
            dateTirage: new Date()
        };

        const tirageResult = await this.faireTirage(tirageInput);
        
        if ('error' in tirageResult) {
            return tirageResult;
        }

        // Return the complete result directly
        return tirageResult;

    } catch (error) {
        return apiErrorHandler(error);
    }
}
  static async faireTirage(data: TirageRequest): Promise<{ [key: string]: any }> {
    try {
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

      // 2. Vérifier si un tirage existe déjà pour cet événement
      const existingTirage = await prisma.tirage.findFirst({
        where: { eventId: data.eventId }
      });

      // 3. Récupérer tous les participants de l'événement
      const participants = await prisma.participant.findMany({
        where: { eventId: data.eventId },
      });

      if (participants.length === 0) {
        return errorResponse('Aucun participant trouvé pour cet événement', 404);
      }

      // 4. Sélectionner aléatoirement les vainqueurs
      const vainqueurs = this.selectionnerVainqueurs(participants, data.nombreVainqueurs);

      // 5. Utilisation de transaction pour garantir l'intégrité des données
      const result = await prisma.$transaction(async (tx) => {
        let nouveauTirage;

        if (existingTirage) {
          // Si un tirage existe, supprimer d'abord les anciens vainqueurs
          await tx.vainqueur.deleteMany({
            where: { tirageid: existingTirage.id }
          });
          

          // Mettre à jour le tirage existant
          nouveauTirage = await tx.tirage.update({
            where: { id: existingTirage.id },
            data: {
              nombreVainqueur: vainqueurs.length,
              dateTirage: data.dateTirage
            }
          });
        } else {
          // Créer un nouveau tirage
          nouveauTirage = await tx.tirage.create({
            data: {
              eventId: data.eventId,
              nombreVainqueur: vainqueurs.length,
              dateTirage: data.dateTirage,
            }
          });
        }

        // Créer les nouveaux vainqueurs
        const vainqueursData = vainqueurs.map((participant, index) => ({
          participantId: participant.id,
          email: participant.email,
          prenom_participant: participant.prenom,
          nom_participant: participant.nom,
          tirageid: nouveauTirage.id,
          rang: index + 1
        }));

        // Créer les vainqueurs en base de données
        await tx.vainqueur.createMany({
          data: vainqueursData,
        });

        // Récupérer les vainqueurs avec plus de détails
        const vainqueursComplets = await tx.vainqueur.findMany({
          where: { tirageid: nouveauTirage.id },
          select: {
            id: true,
            prenom_participant: true,
            nom_participant: true,
            email: true,
            rang: true
          },
          orderBy: { rang: 'asc' }
        });

        return {
          tirage: nouveauTirage,
          vainqueurs: vainqueursComplets
        };
      });

      // 6. Renvoyer la réponse de succès
      const message = existingTirage 
        ? `Tirage mis à jour avec succès. ${result.vainqueurs.length} nouveaux vainqueurs sélectionnés.`
        : `${result.vainqueurs.length} vainqueurs ont été sélectionnés avec succès.`;

      return successResponse({
        message,
        code: 201,
        // tirage: result.tirage,
        // vainqueurs: result.vainqueurs
      }, undefined, 201);

    } catch (error) {
      console.error("Erreur lors du tirage au sort:", error);
      return apiErrorHandler(error);
    }
}

static async getAllTiragesWithEvents() {
  try {
    const tirages = await prisma.tirage.findMany({
      orderBy: {
        dateTirage: 'desc'
      },
      select: {
        id: true,
        eventId: true,
        dateTirage: true,
        nombreVainqueur: true,
        createdAt: true
      }
    });

    // Get associated events for each tirage
    const tiragesWithEvents = await Promise.all(
      tirages.map(async (tirage) => {
        const event = await prisma.event.findUnique({
          where: { id: tirage.eventId },
          select: {
            id: true,
            city: true,
            venue: true,
            eventDate: true,
            endDate: true,
            status: true
          }
        });

        return {
          ...tirage,
          event: event || null
        };
      })
    );

    return successResponse({
      message: `${tirages.length} tirages trouvés`,
      tirages: tiragesWithEvents
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des tirages:", error);
    return apiErrorHandler(error);
  }
}

  /**
   * Récupère tous les tirages avec leurs vainqueurs associés
   * @returns Liste de tous les tirages avec leurs vainqueurs
   */
static async getAllTiragesWithWinners() {
    try {
      // Fix the syntax error in the query
      const tirages = await prisma.tirage.findMany({
        orderBy: {
          dateTirage: 'desc'
        }
      });

      // Get all winners for each tirage
      const tiragesWithDetails = await Promise.all(
        tirages.map(async (tirage) => {
          try {
            const vainqueurs = await prisma.vainqueur.findMany({
              where: {
                tirageid: tirage.id
              },
              select: {
                id: true,
                prenom_participant: true,
                nom_participant: true,
                email: true,
                rang: true
              },
              orderBy: {
                rang: 'asc'
              }
            });

            const event = await prisma.event.findUnique({
              where: {
                id: tirage.eventId
              }
            });

            return {
              ...tirage,
              event,
              vainqueurs
            };
          } catch (error) {
            console.error(`Error fetching details for tirage ${tirage.id}:`, error);
            return {
              ...tirage,
              event: null,
              vainqueurs: []
            };
          }
        })
      );

      return successResponse({
        message: tiragesWithDetails.length > 0 
          ? `${tiragesWithDetails.length} tirages trouvés` 
          : 'Aucun tirage trouvé',
        tirages: tiragesWithDetails
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des tirages:", error);
      return apiErrorHandler(error);
    }
}

static async getWinnersByEventId(eventId: string) {
  try {
    // First get the tirage for this event
    const tirage = await prisma.tirage.findFirst({
      where: {
        eventId: eventId
      }
    });

    if (!tirage) {
      return errorResponse('Aucun tirage trouvé pour cet événement', 404);
    }

    // Get the winners for this tirage
    const vainqueurs = await prisma.vainqueur.findMany({
      where: {
        tirageid: tirage.id
      },
      select: {
        id: true,
        prenom_participant: true,
        nom_participant: true,
        email: true,
        rang: true
      },
      orderBy: {
        rang: 'asc'
      }
    });

    return successResponse({
      message: `${vainqueurs.length} vainqueurs trouvés`,
      tirage: tirage,
      vainqueurs: vainqueurs
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des vainqueurs:", error);
    return apiErrorHandler(error);
  }
}

static async getWinnersByTirageId(tirageId: string) {
  try {
    const vainqueurs = await prisma.vainqueur.findMany({
      where: {
        tirageid: tirageId
      },
      select: {
        id: true,
        prenom_participant: true,
        nom_participant: true,
        email: true,
        rang: true
      },
      orderBy: {
        rang: 'asc'
      }
    });

    if (!vainqueurs.length) {
      return errorResponse('Aucun vainqueur trouvé pour ce tirage', 404);
    }

    return successResponse({
      message: `${vainqueurs.length} vainqueurs trouvés`,
      vainqueurs: vainqueurs
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des vainqueurs:", error);
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


  static async getTiragesByEventId(eventId: string) {
    try {
      const tirages = await prisma.tirage.findMany({
        where: {
          eventId: eventId
        },
        orderBy: {
          dateTirage: 'desc'
        },
        select: {
          id: true,
          eventId: true,
          dateTirage: true,
          nombreVainqueur: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!tirages.length) {
        return errorResponse('Aucun tirage trouvé pour cet événement', 404);
      }

      return successResponse({
        message: `${tirages.length} tirages trouvés pour l'événement`,
        tirages: tirages
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des tirages:", error);
      return apiErrorHandler(error);
    }
  }

  

}

export default TirageService;