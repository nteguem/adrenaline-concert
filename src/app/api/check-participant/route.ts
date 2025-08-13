import { NextRequest } from 'next/server';
import { prisma } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/apiUtils";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, eventId } = await request.json();

    if (!email || !eventId) {
      return errorResponse('Email et eventId requis', 400);
    }

    // Utilise la même logique que ton service existant
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        AND: [
          { email: email.toLowerCase().trim() }, 
          { eventId }
        ],
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        createdAt: true,
      }
    });

    return successResponse({
      exists: !!existingParticipant,
      participant: existingParticipant || null
    });

  } catch (error) {
    console.error('Erreur vérification email:', error);
    return errorResponse('Erreur serveur', 500);
  }
}