import { prisma, ensurePrismaConnected, isValidObjectId } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  ParticipantCreateInput,
  ParticipantUpdateInput,
  PaginationOptions,
} from "@/models/participantModel";

import {
  successResponse,
  errorResponse,
  apiErrorHandler,
} from "@/lib/apiUtils";

const client = new SQSClient({ region: "eu-west-3" });
const queueUrl =
  "https://sqs.eu-west-3.amazonaws.com/126591328691/staging-adrenaline-max-submissions";

export class ParticipantService {
  static async createParticipant(
    data: ParticipantCreateInput
  ): Promise<{ [key: string]: any }> {
    try {
      // TODO: This to be used in deployed environment.
      await client.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            nom: data.nom,
            prenom: data.prenom,
            phone: data.phone ?? "",
            eventId: data.eventId,
            email: data.email,
            dateNaissance: new Date(data.dateNaissance),
            placement: data.placementValues || null,
            ticketUrl: data.ticketUrl || "",
            textInfo: data.textInfo || "",
          }),
        })
      );
      // TODO: This to be used in local environment.
      // const newParticipant = await prisma.participant.create({
      //   data: {
      //     nom: data.nom,
      //     prenom: data.prenom,
      //     phone: data.phone ?? "",
      //     eventId: data.eventId,
      //     email: data.email,
      //     dateNaissance: new Date(data.dateNaissance),
      //     placement: data.placementValues || null,
      //     ticketUrl: data.ticketUrl || "",
      //     textInfo: data.textInfo || "",
      //   },
      // });

      return {
        ...data,
        name: `${data.nom} ${data.prenom}`,
        message: "success",
      };
    } catch (error) {
      console.error("Erreur lors de la création du participant:", error);
      throw error;
    }
  }

  static async handleCreateParticipant(request: NextRequest) {
    try {
      await ensurePrismaConnected();
      const body = await request.json();

      const requiredFields: (keyof ParticipantCreateInput)[] = [
        "nom",
        "prenom",
        "email",
        "dateNaissance",
        "eventId",
      ];
      const missingFields = requiredFields.filter((field) => !body[field]);

      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(", ")}`);
      }

      if (!isValidObjectId(body.eventId)) {
        return errorResponse("ID de l'événement invalide", 400);
      }

      const existingParticipant = await prisma.participant.findFirst({
        where: {
          AND: [{ email: body.email }, { eventId: body.eventId }],
        },
      });

      if (existingParticipant) {
        return errorResponse(
          "Un participant avec cet email est déjà enregistré pour cet événement"
        );
      }

      const participantInput: ParticipantCreateInput = {
        nom: body.nom,
        eventId: body.eventId,
        prenom: body.prenom,
        email: body.email,
        phone: body.phone,
        dateNaissance: body.dateNaissance,
        placementValues: body.placementValues,
        ticketUrl: body.ticketUrl || "",
        textInfo: body.textInfo || "",
      };

      const participant = await this.createParticipant(participantInput);
      return successResponse(participant, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  static async getParticipants(options: PaginationOptions = {}): Promise<{
    participants: any[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    };
  }> {
    const { page = 1, limit = 100, search = "" } = options;
    const sanitizedLimit = Math.min(limit, 500); // Max 500 pour éviter surcharge
    const skip = (page - 1) * sanitizedLimit;

    try {
      await ensurePrismaConnected();
      const whereCondition: Prisma.participantWhereInput = search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" } },
              { prenom: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [participants, total] = await Promise.all([
        prisma.participant.findMany({
          where: whereCondition,
          skip,
          take: sanitizedLimit,
          // Pas de orderBy pour éviter Sort Memory Limit sans index
          select: {
            id: true,
            nom: true,
            prenom: true,
            eventId: true,
            email: true,
            phone: true,
            dateNaissance: true,
            createdAt: true,
            placement: true,
            ticketUrl: true,
            textInfo: true,
          },
        }),
        prisma.participant.count({ where: whereCondition }),
      ]);

      return {
        participants,
        pagination: {
          total,
          pages: Math.ceil(total / sanitizedLimit),
          page,
          limit: sanitizedLimit,
        },
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des participants:", error);
      throw error;
    }
  }

  static async handleGetAllParticipants(request: NextRequest) {
    try {
      await ensurePrismaConnected();

      // ✅ RÉCUPÉRER SEULEMENT LE TOTAL, PAS LES DONNÉES PAGINÉES
      const total = await prisma.participant.count();

      console.log("🔍 [API] Total participants in database:", total);

      const response = successResponse(
        {
          totalParticipants: total, // ← Retourner le total global
          message: `${total} participants trouvés au total`,
        },
        {
          total,
          page: 1,
          limit: 1,
          pages: 1,
        },
        200,
        {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        }
      );

      console.log("📊 [API] Response structure:", {
        success: true,
        data: { totalParticipants: total },
        pagination: { total },
      });

      return response;
    } catch (error) {
      console.error("Erreur dans handleGetAllParticipants:", error);
      return apiErrorHandler(error);
    }
  }

  static async getParticipantsByEventId(
    eventId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    try {
      await ensurePrismaConnected();
      if (!isValidObjectId(eventId)) {
        return errorResponse("ID de l'événement invalide", 400);
      }
      const limit = Math.min(options.limit || 100, 500); // Max 500 pour éviter surcharge
      const page = options.page || 1;
      const skip = (page - 1) * limit;

      // SANS orderBy pour éviter Sort Memory Limit (pas d'index en prod)
      // Les participants seront dans l'ordre d'insertion naturel MongoDB
      const [participants, total] = await Promise.all([
        prisma.participant.findMany({
          where: { eventId },
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            phone: true,
            dateNaissance: true,
            createdAt: true,
            placement: true,
            ticketUrl: true,
            textInfo: true,
          },
          // Pas de orderBy = pas de tri en mémoire = pas d'erreur
          skip,
          take: limit,
        }),
        prisma.participant.count({ where: { eventId } }),
      ]);

      if (!participants.length && page === 1) {
        return errorResponse(
          "Aucun participant trouvé pour cet événement",
          404
        );
      }

      return successResponse(
        {
          participants,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        },
        undefined,
        200,
        {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        }
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des participants:", error);
      return apiErrorHandler(error);
    }
  }

  static async updateParticipant(
    id: string,
    data: ParticipantUpdateInput
  ): Promise<{ [key: string]: any }> {
    try {
      await ensurePrismaConnected();
      if (!isValidObjectId(id)) {
        throw Object.assign(new Error("ID du participant invalide"), {
          statusCode: 400,
        });
      }
      const existingParticipant = await prisma.participant.findUnique({
        where: { id },
      });

      if (!existingParticipant) {
        throw new Error(`Participant avec l'ID ${id} non trouvé`);
      }

      const updateData: Prisma.participantUpdateInput = {};

      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.prenom !== undefined) updateData.prenom = data.prenom;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.dateNaissance !== undefined)
        updateData.dateNaissance = new Date(data.dateNaissance);
      if (data.ticketUrl !== undefined) updateData.ticketUrl = data.ticketUrl;
      if (data.textInfo !== undefined) updateData.textInfo = data.textInfo;
      if (data.placementValues !== undefined)
        updateData.placement = data.placementValues;

      const updatedParticipant = await prisma.participant.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          eventId: true,
          dateNaissance: true,
          placement: true,
          ticketUrl: true,
          textInfo: true,
        },
      });

      return {
        ...updatedParticipant,
        message: "Participant mis à jour avec succès",
      };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du participant:", error);
      throw error;
    }
  }

  static async handleUpdateParticipant(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      await ensurePrismaConnected();
      const id = params.id;

      if (!id) {
        return errorResponse("ID du participant manquant");
      }
      if (!isValidObjectId(id)) {
        return errorResponse("ID du participant invalide", 400);
      }

      const body = await request.json();

      const updateFields = [
        "nom",
        "prenom",
        "email",
        "dateNaissance",
        "placementValues",
        "ticketUrl",
        "textInfo",
      ];
      const hasUpdateFields = updateFields.some(
        (field) => body[field] !== undefined
      );

      if (!hasUpdateFields) {
        return errorResponse("Aucun champ à mettre à jour fourni");
      }

      const updateInput: ParticipantUpdateInput = {};

      if (body.nom !== undefined) updateInput.nom = body.nom;
      if (body.prenom !== undefined) updateInput.prenom = body.prenom;
      if (body.email !== undefined) updateInput.email = body.email;
      if (body.dateNaissance !== undefined)
        updateInput.dateNaissance = body.dateNaissance;
      if (body.placementValues !== undefined)
        updateInput.placementValues = body.placementValues;
      if (body.ticketUrl !== undefined) updateInput.ticketUrl = body.ticketUrl;
      if (body.textInfo !== undefined) updateInput.textInfo = body.textInfo;

      const updatedParticipant = await this.updateParticipant(id, updateInput);

      return successResponse(updatedParticipant);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  static async getParticipantById(id: string): Promise<{ [key: string]: any }> {
    try {
      await ensurePrismaConnected();
      if (!isValidObjectId(id)) {
        throw Object.assign(new Error("ID du participant invalide"), {
          statusCode: 400,
        });
      }
      const participant = await prisma.participant.findUnique({
        where: { id },
        select: {
          id: true,
          nom: true,
          prenom: true,
          eventId: true,
          email: true,
          dateNaissance: true,
          placement: true,
          ticketUrl: true,
          textInfo: true,
        },
      });

      if (!participant) {
        throw new Error(`Participant avec l'ID ${id} non trouvé`);
      }

      return { participant };
    } catch (error) {
      console.error("Erreur lors de la récupération du participant:", error);
      throw error;
    }
  }

  static async handleGetParticipantById(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      await ensurePrismaConnected();
      const id = params.id;

      if (!id) {
        return errorResponse("ID du participant manquant");
      }

      const result = await this.getParticipantById(id);

      return successResponse(result);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  static async deleteParticipant(id: string): Promise<void> {
    try {
      await ensurePrismaConnected();
      if (!isValidObjectId(id)) {
        throw Object.assign(new Error("ID du participant invalide"), {
          statusCode: 400,
        });
      }
      const existingParticipant = await prisma.participant.findUnique({
        where: { id },
      });

      if (!existingParticipant) {
        throw new Error(`Participant avec l'ID ${id} non trouvé`);
      }

      await prisma.participant.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du participant:", error);
      throw error;
    }
  }

  static async handleDeleteParticipant(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      await ensurePrismaConnected();
      const id = params.id;

      if (!id) {
        return errorResponse("ID du participant manquant");
      }

      await this.deleteParticipant(id);

      return successResponse({ message: "Participant supprimé avec succès" });
    } catch (error) {
      return apiErrorHandler(error);
    }
  }
}
