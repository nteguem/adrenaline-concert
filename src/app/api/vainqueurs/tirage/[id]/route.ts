import { NextRequest } from 'next/server';
import { TirageService } from '@/services/tirageService';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {

  const params = await context.params;

    if (!params?.id) {
      return errorResponse('Tirage ID is required', 400);
    }
  const tirageId = params.id;

  return TirageService.getWinnersByTirageId(tirageId);
}