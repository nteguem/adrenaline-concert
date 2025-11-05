import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from "@/lib/apiUtils";
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { email, eventId } = await request.json();

    if (!email || !eventId) {
      return errorResponse('Email et eventId requis', 400);
    }

    // Utilise la même logique que ton service existant
    const existingParticipant = await db.collection('participant').findOne(
      {
        email: email.toLowerCase().trim(),
        eventId,
      },
      {
        projection: {
          _id: 0,
          id: 1,
          nom: 1,
          prenom: 1,
          createdAt: 1,
        }
      }
    );


    return successResponse({
      exists: !!existingParticipant,
      participant: existingParticipant || null
    });

  } catch (error) {
    console.error('Erreur vérification email:', error);
    return errorResponse('Erreur serveur', 500);
  }
}