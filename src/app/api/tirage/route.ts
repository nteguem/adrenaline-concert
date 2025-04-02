import { NextRequest } from 'next/server';
import { TirageService } from '@/services/tirageService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/options';
import { errorResponse } from '@/lib/apiUtils';


export async function GET(request: NextRequest) {
//   return TirageService.handleGetAllEvent(request);
}

export async function POST(request: NextRequest) {

  const session = await getServerSession(authOptions);
  
  // Double vérification des permissions (admin uniquement)
  if (!session || !session.user.isAdmin) {
    return errorResponse('Vous devez être administrateur pour faire un tirage', 403);
  }
  return TirageService.handleCreateTirage(request);
}
