// src/services/tirageService.ts
import { getDatabase, isValidObjectId } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
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

        return tirageResult;

    } catch (error) {
        return apiErrorHandler(error);
    }
  }

  static async faireTirage(data: TirageRequest): Promise<{ [key: string]: any }> {
    try {
      const now = new Date();
      const db = await getDatabase();
      if (!data.eventId) {
        return errorResponse('ID de l\'événement requis', 400);
      }

      if (!data.nombreVainqueurs || data.nombreVainqueurs <= 0) {
        return errorResponse('Nombre de vainqueurs invalide', 400);
      }

      if (!isValidObjectId(data.eventId)) {
        return errorResponse('ID de l\'événement invalide', 400);
      }

      // 1. Vérifier que l'événement existe
      const event = await db.collection('Event').findOne({
        _id: new ObjectId(data.eventId)
      });

      if (!event) {
        return errorResponse('Événement non trouvé', 404);
      }

      // 2. Vérifier si un tirage existe déjà pour cet événement
      const existingTirage = await db.collection('tirage').findOne({
        eventId: data.eventId,
      });

      // 3. Récupérer tous les participants de l'événement
      const participants = await db.collection('participant').find({ eventId: new ObjectId(data.eventId) }).toArray();

      if (participants.length === 0) {
        return errorResponse('Aucun participant trouvé pour cet événement', 404);
      }

      // 4. Sélectionner aléatoirement les vainqueurs
      const vainqueurs = this.selectionnerVainqueurs(participants, data.nombreVainqueurs);

      // 5. Utilisation de transaction pour garantir l'intégrité des données
      let nouveauTirage;

      if (existingTirage) {
        // Si un tirage existe, supprimer d'abord les anciens vainqueurs
        await db.collection('vainqueur').deleteMany({ tirageid: existingTirage._id.toString() });
        // Mettre à jour le tirage existant
        nouveauTirage = (await db.collection('tirage').findOneAndUpdate(
          { _id: existingTirage._id },
          {
            $set: {
              nombreVainqueur: vainqueurs.length,
              dateTirage: data.dateTirage
            }
          },
          { returnDocument: 'after' },
        ))?.value;
      } else {
        // Créer un nouveau tirage
        const result = await db.collection('tirage').insertOne({
          eventId: data.eventId,
          nombreVainqueur: vainqueurs.length,
          dateTirage: data.dateTirage,
          createdAt: now,
          updatedAt: now,
        });

        nouveauTirage = await db.collection('tirage').findOne({ _id: result.insertedId });
      }

      // Créer les nouveaux vainqueurs (données minimales, le reste via jointure)
      const vainqueursData = vainqueurs.map((participant, index) => ({
        participantId: participant._id.toString(),
        email: participant.email,
        prenom_participant: participant.prenom,
        nom_participant: participant.nom,
        tirageid: nouveauTirage._id.toString(),
        rang: index + 1,
        porte: participant.porte ?? '',
        place: participant.place ?? '',
        ticketUrl: participant.ticketUrl ?? '',
        ticketInfo: participant.textInfo ?? '',
        createdAt: now,
        updatedAt: now,
      }));

      // Créer les vainqueurs en base de données
      await db.collection('vainqueur').insertMany(vainqueursData);

      // ← JOINTURE : Récupérer les vainqueurs avec toutes les données des participants
      const vainqueursComplets = await db.collection("vainqueur").aggregate([
        { $match: { tirageid: nouveauTirage._id.toString() } },
        { $sort: { rang: 1 } },
        {
          $addFields: {
            participantObjId: { $toObjectId: "$participantId" }
          }
        },
        {
          $lookup: {
            from: "participant",
            localField: "participantObjId",
            foreignField: "_id",
            as: "participant"
          }
        },
        { $unwind: "$participant" },
        {
          $project: {
            id: "$_id",
            prenom_participant: 1,
            nom_participant: 1,
            email: 1,
            rang: 1,
            ticketInfo: 1,
            porte: 1,
            place: 1,
            participant: {
              id: "$participant._id",
              nom: "$participant.nom",
              prenom: "$participant.prenom",
              email: "$participant.email",
              phone: "$participant.phone",
              dateNaissance: "$participant.dateNaissance",
              placement: "$participant.placement",
              textInfo: "$participant.textInfo",
              accepteInfos: "$participant.accepteInfos",
            }
          }
        }
      ]).toArray();

      const result = {
        tirage: nouveauTirage,
        vainqueurs: vainqueursComplets
      };

      // 6. Renvoyer la réponse de succès
      const message = existingTirage
        ? `Tirage mis à jour avec succès. ${result.vainqueurs.length} nouveaux vainqueurs sélectionnés.`
        : `${result.vainqueurs.length} vainqueurs ont été sélectionnés avec succès.`;

      return successResponse({
        message,
        code: 201,
        tirage: result.tirage,
        vainqueurs: result.vainqueurs // ← DONNÉES ENRICHIES AVEC JOINTURE
      }, undefined, 201);

    } catch (error) {
      console.error("Erreur lors du tirage au sort:", error);
      return apiErrorHandler(error);
    }
  }

  static async getAllTiragesWithEvents() {
    try {
      const db = await getDatabase();
      const tirages = await db.collection("tirage")
        .find({}, {
          projection: {
            _id: 1,
            id: "$_id",
            eventId: 1,
            dateTirage: 1,
            nombreVainqueur: 1,
            createdAt: 1
          }
        })
        .sort({ dateTirage: -1 })
        .toArray();

      const tiragesWithEvents = await Promise.all(
        tirages.map(async (tirage) => {
          const event = await await db.collection("Event").findOne(
            { _id: new ObjectId(tirage.eventId) },
            {
              projection: {
                _id: 1,
                city: 1,
                venue: 1,
                eventDate: 1,
                endDate: 1,
                status: 1
              }
            }
          );

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

  static async getAllTiragesWithWinners() {
    try {
      const db = await getDatabase();
      const tirages = await db.collection('tirage').find({})
        .sort({ dateTirage: -1 })
        .toArray();

      const tiragesWithDetails = await Promise.all(
        tirages.map(async (tirage) => {
          try {
            // ← JOINTURE : Récupérer les vainqueurs avec les données des participants
            const vainqueurs = await db.collection("vainqueur").aggregate([
              { $match: { tirageid: tirage._id.toString() } },
              { $sort: { rang: 1 } },
              {
                $addFields: {
                  participantObjId: { $toObjectId: "$participantId" }
                }
              },
              {
                $lookup: {
                  from: "participant",
                  localField: "participantObjId",
                  foreignField: "_id",
                  as: "participant"
                }
              },
              { $unwind: "$participant" },
              {
                $project: {
                  id: "$_id",
                  prenom_participant: 1,
                  nom_participant: 1,
                  email: 1,
                  rang: 1,
                  ticketInfo: 1,
                  porte: 1,
                  place: 1,
                  participant: {
                    phone: "$participant.phone",
                    dateNaissance: "$participant.dateNaissance",
                    placement: "$participant.placement",
                    textInfo: "$participant.textInfo"
                  }
                }
              }
            ]).toArray();

            const event = await db.collection('Event').findOne({
              _id: new ObjectId(tirage.eventId)
            });

            return {
              ...tirage,
              event,
              vainqueurs
            };
          } catch (error) {
            console.error(`Error fetching details for tirage ${tirage._id.toString()}:`, error);
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
      const db = await getDatabase();
      if (!isValidObjectId(eventId)) {
        return errorResponse('ID de l\'événement invalide', 400);
      }
      const tirage = await db.collection('tirage').findOne({ eventId });

      if (!tirage) {
        // Retourner un tableau vide au lieu d'une erreur 404
        return successResponse({
          vainqueurs: [],
          message: 'Aucun tirage trouvé pour cet événement'
        });
      }

      // ← JOINTURE : Récupérer les vainqueurs avec toutes les données des participants
      const vainqueurs = await db.collection("vainqueur").aggregate([
        { $match: { tirageid: tirage._id.toString() } },
        { $sort: { rang: 1 } },
        {
          $addFields: {
            participantObjId: { $toObjectId: "$participantId" }
          }
        },
        {
          $lookup: {
            from: "participant",
            localField: "participantObjId",
            foreignField: "_id",
            as: "participant"
          }
        },
        { $unwind: "$participant" },
        {
          $project: {
            id: "$_id",
            prenom_participant: 1,
            nom_participant: 1,
            email: 1,
            rang: 1,
            ticketInfo: 1,
            porte: 1,
            place: 1,
            participant: {
              phone: "$participant.phone",
              dateNaissance: "$participant.dateNaissance",
              placement: "$participant.placement",
              textInfo: "$participant.textInfo"
            }
          }
        }
      ]).toArray();

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
      const db = await getDatabase();
      if (!isValidObjectId(tirageId)) {
        return errorResponse('ID du tirage invalide', 400);
      }
      // ← JOINTURE : Récupérer les vainqueurs avec toutes les données des participants
      const vainqueurs = await db.collection("vainqueur").aggregate([
        { $match: { tirageid: tirageId } },
        { $sort: { rang: 1 } },
        {
          $addFields: {
            participantObjId: { $toObjectId: "$participantId" }
          }
        },
        {
          $lookup: {
            from: "participant",
            localField: "participantObjId",
            foreignField: "_id",
            as: "participant"
          }
        },
        { $unwind: "$participant" },
        {
          $project: {
            id: "$_id",
            prenom_participant: 1,
            nom_participant: 1,
            email: 1,
            rang: 1,
            ticketInfo: 1,
            porte: 1,
            place: 1,
            participant: {
              phone: "$participant.phone",
              dateNaissance: "$participant.dateNaissance",
              placement: "$participant.placement",
              textInfo: "$participant.textInfo"
            }
          }
        }
      ]).toArray();

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

  static selectionnerVainqueurs(participants: any[], nombreVainqueurs: number): any[] {
    const participantsDisponibles = [...participants];
    const vainqueurs: any[] = [];

    const nbVainqueursEffectif = Math.min(nombreVainqueurs, participantsDisponibles.length);

    // Algorithme de Fisher-Yates pour un mélange aléatoire efficace
    for (let i = participantsDisponibles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participantsDisponibles[i], participantsDisponibles[j]] =
        [participantsDisponibles[j], participantsDisponibles[i]];
    }

    return participantsDisponibles.slice(0, nbVainqueursEffectif);
  }

  static async getTiragesByEventId(eventId: string) {
    try {
      const db = await getDatabase();
      if (!isValidObjectId(eventId)) {
        return errorResponse('ID de l\'événement invalide', 400);
      }
      const tirages = await db.collection("tirage")
        .find({ eventId })
        .project({
          _id: 1,
          id: "$_id",
          eventId: 1,
          dateTirage: 1,
          nombreVainqueur: 1,
          createdAt: 1,
          updatedAt: 1
        })
        .sort({ dateTirage: -1 })
        .toArray();

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