import { getDatabase, isValidObjectId } from '@/lib/mongodb';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import {
    EventCreateInput,
    PaginationOptions,
    EventUpdateInput
} from '@/models/eventModel';

import {
    successResponse,
    errorResponse,
    apiErrorHandler
} from '@/lib/apiUtils';
import { ObjectId } from 'mongodb';

export class EventService {

  // Créer un nouveau event
  static async createEvent(data: EventCreateInput): Promise<{ [key: string]: any }> {
    try {
      const db = await getDatabase();

      // Récupérer l'unique tour de la base de données
      const tour = await db.collection('Tour').findOne({}, {
        sort: { createdAt: -1 },
      });

      if (!tour) {
        throw new Error("Aucune tour n'a été trouvée dans la base de données");
      }

      // Utiliser l'ID de la tour récupérée
      const newEvent = await db.collection('Event').insertOne({
        tourId: tour._id.toString(),
        city: data.city,
        venue: data.venue,
        eventDate: new Date(data.eventDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || "en_attente",
        placement: data.placement || [],
        createdAt: new Date(),
      });

      return {
        ...newEvent,
        name: `${data.venue}`,
        message: 'success',
        tourName: tour.name // Inclure le nom de la tour pour référence
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  }

  // Gérer la création d'un nouveau event
  static async handleCreateEvent(request: NextRequest) {
    try {
      const body = await request.json();

      // Validation des champs requis (sans tourId car il sera récupéré automatiquement)
      // status et placement sont maintenant optionnels
      const requiredFields: (keyof Omit<EventCreateInput, 'tourId' | 'status' | 'placement'>)[] = ['city', 'venue','eventDate', 'endDate'];
      const missingFields = requiredFields.filter(field => !body[field]);

      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }

      const userInput: Omit<EventCreateInput, 'tourId'> = {
        city: body.city,
        venue: body.venue,
        eventDate: body.eventDate,
        endDate: body?.endDate,
        status: body.status, // Optionnel
        placement: body.placement, // Optionnel
      };

      // Le tourId sera récupéré automatiquement dans createEvent
      const event = await this.createEvent(userInput as EventCreateInput);

      return successResponse(event, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Récupérer tous les événements avec pagination et recherche
static async getEvents(options: PaginationOptions = {}): Promise<{
    events: any[];
    tour: any | null;
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    }
}> {
    const { page = 1, limit = 10, search = '' } = options;
    const skip = (page - 1) * limit;

    try {
      const db = await getDatabase();
      const whereCondition: Prisma.EventWhereInput = search
        ? {
            OR: [
              { city: { contains: search, mode: 'insensitive' } },
              { venue: { contains: search, mode: 'insensitive' } },
              { status: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      // Récupérer les événements sans _count pour éviter le $lookup MongoDB coûteux
      const [events, total] = await Promise.all([
        db.collection('Event')
          .find(whereCondition, {
            projection: {
              _id: 1,
              id: "$_id",
              city: 1,
              venue: 1,
              eventDate: 1,
              endDate: 1,
              status: 1,
              placement: 1,
            }
          })
          .sort({ eventDate: 1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('Event').countDocuments(whereCondition),
      ]);

      // Compter les participants séparément pour chaque événement
      // Cela évite le problème de $lookup qui charge tous les documents
      const eventIds = events.map(e => e._id);
      const participantCounts = (await db.collection('participant').aggregate([
        {
          $match: {
            eventId: { $in: eventIds }
          }
        },
        {
          $group: {
            _id: "$eventId",
            count: { $sum: 1 },
          }
        }
      ]).toArray()).map(item => ({
        eventId: item._id,
        _count: { id: item.count }
      }));

      // Créer un map pour un accès rapide aux counts
      const countMap = new Map(
        participantCounts.map(pc => [pc.eventId.toString(), pc._count.id])
      );
      const eventsWithCount = events.map(event => ({
        ...event,
        totalParticipants: countMap.get(event._id.toString()) || 0
      }));

      let tour = null;
      try {
        tour = await db.collection('Tour').findOne(
          {},
          {
            sort: { createdAt: -1 }, // descending
            projection: { // equivalent to Prisma `select`
              _id: 1,
              name: 1,
              description: 1,
              startDate: 1,
              endDate: 1,
              status: 1
            }
          }
        );
      } catch (error) {
        console.warn('Erreur lors de la récupération des informations de tour:', error);
      }

      return {
        events: eventsWithCount,
        tour,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw error;
    }
}


  // Gérer la récupération de tous les événements
  // Gérer la récupération de tous les événements
  static async handleGetAllEvent(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '100');
      const page = parseInt(searchParams.get('page') || '1');
      const search = searchParams.get('search') || '';

      const result = await this.getEvents({ page, limit, search });

      // Restructurer la réponse pour avoir events et tour comme propriétés distinctes
      return successResponse({
        events: result.events,
        tour: result.tour
      }, result.pagination, 200, {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      });
    } catch (error) {
      console.error('Erreur dans handleGetAllEvent:', error);
      return apiErrorHandler(error);
    }
  }

  // Mettre à jour un événement existant
  static async updateEvent(id: string, data: EventUpdateInput): Promise<{ [key: string]: any }> {
    try {
      const db = await getDatabase();
      // Vérifier si l'événement existe
      const existingEvent = await db.collection('Event').findOne({ _id: new ObjectId(id) });

      if (!existingEvent) {
        throw new Error(`Événement avec l'ID ${id} non trouvé`);
      }

      // Préparer les données à mettre à jour
      const updateData: Prisma.EventUpdateInput = {};

      // Ajouter uniquement les champs qui sont définis
      if (data.city !== undefined) updateData.city = data.city;
      if (data.venue !== undefined) updateData.venue = data.venue;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
      if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
      if (data.placement !== undefined) updateData.placement = data.placement; // Ajouter placement

      // Mettre à jour l'événement
      const updatedEvent = await db.collection("Event").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        {
          returnDocument: "after",
          projection: {
            _id: 1,
            city: 1,
            venue: 1,
            eventDate: 1,
            endDate: 1,
            status: 1,
            placement: 1,
          }
        }
      );

      return {
        ...updatedEvent,
        message: 'Événement mis à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw error;
    }
  }

  // Gérer la mise à jour d'un événement
  static async handleUpdateEvent(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = params.id;

      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }

      const body = await request.json();

      // Validation de base - au moins un champ à mettre à jour doit être présent
      const updateFields = ['city', 'venue', 'eventDate', 'status','endDate', 'placement'];
      const hasUpdateFields = updateFields.some(field => body[field] !== undefined);

      if (!hasUpdateFields) {
        return errorResponse('Aucun champ à mettre à jour fourni');
      }

      // Préparer les données de mise à jour
      const updateInput: EventUpdateInput = {};

      if (body.city !== undefined) updateInput.city = body.city;
      if (body.venue !== undefined) updateInput.venue = body.venue;
      if (body.eventDate !== undefined) updateInput.eventDate = body.eventDate;
      if (body.status !== undefined) updateInput.status = body.status;
      if (body.endDate !== undefined) updateInput.endDate = body.endDate;
      if (body.placement !== undefined) updateInput.placement = body.placement; // Ajouter placement

      const updatedEvent = await this.updateEvent(id, updateInput);

      return successResponse(updatedEvent);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Obtenir un événement par son ID
  static async getEventById(id: string): Promise<{ [key: string]: any }> {
  try {
    const db = await getDatabase();
    if (!isValidObjectId(id)) {
      throw Object.assign(new Error('ID de l\'événement invalide'), { statusCode: 400 });
    }
    const event = await db.collection("Event").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          _id: 1,
          city: 1,
          venue: 1,
          eventDate: 1,
          endDate: 1,
          status: 1,
          placement: 1,
        }
      }
    );

    if (!event) {
      throw new Error(`Événement avec l'ID ${id} non trouvé`);
    }

    // Compter les participants séparément
    const participantCount = await db.collection('participant').countDocuments({
      eventId: new ObjectId(id),
    });

    let tour = null;
    try {
      tour = await db.collection('Tour').findOne(
        {},
        {
          sort: { createdAt: -1 },
          projection: {
            _id: 1,
            name: 1,
            description: 1,
            startDate: 1,
            endDate: 1,
            status: 1
          }
        }
      );
    } catch (error) {
      console.warn('Erreur lors de la récupération des informations de tour:', error);
    }

    return {
      event: {
        ...event,
        totalParticipants: participantCount
      },
      tour
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    throw error;
  }
}

  // Gérer la récupération d'un événement par ID
  static async handleGetEventById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = params.id;

      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }
      if (!isValidObjectId(id)) {
        return errorResponse('ID de l\'événement invalide', 400);
      }

      const result = await this.getEventById(id);

      return successResponse(result);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }


  // Supprimer un événement
  static async deleteEvent(id: string): Promise<void> {
    try {
      const db = await getDatabase();
      // Vérifier si l'événement existe
      const existingEvent = await db.collection('Event').findOne({
        _id: new ObjectId(id),
      });

      if (!existingEvent) {
        throw new Error(`Événement avec l'ID ${id} non trouvé`);
      }

      // Supprimer l'événement
      await db.collection('Event').deleteOne({
        _id: new ObjectId(id),
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      throw error;
    }
  }

  // Gérer la suppression d'un événement
  static async handleDeleteEvent(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = params.id;

      if (!id) {
        return errorResponse('ID de l\'événement manquant');
      }

      await this.deleteEvent(id);

      return successResponse({ message: 'Événement supprimé avec succès' });
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

static async getEventsWithParticipants(options: PaginationOptions = {}): Promise<{
  events: any[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message: string;
}> {
  const { page = 1, limit = 50, search = '' } = options;
  const skip = (page - 1) * limit;

  // ✅ LIMITE DE SÉCURITÉ COHÉRENTE avec les autres services
  const sanitizedLimit = Math.min(limit, 100); // Max 100 comme les autres services

  try {
    const db = await getDatabase();

    // ✅ CONDITION DE RECHERCHE (cohérent avec getEvents)
    const whereCondition: Prisma.EventWhereInput = search
      ? {
          OR: [
            { city: { contains: search, mode: 'insensitive' } },
            { venue: { contains: search, mode: 'insensitive' } },
            { status: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // ✅ REQUÊTE AVEC PAGINATION (comme getEvents)
    const [events, total] = await Promise.all([
      db.collection('Event')
        .find(whereCondition, {
          projection: {
            _id: 1,
            tourId: 1,
            city: 1,
            venue: 1,
            eventDate: 1,
            endDate: 1,
            status: 1,
            placement: 1,
            createdAt: 1
          }
        })
        .sort({ eventDate: 1 })  // ascending
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('Event').countDocuments(whereCondition),
    ]);

    // ✅ GROUPBY OPTIMISÉ - seulement si on a des événements
    let participantCounts: any = [];
    if (events.length > 0) {
      const eventIds = events.map(e => e._id);
      participantCounts = (await db.collection('participant').aggregate([
        {
          $match: {
            eventId: { $in: eventIds }
          }
        },
        {
          $group: {
            _id: "$eventId",
            count: { $sum: 1 },
          }
        }
      ]).toArray()).map(item => ({
        eventId: item._id,
        _count: { id: item.count }
      }));
    }

    // Créer un map pour un accès rapide aux counts
    const countMap = new Map(
      participantCounts.map(pc => [pc.eventId.toString(), pc._count.id])
    );

    const eventsWithCount = events.map(event => ({
      ...event,
      totalParticipants: countMap.get(event._id.toString()) || 0
    }));

    return {
      events: eventsWithCount,
      pagination: {
        total,
        pages: Math.ceil(total / sanitizedLimit),
        page,
        limit: sanitizedLimit,
        hasMore: page * sanitizedLimit < total
      },
      message: 'Events retrieved successfully'
    };
  } catch (error) {
    console.error('Error fetching events with participants:', error);
    throw error;
  }
}
  static async handleGetEventsWithParticipants(request: NextRequest) {
    try {

      // ✅ RÉCUPÉRER LES PARAMÈTRES (comme handleGetAllEvent)
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const search = searchParams.get('search') || '';

      const result = await this.getEventsWithParticipants({ page, limit, search });
      return successResponse(result);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

}