import { NextRequest } from 'next/server';
import { TirageService } from '@/services/tirageService';
import { errorResponse } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;

    if (!params?.id) {
      return errorResponse('Invalid event ID', 400);
    }

    return await TirageService.getWinnersByEventId(params.id);
  } catch (error) {
    console.error('Error in GET winners:', error);
    return errorResponse('Internal server error', 500);
  }
}
