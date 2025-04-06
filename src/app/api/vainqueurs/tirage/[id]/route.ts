import { NextRequest } from 'next/server';
import { TirageService } from '@/services/tirageService';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tirageId = params.id;
  
  if (!tirageId) {
    return errorResponse('Tirage ID is required', 400);
  }

  return TirageService.getWinnersByTirageId(tirageId);
}